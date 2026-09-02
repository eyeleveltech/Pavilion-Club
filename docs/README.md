# Documentation

27 specifications in three groups. Load what the task needs, not all of it.

For the build order with every task linked to its spec, see
[../IMPLEMENTATION.md](../IMPLEMENTATION.md).

---

## `system/` — what the system does

Behaviour, data, money, rules. Where this and `ui/` disagree on behaviour, this
one wins.

| | | Read when |
|---|---|---|
| [00-overview.md](system/00-overview.md) | Index and system summary | Starting |
| [01-decisions.md](system/01-decisions.md) | D1–D7, and what would reopen each | Starting |
| [02-rules.md](system/02-rules.md) | **The six non-negotiables** | **Always** |
| [03-stack.md](system/03-stack.md) | Stack, repo layout, conventions | Phase 0 |
| [04-data-model.md](system/04-data-model.md) | Full DDL — 20 tables, constraints, indexes | Schema or query work |
| [05-booking-engine.md](system/05-booking-engine.md) | Availability, pricing, holds, concurrency | Booking work |
| [06-admin-console.md](system/06-admin-console.md) | Every admin screen, exact metric definitions | Phase 1 |
| [07-public-site.md](system/07-public-site.md) | Public pages, booking flow, payment modes, legal | Phase 2 |
| [08-partner-api.md](system/08-partner-api.md) | Turf Town API, auth, error codes, webhooks | Phase 3 |
| [09-money-settlement.md](system/09-money-settlement.md) | Payment methods, refunds, settlement | Phases 1–3 |
| [10-reports-export.md](system/10-reports-export.md) | Reports, Excel export, missed demand | Phase 3 |
| [11-roles-permissions.md](system/11-roles-permissions.md) | Roles, permission matrix, audit | Phase 1 |
| [12-notifications.md](system/12-notifications.md) | Outbox, WhatsApp/SMS templates, OTP | Phase 2 |
| [13-ops-security.md](system/13-ops-security.md) | Hosting, backups, security controls | Phases 0 and 4 |
| [14-build-phases.md](system/14-build-phases.md) | Phase rationale and gates | Planning |
| [15-open-questions.md](system/15-open-questions.md) | What is unanswered, and the default assumed | When blocked |
| [glossary.md](system/glossary.md) | Domain vocabulary, and words to avoid | When naming things |

## `ui/` — how it looks and is built

Design and frontend architecture. Where this and `system/` disagree on
presentation, this one wins.

| | | Read when |
|---|---|---|
| [00-overview.md](ui/00-overview.md) | Two products, opposite goals | Starting UI work |
| [01-principles.md](ui/01-principles.md) | **Six design rules with checkable consequences** | **Always, for UI** |
| [02-design-system.md](ui/02-design-system.md) | Neutral tokens, and the theme-swap guarantee | Any styling |
| [03-patterns.md](ui/03-patterns.md) | Shell, table, slot grid, panel, forms | Building screens |
| [04-states.md](ui/04-states.md) | Empty, loading, error, denied | Every screen |
| [05-responsive.md](ui/05-responsive.md) | Mobile-as-app, bottom tabs, PWA | Every screen |
| [06-screens.md](ui/06-screens.md) | Wireframes | Building screens |
| [07-architecture.md](ui/07-architecture.md) | Server/client split, server actions, folders | Phase 1 start |
| [08-copy-a11y.md](ui/08-copy-a11y.md) | Words and accessibility | Every screen |
| [09-state.md](ui/09-state.md) | Where state lives, and why no store library | Any interactivity |
| [10-build-guide.md](ui/10-build-guide.md) | **Brand tokens + the whole frontend, step by step** | **Building any UI** |

## `client/` — for the client, not the build

| | |
|---|---|
| [build-plan.html](client/build-plan.html) | The plan as a readable page ([published](https://claude.ai/code/artifact/f6821f61-8a48-483b-bb18-7d1f7768f419)) |
| [turf-town-email.md](client/turf-town-email.md) | Draft, ready to send |

> **Note:** `build-plan.html` is the source of a published artifact. Redeploying
> it requires passing that URL explicitly — publishing by file path alone would
> create a second artifact rather than updating the existing one.

---

## Keeping these honest

When an answer arrives from the client or from Turf Town:

1. Move the question to **Answered** in [system/15-open-questions.md](system/15-open-questions.md), with the date
2. Update whichever spec it changes
3. If it changes a decision, update [system/01-decisions.md](system/01-decisions.md)

**Never leave a spec disagreeing with a known answer.** That is how a
specification rots over a nine-week build.
