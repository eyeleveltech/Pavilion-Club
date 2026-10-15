# Online booking: going live checklist

The website is a static export (Hostinger). It books through the **TurfOS keyless
public API** — there is no API key in the site, and none must be added.

## How a booking flows

1. Browser → `GET /api/public/v1/availability?date=` (what is free, indicative prices)
2. Customer enters name, mobile, **email** → `POST /api/public/v1/holds` (10-minute hold; TurfOS prices it)
3. `POST /api/public/v1/bookings/{id}/pay` → Razorpay order; browser opens Razorpay Checkout
4. Razorpay → **TurfOS webhook** confirms the booking (the browser never does)
5. The site polls `GET /api/public/v1/bookings/{id}` until `confirmed`, then shows `/book/pass?ref=…`
6. TurfOS queues the confirmation **email**, sent from the venue's own SMTP account

## One-time setup in the TurfOS admin (venue page)

| Step | Where | Notes |
|---|---|---|
| Allow the website | *Website & email → Websites allowed to take bookings* | Exact origin, e.g. `https://pavilionclub.in` (no path). Add `https://www.…` too if both are used. |
| Razorpay keys | *Payments → Razorpay keys* | Key id, key secret, webhook secret. Test keys (`rzp_test_…`) first. |
| Razorpay webhook | Razorpay dashboard → Webhooks | URL `https://<turfos-host>/api/webhooks/razorpay/<tenant-id>`, event `payment.captured`, same secret as above. |
| Email | *Website & email → Email (SMTP)* | Host, port (465 = SSL ticked), login, sender. Press **Send test** and refresh. |

TurfOS must be running with the worker (`apps/worker`) — it sends the emails and expires holds.

## Building the site

Live TurfOS: **https://clubops.theeyelevelstudio.com**. It must be running the TurfOS
version with `/api/public/v1` (migrations 0030–0032) before a site built against it can book.

```powershell
$env:NEXT_PUBLIC_TURFOS_API_URL = 'https://clubops.theeyelevelstudio.com'   # not a secret; baked in at build
.\build-hostinger.ps1
```

The script refuses to build without it, or with a `localhost` URL.

## Before launch

- **Rotate the old TurfOS API keys.** Two `tk_live_…` keys were committed to this repo's
  history (and one shipped in the browser bundle). Revoke both in TurfOS and treat them as public.
  The removed keys could confirm bookings without payment through the keyed `/bookings/{id}/confirm` endpoint.
- Make one real ₹ payment on test keys end to end (hold → pay → webhook → email) — see
  `TurfOS_Go_Live_Gap.md`: no real Razorpay order has ever been created.
- Venue details differ between sources (home page says Anna Nagar West; TurfOS venue says Adyar).
  The pass page and email show the **TurfOS venue** address, so correct it there.

## My bookings

Players sign in with a 6-digit code emailed from the venue's SMTP account (TurfOS
`/api/public/v1/me/*`, migration `0031`). It needs the venue's email set up — without it the page
says sign-in is unavailable. The answer to "send me a code" is the same whether or not the address
has booked, so the page cannot be used to find out who the customers are. Cancelling shows the
refund from the venue's policy before the player confirms.

## Known gaps

- Pack redemption still calls the old `_backend` routes, which do not exist in a static build.
- Bookings are in whole hours. Half-hour slots need a change in the TurfOS booking engine.
- The public API is rate limited per client address but is not authentication. It cannot confirm a
  booking or accept a price, so a forged `Origin` only exposes what the site already shows.
