const fs = require('fs');
const path = require('path');

const qrDataUri = fs.readFileSync('C:/Users/Pc/Documents/Eyelevel/Pavilion-Club/apps/web/public/assets/qr/qr_data_uri.txt', 'utf8').trim();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0">
  <title>The Pavilion Club · Services Story Poster</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1080px;
      height: 1920px;
      background: #040810;
      color: #FBF8F1;
      font-family: 'Montserrat', sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 80px 70px;
      -webkit-font-smoothing: antialiased;
    }

    /* Ambient luxury background glow */
    .bg-glow-top {
      position: absolute;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 900px;
      height: 700px;
      background: radial-gradient(circle, rgba(201, 169, 110, 0.15) 0%, rgba(4, 8, 16, 0) 70%);
      pointer-events: none;
    }
    .bg-glow-center {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(201, 169, 110, 0.12) 0%, rgba(4, 8, 16, 0) 75%);
      pointer-events: none;
    }
    .bg-glow-bottom {
      position: absolute;
      bottom: -150px;
      left: 50%;
      transform: translateX(-50%);
      width: 850px;
      height: 600px;
      background: radial-gradient(circle, rgba(14, 25, 45, 0.7) 0%, rgba(4, 8, 16, 0) 70%);
      pointer-events: none;
    }

    /* Outer Framing */
    .frame-border {
      position: absolute;
      inset: 36px;
      border: 1px solid rgba(201, 169, 110, 0.35);
      pointer-events: none;
    }
    .frame-border-inner {
      position: absolute;
      inset: 48px;
      border: 1px solid rgba(201, 169, 110, 0.18);
      pointer-events: none;
    }
    .corner-ornament {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #C9A96E;
    }
    .corner-tl { top: 48px; left: 48px; border-top: 2px solid #C9A96E; border-left: 2px solid #C9A96E; }
    .corner-tr { top: 48px; right: 48px; border-top: 2px solid #C9A96E; border-right: 2px solid #C9A96E; }
    .corner-bl { bottom: 48px; left: 48px; border-bottom: 2px solid #C9A96E; border-left: 2px solid #C9A96E; }
    .corner-br { bottom: 48px; right: 48px; border-bottom: 2px solid #C9A96E; border-right: 2px solid #C9A96E; }

    /* Top Brand Section */
    .header {
      width: 100%;
      text-align: center;
      position: relative;
      z-index: 2;
    }
    .brand-eyebrow {
      font-size: 14px;
      letter-spacing: 0.38em;
      text-transform: uppercase;
      color: #C9A96E;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .brand-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 64px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #FBF8F1;
      line-height: 1.05;
      margin-bottom: 12px;
    }
    .brand-location {
      font-size: 15px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(251, 248, 241, 0.65);
      margin-bottom: 24px;
      font-weight: 400;
    }
    .gold-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin: 0 auto;
      max-width: 440px;
    }
    .gold-divider .line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201, 169, 110, 0.6), transparent);
    }
    .gold-divider .diamond {
      width: 7px;
      height: 7px;
      background: #C9A96E;
      transform: rotate(45deg);
    }

    /* Core Hero Callout */
    .hero-callout {
      text-align: center;
      margin-top: 18px;
    }
    .hero-badge {
      display: inline-block;
      padding: 6px 18px;
      border: 1px solid rgba(201, 169, 110, 0.4);
      background: rgba(201, 169, 110, 0.08);
      font-size: 13px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #C9A96E;
      border-radius: 999px;
      margin-bottom: 14px;
      font-weight: 600;
    }
    .hero-heading {
      font-family: 'Cormorant Garamond', serif;
      font-size: 42px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #FBF8F1;
      line-height: 1.2;
    }

    /* QR Code Showcase Card */
    .qr-showcase {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 20px 0;
    }
    .qr-card {
      background: linear-gradient(145deg, rgba(20, 30, 50, 0.75), rgba(7, 14, 25, 0.95));
      border: 1px solid rgba(201, 169, 110, 0.45);
      border-radius: 24px;
      padding: 38px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(201, 169, 110, 0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .qr-card-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: #C9A96E;
    }
    .qc-tl { top: 12px; left: 12px; border-top: 2px solid #C9A96E; border-left: 2px solid #C9A96E; }
    .qc-tr { top: 12px; right: 12px; border-top: 2px solid #C9A96E; border-right: 2px solid #C9A96E; }
    .qc-bl { bottom: 12px; left: 12px; border-bottom: 2px solid #C9A96E; border-left: 2px solid #C9A96E; }
    .qc-br { bottom: 12px; right: 12px; border-bottom: 2px solid #C9A96E; border-right: 2px solid #C9A96E; }

    .qr-wrapper {
      background: #FBF8F1;
      padding: 16px;
      border-radius: 16px;
      box-shadow: inset 0 0 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img {
      width: 320px;
      height: 320px;
      display: block;
    }

    .scan-action {
      margin-top: 22px;
      text-align: center;
    }
    .scan-text {
      font-size: 16px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-weight: 700;
      color: #C9A96E;
      margin-bottom: 6px;
    }
    .scan-url {
      font-size: 14px;
      letter-spacing: 0.12em;
      color: rgba(251, 248, 241, 0.85);
      font-weight: 400;
    }

    /* Services Feature Grid */
    .services-grid {
      width: 100%;
      max-width: 940px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      position: relative;
      z-index: 2;
      margin: 10px 0;
    }
    .service-item {
      background: rgba(14, 25, 45, 0.6);
      border: 1px solid rgba(201, 169, 110, 0.22);
      border-radius: 14px;
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .service-num {
      font-size: 11px;
      font-weight: 700;
      color: #C9A96E;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
    .service-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22px;
      font-weight: 600;
      color: #FBF8F1;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }
    .service-desc {
      font-size: 12px;
      color: rgba(251, 248, 241, 0.65);
      line-height: 1.45;
      font-weight: 400;
    }

    /* Footer Bottom CTA */
    .footer {
      width: 100%;
      text-align: center;
      position: relative;
      z-index: 2;
    }
    .story-tip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(201, 169, 110, 0.12);
      border: 1px solid rgba(201, 169, 110, 0.35);
      padding: 10px 24px;
      border-radius: 30px;
      margin-bottom: 18px;
    }
    .story-tip svg {
      width: 18px;
      height: 18px;
      fill: #C9A96E;
    }
    .story-tip span {
      font-size: 13px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 600;
      color: #FBF8F1;
    }
    .footer-site {
      font-size: 13px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: rgba(201, 169, 110, 0.9);
      font-weight: 600;
    }
    .footer-address {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(251, 248, 241, 0.5);
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <!-- Decorative Background Glows -->
  <div class="bg-glow-top"></div>
  <div class="bg-glow-center"></div>
  <div class="bg-glow-bottom"></div>

  <!-- Decorative Outer Frames -->
  <div class="frame-border"></div>
  <div class="frame-border-inner"></div>
  <div class="corner-ornament corner-tl"></div>
  <div class="corner-ornament corner-tr"></div>
  <div class="corner-ornament corner-bl"></div>
  <div class="corner-ornament corner-br"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand-eyebrow">EST. 2024 · MOGAPPAIR, CHENNAI</div>
    <h1 class="brand-title">The Pavilion Club</h1>
    <div class="brand-location">Premier Pickleball & Movement Destination</div>
    <div class="gold-divider">
      <div class="line"></div>
      <div class="diamond"></div>
      <div class="line"></div>
    </div>
    <div class="hero-callout">
      <span class="hero-badge">Direct Access Directory</span>
      <h2 class="hero-heading">Explore All Club Services</h2>
    </div>
  </div>

  <!-- Central QR Code Showcase -->
  <div class="qr-showcase">
    <div class="qr-card">
      <div class="qr-card-corner qc-tl"></div>
      <div class="qr-card-corner qc-tr"></div>
      <div class="qr-card-corner qc-bl"></div>
      <div class="qr-card-corner qc-br"></div>

      <div class="qr-wrapper">
        <img class="qr-img" src="${qrDataUri}" alt="The Pavilion Club Services QR Code" />
      </div>

      <div class="scan-action">
        <div class="scan-text">SCAN WITH PHONE CAMERA</div>
        <div class="scan-url">https://thepavilionclub.com/services/</div>
      </div>
    </div>
  </div>

  <!-- Club Services Feature Grid -->
  <div class="services-grid">
    <div class="service-item">
      <span class="service-num">01 · SPORT</span>
      <h3 class="service-name">Pro Pickleball Courts</h3>
      <p class="service-desc">4 Tournament-grade outdoor courts with shock cushioning & pro night lighting.</p>
    </div>

    <div class="service-item">
      <span class="service-num">02 · STUDIO</span>
      <h3 class="service-name">The Studio Mogappair</h3>
      <p class="service-desc">Dance, Pilates, Yoga & Zumba in a premium air-conditioned movement floor.</p>
    </div>

    <div class="service-item">
      <span class="service-num">03 · ACADEMY</span>
      <h3 class="service-name">Pickleball Academy</h3>
      <p class="service-desc">Curated coaching cohorts, drills, and masterclasses led by certified trainers.</p>
    </div>

    <div class="service-item">
      <span class="service-num">04 · HIRE</span>
      <h3 class="service-name">Studio Floor Rentals</h3>
      <p class="service-desc">Private rehearsals, workshop venue hire, and multi-camera content shoots.</p>
    </div>

    <div class="service-item">
      <span class="service-num">05 · EVENTS</span>
      <h3 class="service-name">Corporate & Buyouts</h3>
      <p class="service-desc">Full club takeovers, corporate leagues, and curated celebrations with hospitality.</p>
    </div>

    <div class="service-item">
      <span class="service-num">06 · LIFESTYLE</span>
      <h3 class="service-name">Wellness Cafe & Pro Desk</h3>
      <p class="service-desc">Artisanal refreshments, hydration bar, and professional paddle demo trials.</p>
    </div>
  </div>

  <!-- Bottom Instagram Story Prompt -->
  <div class="footer">
    <div class="story-tip">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      <span>Point Camera to Scan · Or Tap Link in Bio</span>
    </div>
    <div class="footer-site">THEPAVILIONCLUB.COM/SERVICES</div>
    <div class="footer-address">The Pavilion Club · Mogappair West, Chennai · 06:00 AM – 11:00 PM</div>
  </div>
</body>
</html>`;

const outputPath = 'C:/Users/Pc/Documents/Eyelevel/Pavilion-Club/pavilion_services_story_poster.html';
fs.writeFileSync(outputPath, html, 'utf8');
console.log('SUCCESS: Poster HTML written to ' + outputPath);
