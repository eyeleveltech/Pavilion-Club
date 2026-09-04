---
id: 14-production-runbook
title: Production Runbook & Operator Guidelines
status: approved
audience: desk-staff, manager, owner, devops
---

# 14 - Production Runbook & Operator Guidelines

This document is the official operational standard operating procedure (SOP) for **Pavilion Club** staff, managers, and owners.

---

## 1. Front Desk Receptionist SOP (Suresh)

### Morning Shift Start
1. Open Chrome/Safari on desk tablet/PC: `https://pavilionclub.in/admin/login`
2. Sign in with phone: `9876543210` and password.
3. Check the **Now Board (`/admin`)**:
   - Verify today'\''s opening cash float in the register (default: ?2,000).
   - Review current and upcoming games on Court 1, 2, and 3.

### Booking a Walk-in Game (< 20 seconds)
1. Click **"+ Book a Slot"** (`/admin/book`).
2. Tab is on **"Player Match Booking"**.
3. Select Date, Court, and 1-hour time slot.
4. Enter player'\''s 10-digit mobile number:
   - The system automatically checks repeat player history.
   - If player exists, their name is auto-filled. If new, enter their name.
5. Select Payment Mode:
   - **Cash Received**: Collect exact cash, place in drawer.
   - **Card Swiped (POS)**: Swipe player card on physical swipe terminal.
6. Click **"Payment received — Confirm booking"**:
   - System prints the receipt / shows booking reference (`PC-XXXXXX`).
   - WhatsApp confirmation with golden receipt link is dispatched automatically.

### Handling Damaged Court / Maintenance (Blackout)
1. On `/admin/book`, click the **"Maintenance Blackout (Off-Duty)"** tab.
2. Select Court and Slot.
3. Click a preset reason (e.g. *Net & Court Maintenance*, *Emergency Roof Leak*) or type custom details.
4. Click **"Confirm Maintenance Block"**:
   - The court slot is instantly blocked on the Desk, online portal, and Turf Town.

### Nightly Daily Close (Zero-Leakage Handover)
1. At closing time, navigate to **Daily Close (`/admin/close`)**.
2. Count the physical cash bills and coins in the cash drawer.
3. Enter the counted amount in the **Physical Cash Counted** field:
   - The system displays expected counter cash, card totals, and any discrepancy (`variance_paise`).
4. Select the receiving manager (Anand Verma).
5. Hand over the physical cash pouch and click **"Complete Daily Close & Sign-Off"**.
6. The register is locked for the business date, creating an immutable audit trail.

---

## 2. Venue Manager SOP (Anand Verma)

### Daily Operations Audit
1. Sign in with manager phone `9876543211` (`/admin/login`).
2. Review **Daily Close** records:
   - Confirm receipt of cash pouch from Suresh.
   - Verify variance is ?0.
3. Audit any **Price Overrides**:
   - Review the mandatory written reasons logged by staff.

### Weekly Partner Settlement (Turf Town)
1. On Mondays, open **Reports & Settlements (`/admin/reports`)**.
2. Click the **"Partner Settlements"** tab.
3. Select channel: **Turf Town**.
4. Set period (e.g. last Monday to Sunday) and click **"Generate Settlement Invoice"**:
   - System calculates total partner bookings, gross amount, commission (e.g. 15%), and net payable to Pavilion Club.
5. When Turf Town bank transfer is credited:
   - Click **"Mark Settled"**: System automatically updates ledger and writes settlement payment rows.
6. If uncollectible, click **"Write Off"** with a mandatory explanation.

### Generating Financial & Demand Reports
1. In `/admin/reports`:
   - View Source Breakdown (Website, Walk-in, Phone, Turf Town).
   - Click **"Export to Excel (.xlsx)"**: Downloads a certified 2-sheet spreadsheet with summary and itemized bookings.
   - Review **"Missed Demand"** to evaluate if opening earlier or closing later is profitable.

---

## 3. Owner Daily SOP (Jayaraman)

### Nightly 2-Minute Audit
1. Log in on mobile (`https://pavilionclub.in/admin/login`).
2. Verify 3 metrics:
   - **Total Revenue Today** vs Bank deposits + Cash collected.
   - **Cash Handover Status**: Ensure daily close is "Completed" and signed off.
   - **Court Utilization Rate**: Ensure courts achieved >85% evening occupancy.

---

## 4. Disaster Recovery (DR) Runbook (< 15 Minutes Recovery)

In case of Hostinger VPS crash or catastrophic server loss:

1. **Provision New VPS**:
   - Launch clean Ubuntu 24.04 LTS VPS on Hostinger.
   - Install Docker & Docker Compose: `curl -fsSL https://get.docker.com | sh`.

2. **Clone & Configure**:
   ```bash
   git clone <repo-url> /opt/pavilion
   cd /opt/pavilion
   cp .env.production.example .env
   # Populate secrets from offline vault
   ```

3. **Restore Encrypted Database Dump**:
   ```bash
   # Download latest encrypted backup from Cloudflare R2 / Backblaze:
   # pavilion_backup_YYYY-MM-DD.sql.gz.enc
   docker compose up -d postgres
   node scripts/restore.mjs /path/to/backup.sql.gz.enc
   ```

4. **Launch Application & Automatic TLS**:
   ```bash
   docker compose up -d --build
   ```

5. **Verify Live Health**:
   ```bash
   curl -I https://pavilionclub.in/api/health
   # Must return 200 OK with {"status":"healthy"}
   ```

Recovery is complete. Uptime monitoring automatically resumes.
