# The Pavilion Club — Client Corrections Task Sheet

**Document Version:** 2.0  
**Date:** October 29, 2026  
**Project:** The Pavilion Club (Web & Booking Platform)  
**Deployment Status:** Production Live via GitHub Actions & Hostinger LFTP (`https://thepavilionclub.com/`)

---

## 1. Summary Status Tracker

| Task # | Category | Request / Description | Status | Environment | Tested | Live Deployed |
|---|---|---|---|---|---|---|
| **TASK-01** | Hero Section | Remove text `THREE COURTS · PICKLEBALL` (with gold dot) from hero meta | ✅ **COMPLETED** | Production | ✅ Yes | ✅ **YES** (Live) |
| **TASK-02** | Client Feedback | Ramya akka corrections (Mobile background lines removal on manifesto/desk and mobile spacing refinements) | ✅ **COMPLETED** | Mobile / Web | ✅ Yes | ⏳ Local Approved |
| **TASK-03** | Booking Flow | Payment-ku munaadi Confirm Booking kodutha **Email OTP verification** vekanum *(Real OTP logic + Name error clearing deployed; UI styling alignment once Harish provides Figma)* | ✅ **LOGIC & GATE LIVE** *(Harish UI refinements pending)* | Production | ✅ Yes | ✅ **YES** (Live) |
| **TASK-04** | Responsive UI | Mobile view-ku footer alignments & spacing refinements (< 480px, 390px, 360px) | 🎯 **NEXT ACTIVE TASK** | Local → Staging | Ready to execute | ⏳ Queued |
| **TASK-05** | Court Config | Unwanted courts (Gym studios) disable pannanum | ✅ **COMPLETED** | Front Desk / TurfOS | ✅ Yes | ✅ **YES** (Active in TurfOS) |
| **TASK-06** | Partner API | **Turf Town Integration** (Two-way availability, auto-hold, booking sync & settlement) | 📋 **DOCUMENTED / READY** | Core / API | Architecture Ready | ⏳ Awaiting Partner Keys |
| **TASK-07** | Content & Maps | **Venue Address Verification** (Client confirmed: Plot Nos. 1 & 2, Door Nos. 191/2A2, 191/2A3, 191/2A4 updated across all pages, editorial & match passes) | ✅ **COMPLETED** | All Pages & Maps | ✅ Yes | ✅ **YES** (Live) |

---

## 2. Detailed Task Breakdown

### ✅ TASK-01: Remove "THREE COURTS · PICKLEBALL" from Hero Section
- **Status:** ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (Live on `https://thepavilionclub.com/`).
- **Target Files Updated:**
  - `apps/web/public/index.html`
  - `apps/web/public/editorial/index.html`
  - `apps/web/public/assets/editorial-body.html`
  - `apps/web/src/components/public/editorial/EditorialLandingView.tsx`
- **Result:** Top-left hero metadata cleanly displays `• MOGAPPAIR EAST · CHENNAI`. Subtitle tag `• THREE COURTS · PICKLEBALL` removed.

---

### ✅ TASK-02: Ramya Akka's Feedback & Corrections
- **Status:** ✅ **COMPLETED & APPROVED BY CLIENT / USER** (Tested locally).
- **Items Resolved:**
  1. **Background Hairline Grid Removal on Mobile**: Removed vertical court cut lines (`.has-lines { background-image: none !important; }` at `@media (max-width: 900px)`) that were cutting through the manifesto, desk, and paragraph text on mobile screens.
  2. **Mobile Section Spacing Refinements**:
     - Reduced large gap between `to LAST RALLY.` and the first card `06:00 AM` on mobile (`.day__pin` padding-top, `.day__track` gap, and `.lede` margin tightened).
     - Reduced large 176px empty gap between `Last rally` (end of day timeline) and `.stats` numbers (`03 | 17 hrs`) on mobile to an exact matching ~133px balanced spacing.
  3. **Mobile Fullscreen Menu Font Size Reduction**: Reduced oversized fullscreen overlay navigation links (`COURTS`, `THE CLUB`, `COURT-SIDE`, `MEMBERSHIP`, `BOOKING`, `FIND US`) from `43.6px` down to `~26.6px` (`clamp(1.35rem, 5.5vw, 1.9rem)`) with sleek 49px tap targets.

---

### ✅ TASK-03: Booking Flow — Pre-Payment Email OTP Verification Gate & Popup UI
- **Status:** ✅ **Real TurfOS Public API Integration Live & Form Validation Fixed** (`156c976`).
  - *UI Design Note:* Harish is designing visual UI/Figma. Current live popup is 100% operational with 6 segmented digits, countdown timer, and direct TurfOS headless email OTP engine. If Harish delivers visual Figma specs, modal styling will be adjusted.
- **Implemented Flow (Live & Active):**
  1. Player selects date, time slot, and court.
  2. Player enters Name, Phone number (+91...), and **Email address**.
  3. Form validation: Typing in name, phone, or email immediately clears any red field errors.
  4. Action bar button displays **"Verify email & proceed"**.
  5. Clicking the button opens the **Email OTP Verification Modal**:
     - Auto-dispatches real 6-digit verification code to the customer's email inbox via TurfOS (`requestLoginCode`).
     - 6 segmented auto-advancing digit inputs with paste and backspace support.
     - 60-second cooldown timer for resend.
     - "Change email" option to correct typos on the fly.
  6. Upon verifying the 6-digit OTP via TurfOS (`verifyLoginCode`), the player's session is authenticated, court hold is secured, and flow opens Razorpay checkout.

---

### 🎯 TASK-04: Mobile View Footer Alignments & Responsive Polish
- **Status:** 🎯 **ACTIVE NEXT TASK (Can be executed immediately)**.
- **Specification:**
  - Mobile screens (< 480px, 390px, 360px)-la footer layout:
    - Pavilion brand logo centering & size balance.
    - Tagline text hierarchy and comfortable line breaks.
    - Footer links: Instead of awkward 2-column or unbalanced layout, stack cleanly or grid gracefully with tap-friendly touch targets.
    - Contact list icons (Phone, Email, WhatsApp, Instagram) with consistent spacing and accessible tap areas.
    - Copyright & architecture credits neatly aligned at bottom.
- **Target Files:**
  - `apps/web/public/assets/css/editorial.css`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/components/public/PublicFooter.tsx`

---

### ✅ TASK-05: Unwanted Courts (Gym Studios) Disable
- **Status:** ✅ **COMPLETED** (Configured via TurfOS console).
- **Verification:** ✅ Verified via TurfOS venue availability API — Gym studios are completely disabled and hidden from the public booking calendar. Only the 3 championship Pickleball courts (Court 1, Court 2, Court 3) are active and bookable.

---

### 📋 TASK-06: Turf Town Marketplace API Integration
- **Status:** 📋 **Documented & Architecture Ready**.
- **Request:** Pavilion Club courts-ah Turf Town mobile marketplace app-la list panni, two-way automated calendar sync pannanum to prevent double bookings.
- **Next Step / Requirements:**
  - Send the partner integration email to Turf Town (`partners@turftown.in` / account manager) using [`docs/client/turf-town-email.md`](docs/client/turf-town-email.md) to receive their sandbox API credentials and webhook URL.

---

### ✅ TASK-07: Venue Address Verification & Universal Update
- **Status:** ✅ **COMPLETED & DEPLOYED TO PRODUCTION** (Live in commit `1337ffb`).
- **Confirmed Registered Venue Address:**
  ```text
  The Pavilion Club
  Plot Nos. 1 & 2, Door Nos. 191/2A2, 191/2A3, 191/2A4,
  Velammal School Road, JJ Nagar, TS Krishna Nagar,
  Mogappair East, Chennai - 600037
  ```
- **Files Verified & Updated:**
  1. `apps/web/public/index.html` (`#venue` section & Google Maps link)
  2. `apps/web/public/editorial/index.html`
  3. `apps/web/public/assets/editorial-body.html`
  4. `apps/web/src/components/public/editorial/EditorialLandingView.tsx`
  5. `apps/web/src/app/contact/page.tsx`
  6. `apps/web/src/components/public/DigitalMatchPassActions.tsx` (WhatsApp match invite & Google Calendar location)
  7. Google Maps directions URL (`https://maps.google.com/?q=The+Pavilion+Club,+Velammal+School+Road,+Mogappair+East,+Chennai+-+600037`)

---

## 3. Production Verification & CI/CD Status
- [x] ✅ **CI/CD Pipeline Fixed**: Replaced `next/font/google` with local self-hosted luxury fonts in `156c976`.
- [x] ✅ **GitHub Actions Run #27**: 100% SUCCESS across all 6 steps.
- [x] ✅ **Live Healthcheck**: `https://thepavilionclub.com/` returns HTTP 200 OK via Hostinger LiteSpeed.
- [x] ✅ **TASK-01 Live**: Hero meta subtitle removed.
- [x] ✅ **TASK-03 Live**: Real Email OTP gate & reactive form error clearing active on `/book/`.
- [x] ✅ **TASK-05 Live**: Court 1–3 only.
- [ ] 🎯 **TASK-04**: In Progress (Mobile footer responsiveness).
