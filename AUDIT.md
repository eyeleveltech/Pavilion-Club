# Audit — 4 September 2026

Independent check of the repository against the specification in `docs/`.
Commit audited: `5ab1e81` ("phase 4").

Every finding below is backed by a command or a file and line. Where I could not
verify something, it is listed in §6 rather than assumed.

---

## 1. Headline

A large amount of real work is here. The engine, the schema, the admin console,
the public booking flow, the partner API and the reporting layer all exist. The
checklist in `IMPLEMENTATION.md` shows 84 items ticked.

**But four things are broken in ways that matter, and one whole component was
never built.**

| | |
|---|---|
| `packages/core` | **142 tests pass.** Genuinely solid |
| `pnpm test` | **Cannot run.** Fails at startup without `.env`, then hangs |
| `pnpm typecheck` | **Fails.** 2 errors |
| CI | **Red.** Has never been able to pass — see §2.2 |
| The concurrency gate | **Written, but not gating anything** |
| Background worker | **Does not exist.** No sweeper, no messages sent |

The checklist says Phase 4 is complete. On the evidence, **Phase 0's own merge
gate is not enforced** and **no customer could receive a booking confirmation.**

This is not a criticism of the volume of work — it is a lot, and most of it is
good. It is a statement that the verification layer is not doing its job, which
is exactly how the important defects survived.

---

## 2. Blockers — fix before anything else

### 2.1 The OTP code is returned to the caller

**Severity: critical. Blocks any public launch.**

`apps/web/src/app/api/public/otp/send/route.ts:23`

```ts
return NextResponse.json({ ok: true, devCode: result.devCode });
```

`packages/db/src/repositories/notifications.ts` returns `devCode: codeStr`
unconditionally. **There is no `NODE_ENV` check anywhere in the path.**

Anyone can POST any phone number to this endpoint and receive that phone's
verification code in the HTTP response. Phone verification is therefore not
verification — it is a formality anyone can bypass, including for a phone number
they do not control.

`docs/system/12-notifications.md` already required the opposite:

> In development the code MAY be returned in the response. This MUST be disabled
> in production by an explicit environment check, not by a comment.

**Fix:** gate on `process.env.NODE_ENV !== 'production'`, and prefer removing
`devCode` from the repository's return type entirely so the route cannot leak
it. Add a test asserting the field is absent when `NODE_ENV=production`.

### 2.2 CI has never been able to pass

**Severity: critical. Everything downstream depends on it.**

Three separate faults, each sufficient on its own.

**(a) `vitest.config.ts:1` throws when `.env` is absent**

```ts
process.loadEnvFile?.('.env');
```

The `?.` guards the *method* existing, not the *file*. On a runner with no
`.env` this throws `ENOENT` before any test is collected. Reproduced:

```
Error: ENOENT: no such file or directory, open '.../.env'
  at process.loadEnvFile
```

GitHub Actions checks out a clean tree with no `.env`, so `pnpm test` dies at
startup. **Fix:** `try { process.loadEnvFile?.('.env'); } catch {}`.

**(b) `pnpm typecheck` fails — 2 errors**

```
packages/db/src/restore-rehearsal.test.ts(4,27): error TS7016
  Could not find a declaration file for module '../../../scripts/backup.mjs'
packages/db/src/restore-rehearsal.test.ts(5,37): error TS7016
  Could not find a declaration file for module '../../../scripts/restore.mjs'
```

**Fix:** add a `scripts/*.d.ts`, or convert the two scripts to TypeScript.

> Note for the record: a first run showed 3,875 errors. That was my machine —
> `pnpm install` had not been run for the workspace packages. After installing,
> **2 remain.** Do not chase the larger number.

**(c) CI runs no database, so the gate is skipped**

`.github/workflows/ci.yml` has no `services:` block and sets no `DATABASE_URL`.
`vitest.config.ts` excludes `**/*.integration.test.ts` when `DATABASE_URL` is
unset — and the gate is `packages/db/src/concurrency-gate.integration.test.ts`.

**So the 100-concurrent-booking gate — the entire reason Phase 0 exists — is
silently skipped in CI. It gates nothing.**

`docs/system/02-rules.md` R2 requires it to block merge.

**Fix:** add a `postgres:18` service to the workflow, set `DATABASE_URL`, run
migrations, then run the full suite.

### 2.3 Five test files hang without a database

**Severity: high. It is why nobody noticed 2.2.**

These import `createDb()` but are **not** named `*.integration.test.ts`, so the
exclude never catches them:

```
packages/db/src/auth/auth.test.ts
packages/db/src/e2e-operational-flow.test.ts
packages/db/src/partner-and-reporting.test.ts
packages/db/src/public-booking-flow.test.ts
packages/db/src/restore-rehearsal.test.ts
```

Reproduced — with no `DATABASE_URL`, `vitest run packages/db` completes exactly
one file (`permission-matrix-ci.test.ts`, 4 tests) and then **hangs until
killed**.

**Fix:** rename all five to `*.integration.test.ts`. They are integration tests;
the name should say so.

---

## 3. The background worker does not exist

**Severity: high. Blocks go-live, not development.**

`apps/worker/` is absent. `pnpm-workspace.yaml` expects it; nothing is there.

**`expireStaleHolds` is defined and called from nowhere.** Verified across all
source excluding `dist`:

```
packages/db/src/repositories/sweeper.ts:4:export async function expireStaleHolds(...)
```

One definition. Zero call sites.

Nothing in the repository schedules anything — no `setInterval`, no cron, no job
runner. Grep for `setInterval|node-cron|cron(` across `packages/*/src`,
`apps/web/src` and `scripts` returns nothing.

**What that means in practice:**

| Job | Spec | Reality |
|---|---|---|
| Hold sweeper, 30s | `docs/system/13-ops-security.md` | Never runs. Expired holds clear only via the `23P01` retry, so a lapsed hold keeps showing as taken on the grid until someone tries to book it |
| Message outbox drain | Every 15s | **Never runs. No customer has ever been sent anything** |
| Webhook outbox drain | Every 15s | Never runs. Turf Town is never told a slot was blocked |
| Refund drain | 5m | Never runs |
| Mark bookings completed | Hourly | Never runs. Bookings stay `confirmed` forever |
| Same-day reminders | 09:00 | Never runs |
| Owner daily summary | 23:45 | Never runs |

**And there is no messaging provider at all.** Grep for
`aisensy|interakt|msg91|2factor|twilio` across the source returns nothing.
`queueNotificationMessage` writes a row to `message_outbox`; nothing ever reads
it.

So: **booking confirmations, OTP delivery, reminders and cancellation notices
are all queued and none are sent.** OTP "works" today only because the code is
returned in the API response — which is finding 2.1. Fixing 2.1 without building
the sender will stop customer login working entirely.

**These two must be fixed together.**

---

## 4. Smaller findings

| # | Finding | Evidence |
|---|---|---|
| 4.1 | **OTP plaintext stored in the outbox.** `messageOutbox.payload` is written as `{ code: codeStr }` — a jsonb column retained 90 days. The `otp_codes` table correctly stores only a hash; this undoes it | `notifications.ts`, insert into `messageOutbox` |
| 4.2 | **OTP rate limit is per-phone only.** Spec requires per-IP as well; without it, an attacker cycles phone numbers freely | `notifications.ts`, 3-per-15-min on `phone` |
| 4.3 | **`markSettlementInvoiced` missing.** Lifecycle is `pending → invoiced → settled`; only `createSettlement`, `markSettlementSettled` and `writeOffSettlement` exist, so a settlement cannot be recorded as invoiced | `repositories/reports-settlements.ts` |
| 4.4 | **`/about` and `/contact` do not exist.** Both are in `docs/system/07-public-site.md` | `apps/web/src/app/` |
| 4.5 | **`/cancellation` is an empty stub.** The build reports it at **237 B** against 1.62 kB for the real `/cancellation-policy`. It is a duplicate route with no content — delete it, or it will be found by a customer | `next build` output |
| 4.6 | **Three landing-page concepts are uncommitted** — `docs/ui/landing-concept.html`, `landing-taste.html`, `landing-v3.html`. Either commit or delete them; untracked work is lost work | `git status` |
| 4.7 | **No Razorpay webhook route.** Correct for now — deferred by decision (Q20), site runs on `pay_at_venue`. Listed so it is not mistaken for an oversight | — |

### Good news worth recording

- The hex-colour lint passes: *"No raw hex colours found in .tsx files."* The
  brand token discipline held.
- `packages/core` is unchanged and still 142 green. The engine is sound.
- The permission-matrix CI guard runs without a database and passes — the one
  gate that genuinely gates.
- Partner API v1, source-wise Excel export (SheetJS), missed-demand and
  occupancy reports all exist with real implementations.
- PWA manifest and icons are in place.
- **`next build` succeeds.** 68 routes compile, static and dynamic segments
  resolve correctly. The application is deployable — which makes the CI failures
  more frustrating, not less: the code is in better shape than its verification
  layer suggests.

---

## 5. Pending work

### Before anything else
- [ ] Fix the OTP `devCode` leak (§2.1)
- [ ] Make `pnpm test` runnable without `.env` (§2.2a)
- [ ] Fix the 2 typecheck errors (§2.2b)
- [ ] Add Postgres to CI and run the gate there (§2.2c)
- [ ] Rename the 5 hanging test files (§2.3)

### Then
- [ ] Build `apps/worker` — sweeper, outbox drains, completion, reminders, summary (§3)
- [ ] Integrate a WhatsApp BSP and SMS fallback (§3)
- [ ] Stop writing OTP plaintext into `message_outbox` (§4.1)
- [ ] Per-IP OTP rate limiting (§4.2)
- [ ] `markSettlementInvoiced` (§4.3)
- [ ] `/about`, `/contact`; resolve the duplicate cancellation page (§4.4, §4.5)

### Still outstanding from the original plan
- [ ] Send the Turf Town email — `docs/client/turf-town-email.md`, still unsent
- [ ] Submit WhatsApp Business templates — 3–7 days approval, on someone else's clock
- [ ] Buy the Hostinger VPS; register the domain
- [ ] The real price grid (Q16) — seed values are placeholders
- [ ] Razorpay account and KYC, before switching off `pay_at_venue`
- [ ] Staff training and a parallel-running week

---

## 6. What I could not verify

Stated plainly so this audit is not read as more than it is.

**Anything requiring a database.** I do not have the Postgres password, so I
could not apply the migrations, run the concurrency gate, or exercise a single
repository. **Every DB-backed claim in the checklist is unverified by me** —
including the gate itself, which the developer reports as passing locally.

**That the application runs correctly.** `next build` passes (68 routes), but a
successful build only proves it compiles — not that a page renders the right
thing against real data.

**Visual and UX conformance** to `docs/ui/10-build-guide.md` — the brand tokens,
the gold-contrast rule, the five states per screen, mobile behaviour. Needs a
running app and a browser.

**Whether the gate is correct**, as opposed to present. It exists and is
excluded from CI; I have not seen it pass.

---

## 7. One scope question for the client

The venue has a **fitness centre, a banquet hall and a cafe**. No specification
file mentions any of them, and courts are the only bookable thing in the system.

That may well be right for Phase 1 — but it should be a decision on the record
rather than an omission nobody noticed. Worth one question to the client before
go-live.

---

## 8. Suggested order

1. **§2 in full.** Until CI is green and the gate actually gates, every "done"
   in the checklist is an assertion rather than a fact.
2. **§3, worker plus messaging, together.** Fixing the OTP leak without a sender
   breaks customer login, so they ship as one piece.
3. **§4**, smallest first.
4. Re-run this audit and update the checklist to what is then true.

The most valuable single change is **2.2c** — a Postgres service in CI. It costs
about ten lines of YAML and converts roughly forty untested assertions into
verified ones.
