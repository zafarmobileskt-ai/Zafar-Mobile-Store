import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="20" y="20" width="472" height="472" rx="84" fill="none" stroke="#334155" stroke-width="6"/>
  
  <!-- Smartphone Frame -->
  <rect x="136" y="64" width="240" height="384" rx="40" fill="#0B0F17" stroke="url(#accent)" stroke-width="12"/>
  
  <!-- Speaker & Notch -->
  <rect x="216" y="96" width="80" height="10" rx="5" fill="#475569"/>
  <circle cx="256" cy="414" r="16" fill="url(#accent)"/>
  
  <!-- Stylized Z Logo with Shield / Speed Lines -->
  <path d="M184 180 H328 L200 310 H328" stroke="url(#emerald)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <!-- Sparkle dot -->
  <circle cx="316" cy="180" r="10" fill="#F59E0B"/>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="accentMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="emeraldMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <!-- Full background covering entire 512x512 without rounded corners for maskable safe-zone -->
  <rect width="512" height="512" fill="url(#bgMask)"/>
  
  <!-- Centered Scaled Content in Safe Zone (80% box: 512 * 0.8 = 410px) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="136" y="64" width="240" height="384" rx="40" fill="#0B0F17" stroke="url(#accentMask)" stroke-width="14"/>
    <rect x="216" y="96" width="80" height="10" rx="5" fill="#475569"/>
    <circle cx="256" cy="414" r="16" fill="url(#accentMask)"/>
    <path d="M184 180 H328 L200 310 H328" stroke="url(#emeraldMask)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="316" cy="180" r="10" fill="#F59E0B"/>
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Save standard SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg);

  // 2. Generate PNG sizes
  const sizes = [
    { name: 'icon-192.png', size: 192, svg: standardSvg },
    { name: 'icon-512.png', size: 512, svg: standardSvg },
    { name: 'icon-1024.png', size: 1024, svg: standardSvg },
    { name: 'icon-maskable-192.png', size: 192, svg: maskableSvg },
    { name: 'icon-maskable-512.png', size: 512, svg: maskableSvg },
    { name: 'icon-maskable-1024.png', size: 1024, svg: maskableSvg },
    { name: 'apple-touch-icon.png', size: 180, svg: standardSvg },
    { name: 'favicon-32x32.png', size: 32, svg: standardSvg },
    { name: 'favicon-16x16.png', size: 16, svg: standardSvg }
  ];

  for (const item of sizes) {
    const outputPath = path.join(publicDir, item.name);
    await sharp(Buffer.from(item.svg))
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // 3. Create dummy screenshots for PWABuilder rich PWA standard
  const mobileScreenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 960" width="540" height="960">
    <rect width="540" height="960" fill="#0B0F17"/>
    <rect x="20" y="20" width="500" height="60" rx="12" fill="#171B26" stroke="#334155"/>
    <text x="40" y="58" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="20">ZAFAR MOBILE STORE</text>
    <rect x="20" y="100" width="240" height="90" rx="12" fill="#13231B" stroke="#059669"/>
    <rect x="280" y="100" width="240" height="90" rx="12" fill="#1E1B2E" stroke="#7C3AED"/>
    <rect x="20" y="210" width="500" height="700" rx="16" fill="#111520" stroke="#1E293B"/>
    <text x="40" y="250" fill="#38BDF8" font-family="sans-serif" font-weight="bold" font-size="16">LIVE INVENTORY &amp; IMEI TRACKER</text>
  </svg>`;

  const desktopScreenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <rect width="1280" height="720" fill="#0B0F17"/>
    <rect x="0" y="0" width="1280" height="64" fill="#0F172A" stroke="#1E293B"/>
    <text x="32" y="40" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="22">ZAFAR MOBILE STORE - POS &amp; MANAGEMENT</text>
    <rect x="32" y="90" width="280" height="110" rx="12" fill="#13231B" stroke="#059669"/>
    <rect x="330" y="90" width="280" height="110" rx="12" fill="#1E1B2E" stroke="#7C3AED"/>
    <rect x="630" y="90" width="280" height="110" rx="12" fill="#1E2433" stroke="#2563EB"/>
    <rect x="930" y="90" width="318" height="110" rx="12" fill="#261A16" stroke="#D97706"/>
    <rect x="32" y="220" width="1216" height="460" rx="16" fill="#111520" stroke="#1E293B"/>
  </svg>`;

  await sharp(Buffer.from(mobileScreenshotSvg))
    .resize(540, 960)
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log('Generated screenshot-mobile.png');

  await sharp(Buffer.from(desktopScreenshotSvg))
    .resize(1280, 720)
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log('Generated screenshot-desktop.png');
}

generate().catch(console.error);
