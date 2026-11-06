/**
 * The Pavilion Club · Runtime Production Configuration (Hostinger / Apache)
 *
 * HOW TO USE ON HOSTINGER:
 * 1. Go to Hostinger hPanel -> thepavilionclub.com -> Manage -> File Manager -> public_html.
 * 2. Create or edit the file named: club-config.js (NOT .example.js).
 * 3. Paste your live or test Razorpay Key ID below.
 * 4. Save. No rebuild or redeployment required!
 *
 * NOTE: club-config.js is ignored in git so your keys remain 100% private.
 */
window.__PAVILION_CONFIG__ = {
  // Replace with your actual key: 'rzp_live_xxxxxxxxxxxx' or 'rzp_test_xxxxxxxxxxxx'
  razorpayKeyId: 'rzp_live_PASTE_YOUR_KEY_HERE',
};

