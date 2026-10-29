# The Pavilion Club — Client Corrections Task Sheet

**Document Version:** 1.9  
**Date:** October 28, 2026  
**Project:** The Pavilion Club (Web & Booking Platform)  
**Deployment Policy:** **LOCAL TESTING ONLY** — Do NOT deploy to live / production (`main` / Hostinger) until client review and explicit approval.

---

## 1. Summary Status Tracker

| Task # | Category | Request / Description | Status | Environment | Tested Locally | Live Deployed |
|---|---|---|---|---|---|---|
| **TASK-01** | Hero Section | Remove text `THREE COURTS · PICKLEBALL` (with gold dot) from hero meta | ✅ **COMPLETED** | Local Only | ✅ Yes | ⏳ **NO** (Local Only) |
| **TASK-02** | Client Feedback | Ramya akka soldra corrections | ⏳ **PENDING DETAILS** | Local | Pending | ❌ **NO** |
| **TASK-03** | Booking Flow | Payment-ku munaadi Confirm Booking kodutha **Email OTP verification** vekanum *(Popup UI: Harish design)* | ⏳ **AWAITING HARISH'S UI DESIGN** (Logic Ready) | Local Only | ✅ Yes (Functional) | ❌ **NO** (Local Only) |
| **TASK-04** | Responsive UI | Mobile view-ku footer alignments & spacing refinements | 📋 **DOCUMENTED / READY** | Local | Queued | ❌ **NO** |
| **TASK-05** | Court Config | Unwanted courts (Gym studios) disable pannanum | ✅ **COMPLETED** | Front Desk / TurfOS | ✅ Yes | ✅ Active in TurfOS |
| **TASK-06** | Partner API | **Turf Town Integration** (Two-way availability, auto-hold, booking sync & settlement) | 📋 **DOCUMENTED / READY** | Core / API | Queued | ❌ **NO** |
| **TASK-07** | Content & Maps | **Venue Address Verification** (Client kitta correct address vaangi site full-ah update pannanum) | ⏳ **AWAITING CLIENT ADDRESS** | All Pages & Maps | Pending | ❌ **NO** |

---

## 2. Detailed Task Breakdown

### ✅ TASK-01: Remove "THREE COURTS · PICKLEBALL" from Hero Section
- **Status:** ✅ **COMPLETED LOCALLY** (Verified on `http://localhost:3001`).
- **Target Files:**
  - `apps/web/public/index.html`
  - `apps/web/public/editorial/index.html`
  - `apps/web/public/assets/editorial-body.html`
  - `apps/web/src/components/public/editorial/EditorialLandingView.tsx`
- **Result:** Top-left hero metadata cleanly displays `• MOGAPPAIR EAST · CHENNAI`. Subtitle tag `• THREE COURTS · PICKLEBALL` removed.

---

### ⏳ TASK-02: Ramya Akka's Feedback & Corrections
- **Status:** ⏳ **Pending specific itemized checklist from Ramya akka**.
- **Action Required:** Capture all specific design, typography, layout, or content edits once shared.

---

### ⏳ TASK-03: Booking Flow — Pre-Payment Email OTP Verification Gate & Popup UI
- **Status:** ⏳ **Core Logic & State Management Complete — Awaiting Harish's Final UI Design Specs**.
- **UI Design Note:** Harish is designing the official visual UI/Figma for the OTP verification popup. Once Harish provides the design components/specifications, the popup styling will be aligned to his exact layout.
- **Implemented Flow (Functional & Tested Locally):**
  1. Player selects date, time slot, and court.
  2. Player enters Name, Phone number (+91...), and **Email address**.
  3. Action bar button displays **"Verify email & proceed"**.
  4. Clicking the button opens the **Email OTP Verification Modal**:
     - 6 segmented auto-advancing digit inputs with paste, backspace, and arrow key support.
     - 60-second countdown timer for resend.
     - "Change email" option to correct typos on the fly.
     - Real Email OTP dispatch connected via TurfOS. No dev codes or test pills.
  5. Upon verifying the 6-digit OTP, the player's email is authenticated, slot hold is locked, and flow seamlessly transitions to Razorpay payment.
- **Next Step:** Update [`apps/web/src/components/public/book/EmailOtpModal.tsx`](apps/web/src/components/public/book/EmailOtpModal.tsx) with Harish's final design layout once received.
- **Validation Fix (Completed):** Resolved issue where typing into the Full Name, Phone, or Email fields did not clear the red error message. Added reactive error clearing to all inputs on onChange.

---

### 📋 TASK-04: Mobile View Footer Alignments
- **Status:** 📋 **Queued for styling review**.
- **Specification:**
  - Mobile screens (< 480px, 390px, 360px)-la footer alignment-ah polish pannanum:
    - Pavilion brand logo centering & size balance.
    - Tagline text hierarchy.
    - Club navigation & booking link lists cleanly stacked.
    - Contact list icons (Phone, Email, WhatsApp, Instagram) with consistent tap targets and alignment.
    - Copyright & architecture credits neatly aligned at the bottom.
- **Target Files:**
  - `apps/web/public/assets/css/editorial.css`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/components/public/PublicFooter.tsx`

---

### ✅ TASK-05: Unwanted Courts (Gym Studios) Disable
- **Status:** ✅ **COMPLETED** (Configured by user directly via Front Desk / TurfOS console).
- **Verification:** ✅ Verified via TurfOS venue availability API — Gym studios are completely disabled and hidden from the public booking calendar. Only the 3 championship Pickleball courts (Court 1, Court 2, Court 3) are active and bookable.

---

### 📋 TASK-06: Turf Town Marketplace API Integration
- **Status:** 📋 **Documented & Architecture Ready**.
- **Request:** Pavilion Club courts-ah Turf Town mobile marketplace app-la list panni, two-way automated calendar sync pannanum to prevent double bookings.
- **Integration Architecture:**
  1. **Two-Way Real-time Availability Sync (`GET /api/v1/partner/availability`)**:
     - Turf Town app calls Pavilion Club API to fetch live available court slots. Front-desk offline bookings or website bookings instantly reflect as blocked in Turf Town.
  2. **Pre-Payment Lock / Hold (`POST /api/v1/partner/hold`)**:
     - Turf Town places a 10-minute hold on the selected court before collecting payment from the player, eliminating race conditions with front-desk walk-ins.
  3. **Instant Booking Confirmation (`POST /api/v1/partner/confirm`)**:
     - Once payment succeeds on Turf Town, booking is confirmed in Pavilion Club with channel tagged as `Turf Town`, distinct amber badge (`#B5822A`), and partner reference ID (e.g. `TT-99182`).
  4. **Automated Cancellation Sync (`POST /api/v1/partner/cancel`)**:
     - When player cancels on Turf Town, webhook releases the court immediately for resale. No refund processed by venue (Turf Town refunds customer directly).
  5. **Settlement & Commission Engine**:
     - Tracks gross revenue, partner commission (15% standard / 1500 bps), and net payout balances.
- **Next Step / Requirements:**
  - Send the partner integration email to Turf Town (`partners@turftown.in` / account manager) using [`docs/client/turf-town-email.md`](docs/client/turf-town-email.md) to receive their sandbox API credentials and webhook URL.

---

### ⏳ TASK-07: Venue Address Verification & Universal Update
- **Status:** ⏳ **Awaiting Client Address Input**.
- **Request:** Client-kitta irundhu exact registered postal address & location landmark vaangi website full-ah update pannanum.
- **Current Address in Codebase:**
  ```text
  The Pavilion Club
  Plot No. 1 & 2, Door No. 191/2A2, 191/2A3, 191/2A4,
  Velammal School Road, JJ Nagar, TS Krishna Nagar,
  Mogappair East, Chennai - 600037
  ```
- **Files to Update once new address is received:**
  1. `apps/web/public/index.html` (`#venue` section & Google Maps link)
  2. `apps/web/public/editorial/index.html`
  3. `apps/web/public/assets/editorial-body.html`
  4. `apps/web/src/components/public/editorial/EditorialLandingView.tsx`
  5. `apps/web/src/app/contact/page.tsx`
  6. `apps/web/src/app/terms/page.tsx`
  7. `apps/web/src/app/privacy/page.tsx`
  8. `apps/web/src/app/cancellation-policy/page.tsx`
  9. Google Maps directions URL (`https://maps.google.com/?q=...`)

---

## 3. Local Verification & Deployment Safeguard

- [x] ✅ **TASK-01**: Verified on `http://localhost:3001` (Text removed, 0 errors, all 167 unit tests pass)
- [ ] ⏳ **TASK-02**: Pending Ramya akka's notes
- [x] ⏳ **TASK-03**: Logic implemented & working locally — **Awaiting Harish's final UI design**
- [ ] 📋 **TASK-04**: Mobile footer responsive testing
- [x] ✅ **TASK-05**: Verified via TurfOS availability API (Gym studios disabled, only Pickleball Courts 1–3 active)
- [ ] 📋 **TASK-06**: Turf Town API key issuance & sandbox testing
- [ ] ⏳ **TASK-07**: Pending client address details
- [x] 🛡️ **Git Remote Guard**: Strictly local — **0 commits pushed to `origin/main`**.
