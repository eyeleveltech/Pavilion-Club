---
id: 12-whatsapp-templates
title: Meta WhatsApp Business Template Submission & Approval Dossier
status: ready-for-submission
audience: client, venue-owner, developer, operations
---

# 🏸 Meta WhatsApp Business Template Submission & Approval Dossier

> [!IMPORTANT]
> **Why Submit on Day One?**
> Meta WhatsApp Business template review typically takes **24 to 72 hours** (sometimes approved in under 1 hour by automated checks). Submitting these templates immediately ensures that WhatsApp confirmation and OTP services are active prior to public launch.

---

## 📋 Master Template Directory

| # | Template Name | Category | Language | Audience | Trigger Event |
|---|---|---|---|---|---|
| 1 | `booking_confirmed` | `UTILITY` | `en` (English) | Customer | Player confirms match pass (Online or Desk) |
| 2 | `booking_reminder` | `UTILITY` | `en` (English) | Customer | 09:00 AM IST on the day of match |
| 3 | `booking_cancelled` | `UTILITY` | `en` (English) | Customer | Slot cancelled by player or counter desk |
| 4 | `booking_rescheduled`| `UTILITY` | `en` (English) | Customer | Desk moves booking to a new court or time |
| 5 | `otp_verification` | `AUTHENTICATION` | `en` (English) | Customer | Player login or match verification |
| 6 | `daily_summary` | `UTILITY` | `en` (English) | Venue Owner | 23:45 IST nightly cash & occupancy close |

---

## 1. `booking_confirmed` (Customer Match Pass)

- **Template Name**: `booking_confirmed`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Header Type**: `TEXT`
  - **Header Text**: `🏸 Booking Confirmed — The Pavilion Club`
- **Body Text**:
```text
Hi {{1}}, your badminton court booking at The Pavilion Club Adyar is confirmed!

📋 Booking Ref: {{2}}
🏸 Court: {{3}}
📅 Date: {{4}}
⏰ Time: {{5}}
💰 Amount: ₹{{6}} (100% Pay at Venue — Cash/UPI)

📍 Venue Address:
4th Main Road, Gandhi Nagar, Adyar, Chennai 600020 (Near Besant Ave)

👟 Important Guidelines:
• Non-marking badminton shoes strictly required on synthetic courts.
• Please arrive 10 minutes prior to your slot. Lockers & showers available.
```
- **Footer Text**: `The Pavilion Club · Premier Badminton Arena`
- **Buttons**:
  1. **Quick Reply / Dynamic URL**:
     - Type: `URL`
     - Button Label: `View Match Pass`
     - URL: `https://pavilionclub.in/my-bookings`
  2. **Phone Call**:
     - Type: `PHONE_NUMBER`
     - Button Label: `Call Reception`
     - Phone: `+919840012345`

### Variable Mapping & Meta Sample Values
| Variable | Field Description | Sample Value Required by Meta |
|---|---|---|
| `{{1}}` | Player Full Name | `Rahul Sharma` |
| `{{2}}` | Booking Reference | `PC-260929-1A3B` |
| `{{3}}` | Court Name | `Court 1 (BWF Synthetic)` |
| `{{4}}` | Match Date | `Tuesday, 29 Sep 2026` |
| `{{5}}` | Time Slot | `07:00 AM – 08:00 AM` |
| `{{6}}` | Total Payable (INR) | `800` |

---

## 2. `booking_reminder` (Day-of-Play Reminder)

- **Template Name**: `booking_reminder`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Header Type**: `TEXT`
  - **Header Text**: `🏸 Match Reminder — Today at The Pavilion Club`
- **Body Text**:
```text
Hi {{1}}, friendly reminder for your upcoming badminton game today at The Pavilion Club Adyar!

🏸 Court: {{2}}
⏰ Time: {{3}}
📋 Booking Ref: {{4}}

📍 4th Main Road, Gandhi Nagar, Adyar, Chennai 600020

Please remember non-marking gum-sole shoes. Dedicated parking and hot-water shower rooms are ready for you. See you on court!
```
- **Footer Text**: `The Pavilion Club · Adyar, Chennai`
- **Buttons**:
  1. **URL**:
     - Button Label: `Google Maps Directions`
     - URL: `https://maps.google.com/?q=Adyar+Chennai`
  2. **Phone**:
     - Button Label: `Call Reception`
     - Phone: `+919840012345`

### Variable Mapping & Meta Sample Values
| Variable | Field Description | Sample Value Required by Meta |
|---|---|---|
| `{{1}}` | Player Full Name | `Rahul Sharma` |
| `{{2}}` | Court Name | `Court 2` |
| `{{3}}` | Time Slot | `06:00 PM – 07:00 PM` |
| `{{4}}` | Booking Reference | `PC-260929-8F9E` |

---

## 3. `booking_cancelled` (Fair Play Cancellation)

- **Template Name**: `booking_cancelled`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Header Type**: `TEXT`
  - **Header Text**: `🏸 Booking Cancellation Notice`
- **Body Text**:
```text
Hi {{1}}, your badminton booking (Ref: {{2}}) for {{3}} on {{4}} at The Pavilion Club has been cancelled.

Per our Fair Play Booking Policy, your court slot has been released back into the arena pool with zero cancellation penalty. 

We look forward to hosting you on court another day!
```
- **Footer Text**: `The Pavilion Club · Fair Play Policy`
- **Buttons**:
  1. **URL**:
     - Button Label: `Book Another Slot`
     - URL: `https://pavilionclub.in/book`

### Variable Mapping & Meta Sample Values
| Variable | Field Description | Sample Value Required by Meta |
|---|---|---|
| `{{1}}` | Player Name | `Rahul Sharma` |
| `{{2}}` | Booking Reference | `PC-260929-1A3B` |
| `{{3}}` | Court & Time | `Court 1 (07:00 AM – 08:00 AM)` |
| `{{4}}` | Match Date | `29 Sep 2026` |

---

## 4. `booking_rescheduled` (Desk Court/Time Move)

- **Template Name**: `booking_rescheduled`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Header Type**: `TEXT`
  - **Header Text**: `🏸 Slot Rescheduled — The Pavilion Club`
- **Body Text**:
```text
Hi {{1}}, your booking (Ref: {{2}}) at The Pavilion Club Adyar has been rescheduled by our reception desk.

🏸 New Court: {{3}}
📅 New Date: {{4}}
⏰ New Time: {{5}}

Previous slot: {{6}}. All other booking details and your pay-at-venue tariff remain unchanged.
```
- **Footer Text**: `The Pavilion Club · Front Desk`
- **Buttons**:
  1. **URL**:
     - Button Label: `View Updated Pass`
     - URL: `https://pavilionclub.in/my-bookings`
  2. **Phone**:
     - Button Label: `Call Reception`
     - Phone: `+919840012345`

### Variable Mapping & Meta Sample Values
| Variable | Field Description | Sample Value Required by Meta |
|---|---|---|
| `{{1}}` | Player Name | `Rahul Sharma` |
| `{{2}}` | Booking Reference | `PC-260929-1A3B` |
| `{{3}}` | New Court | `Court 3` |
| `{{4}}` | New Date | `Wednesday, 30 Sep 2026` |
| `{{5}}` | New Time Slot | `08:00 AM – 09:00 AM` |
| `{{6}}` | Previous Slot Info | `29 Sep at 07:00 AM` |

---

## 5. `otp_verification` (Authentication Code)

- **Template Name**: `otp_verification`
- **Category**: `AUTHENTICATION`
- **Language**: English (`en`)
- **Body Text**:
```text
{{1}} is your verification code for The Pavilion Club. Valid for 5 minutes. Do not share this OTP with anyone.
```
- **Footer Text**: `The Pavilion Club Security`
- **Buttons**:
  1. **Copy Code**:
     - Type: `COPY_CODE`
     - Text: `Copy Code`

### Variable Mapping & Meta Sample Values
| Variable | Field Description | Sample Value Required by Meta |
|---|---|---|
| `{{1}}` | 6-digit One Time Password | `482910` |

---

## 6. `daily_summary` (Nightly Owner Close Alert)

- **Template Name**: `daily_summary`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Header Type**: `TEXT`
  - **Header Text**: `📊 Nightly Arena Close — The Pavilion Club`
- **Body Text**:
```text
The Pavilion Club — Operational Close Report for {{1}}:

🏸 Total Games Played: {{2}} court-hours
💰 Cash Collected at Counter: ₹{{3}}
💳 UPI / Card Payments: ₹{{4}}
💵 Register Discrepancy: ₹{{5}}
📅 Tomorrow's Advance Occupancy: {{6}}%

Closed by: {{7}} at {{8}}.
```
- **Footer Text**: `The Pavilion Club · Internal Audit`

### Variable Mapping & Meta Sample Values
| Variable | Field Description | Sample Value Required by Meta |
|---|---|---|
| `{{1}}` | Business Date | `29 Sep 2026` |
| `{{2}}` | Total Booked Hours | `42` |
| `{{3}}` | Counter Cash Sum | `16,800` |
| `{{4}}` | Electronic UPI/POS Sum | `18,400` |
| `{{5}}` | Drawer Discrepancy | `0` |
| `{{6}}` | Next Day Occupancy % | `85` |
| `{{7}}` | Staff Operator Name | `Suresh (Front Desk)` |
| `{{8}}` | Closing Timestamp | `23:45 IST` |

---

## 🚀 How to Submit to Meta in 5 Minutes

### Option A: Via Meta Business Manager Direct
1. Go to [business.facebook.com](https://business.facebook.com/) &rarr; **All Tools** &rarr; **WhatsApp Manager**.
2. Select your WhatsApp Business Account (WABA).
3. In the left sidebar, click **Account Tools** &rarr; **Message Templates**.
4. Click **Create Template**:
   - Choose **Category**: `Utility` (or `Authentication` for OTP).
   - Enter **Name**: e.g., `booking_confirmed`.
   - Select **Language**: `English`.
5. Copy-paste the **Header**, **Body**, and **Buttons** from above.
6. In the **Sample Content** modal, fill in the sample values provided in each table above.
7. Click **Submit**. Approval status will update to **Approved** within 1 to 24 hours.

### Option B: Via WhatsApp BSP (AiSensy, Interakt, or WATI)
1. Log in to your BSP dashboard (e.g. AiSensy or Interakt).
2. Go to **Manage** &rarr; **Template Messages** &rarr; **New Template Request**.
3. Paste the exact text and select category `Utility`.
4. The BSP automatically routes the request to Meta's API.

---

## 🛡️ Meta Approval Guarantee Checklist
- [x] **No Promotional Language in Utility**: Does NOT contain words like "Discount", "Offer", "Sale", or "Coupon", preventing misclassification as `Marketing`.
- [x] **Samples Provided**: Every single placeholder (`{{1}}`, `{{2}}`, etc.) has realistic sample text provided.
- [x] **Clear Transactional Context**: Explicitly identifies the customer, venue name, and booking reference.
