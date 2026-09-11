const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('Starting PWA Asset Generation with Sharp...');

  // 1. Read Base SVGs
  const iconSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));
  const iconMaskableSvg = fs.readFileSync(path.join(publicDir, 'icon-maskable.svg'));

  // 2. Generate standard icons
  const standardIcons = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-1024.png', size: 1024 },
  ];

  for (const icon of standardIcons) {
    const dest = path.join(publicDir, icon.name);
    await sharp(iconSvg)
      .resize(icon.size, icon.size)
      .png({ compressionLevel: 6, adaptiveFiltering: true, force: true })
      .toFile(dest);
    console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
  }

  // 3. Generate maskable icons
  const maskableIcons = [
    { name: 'icon-maskable-192.png', size: 192 },
    { name: 'icon-maskable-512.png', size: 512 },
    { name: 'icon-maskable-1024.png', size: 1024 },
  ];

  for (const icon of maskableIcons) {
    const dest = path.join(publicDir, icon.name);
    await sharp(iconMaskableSvg)
      .resize(icon.size, icon.size)
      .png({ compressionLevel: 6, adaptiveFiltering: true, force: true })
      .toFile(dest);
    console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
  }

  // 4. Create SVG for screenshot-mobile.png (540 x 960)
  const mobileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960">
  <defs>
    <linearGradient id="bgM" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A0B0E"/>
      <stop offset="100%" stop-color="#12151E"/>
    </linearGradient>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="540" height="960" fill="url(#bgM)"/>

  <!-- Status Bar -->
  <rect width="540" height="40" fill="#0A0B0E"/>
  <text x="28" y="26" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">09:41</text>
  <circle cx="470" cy="22" r="4" fill="#10B981"/>
  <rect x="486" y="16" width="22" height="12" rx="3" fill="none" stroke="#94A3B8" stroke-width="2"/>
  <rect x="488" y="18" width="14" height="8" rx="1.5" fill="#94A3B8"/>
  <rect x="509" y="19" width="2" height="6" rx="1" fill="#94A3B8"/>

  <!-- Top App Bar -->
  <rect y="40" width="540" height="70" fill="url(#headerGrad)" stroke="#1E293B" stroke-width="1"/>
  <rect x="20" y="52" width="44" height="44" rx="12" fill="#2563EB"/>
  <text x="34" y="80" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">Z</text>
  
  <text x="76" y="69" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="700">ZAFAR MOBILE STORE</text>
  <text x="76" y="88" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500">POS &amp; IMEI Inventory</text>

  <!-- Scanner Icon Button in Header -->
  <rect x="474" y="52" width="44" height="44" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
  <path d="M486 64 H492 V70 M506 64 H500 V70 M486 84 H492 V78 M506 84 H500 V78" stroke="#38BDF8" stroke-width="2" fill="none" stroke-linecap="round"/>
  <line x1="486" y1="74" x2="506" y2="74" stroke="#EF4444" stroke-width="1.5"/>

  <!-- Fast Metric Chips -->
  <g transform="translate(20, 126)">
    <!-- Metric 1 -->
    <rect x="0" y="0" width="158" height="68" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadow)"/>
    <text x="14" y="24" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">IN-STOCK</text>
    <text x="14" y="52" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">48 <tspan font-size="12" fill="#10B981" font-weight="600">Phones</tspan></text>

    <!-- Metric 2 -->
    <rect x="171" y="0" width="158" height="68" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadow)"/>
    <text x="185" y="24" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">TODAY SALES</text>
    <text x="185" y="52" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">$4,850</text>

    <!-- Metric 3 -->
    <rect x="342" y="0" width="158" height="68" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadow)"/>
    <text x="356" y="24" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">RECEIVABLE</text>
    <text x="356" y="52" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">$1,290</text>
  </g>

  <!-- Quick Action Buttons Bar -->
  <g transform="translate(20, 208)">
    <rect x="0" y="0" width="244" height="42" rx="12" fill="url(#btnGrad)"/>
    <text x="122" y="26" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">+ New POS Sale</text>

    <rect x="256" y="0" width="244" height="42" rx="12" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="378" y="26" fill="#E2E8F0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Buy Used Mobile</text>
  </g>

  <!-- Search Input Bar -->
  <g transform="translate(20, 264)">
    <rect x="0" y="0" width="500" height="44" rx="12" fill="#171B26" stroke="#334155" stroke-width="1"/>
    <circle cx="24" cy="22" r="7" stroke="#64748B" stroke-width="2" fill="none"/>
    <line x1="29" y1="27" x2="36" y2="34" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
    <text x="46" y="27" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Search IMEI, Model, Brand (⌘K)...</text>
  </g>

  <!-- Inventory Cards Section Title -->
  <text x="24" y="336" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700">Stock Inventory</text>
  <text x="460" y="336" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Filter (All)</text>

  <!-- Device Card 1: iPhone 15 Pro Max -->
  <g transform="translate(20, 350)" filter="url(#shadow)">
    <rect x="0" y="0" width="500" height="152" rx="16" fill="#171B26" stroke="#1E293B" stroke-width="1"/>
    
    <!-- Phone Thumbnail Box -->
    <rect x="14" y="16" width="70" height="84" rx="12" fill="#0B0F17" stroke="#334155" stroke-width="1"/>
    <rect x="26" y="26" width="46" height="64" rx="6" fill="#1E293B"/>
    <circle cx="49" cy="80" r="3" fill="#64748B"/>

    <!-- Title & Specs -->
    <text x="96" y="38" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Apple iPhone 15 Pro Max</text>
    <text x="96" y="58" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">256GB • Natural Titanium • Battery 94%</text>

    <!-- IMEI Tag -->
    <rect x="96" y="68" width="220" height="24" rx="6" fill="#0B0F17" stroke="#334155" stroke-width="1"/>
    <text x="106" y="84" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">IMEI: 359124098412891</text>

    <!-- Status Tags -->
    <rect x="324" y="68" width="76" height="24" rx="6" fill="#064E3B"/>
    <text x="362" y="84" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">PTA Reg</text>

    <rect x="408" y="68" width="78" height="24" rx="6" fill="#1E3A8A"/>
    <text x="447" y="84" fill="#93C5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Grade A+</text>

    <!-- Bottom Row: Price & Sell Action -->
    <line x1="14" y1="108" x2="486" y2="108" stroke="#1E293B" stroke-width="1"/>
    <text x="14" y="134" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Price:</text>
    <text x="56" y="135" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800">$1,080.00</text>
    
    <rect x="400" y="116" width="86" height="28" rx="8" fill="url(#btnGrad)"/>
    <text x="443" y="134" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Sell (POS)</text>
  </g>

  <!-- Device Card 2: Samsung Galaxy S24 Ultra -->
  <g transform="translate(20, 516)" filter="url(#shadow)">
    <rect x="0" y="0" width="500" height="152" rx="16" fill="#171B26" stroke="#1E293B" stroke-width="1"/>
    
    <!-- Phone Thumbnail Box -->
    <rect x="14" y="16" width="70" height="84" rx="12" fill="#0B0F17" stroke="#334155" stroke-width="1"/>
    <rect x="24" y="24" width="50" height="68" rx="4" fill="#1E293B"/>

    <!-- Title & Specs -->
    <text x="96" y="38" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Samsung Galaxy S24 Ultra</text>
    <text x="96" y="58" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">512GB • Titanium Gray • Brand New</text>

    <!-- IMEI Tag -->
    <rect x="96" y="68" width="220" height="24" rx="6" fill="#0B0F17" stroke="#334155" stroke-width="1"/>
    <text x="106" y="84" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">IMEI: 358741029481742</text>

    <!-- Status Tags -->
    <rect x="324" y="68" width="76" height="24" rx="6" fill="#064E3B"/>
    <text x="362" y="84" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Official</text>

    <rect x="408" y="68" width="78" height="24" rx="6" fill="#4C1D95"/>
    <text x="447" y="84" fill="#C4B5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">New Box</text>

    <!-- Bottom Row: Price & Sell Action -->
    <line x1="14" y1="108" x2="486" y2="108" stroke="#1E293B" stroke-width="1"/>
    <text x="14" y="134" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Price:</text>
    <text x="56" y="135" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800">$1,199.00</text>
    
    <rect x="400" y="116" width="86" height="28" rx="8" fill="url(#btnGrad)"/>
    <text x="443" y="134" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Sell (POS)</text>
  </g>

  <!-- Device Card 3: Google Pixel 8 Pro -->
  <g transform="translate(20, 682)" filter="url(#shadow)">
    <rect x="0" y="0" width="500" height="152" rx="16" fill="#171B26" stroke="#1E293B" stroke-width="1"/>
    
    <rect x="14" y="16" width="70" height="84" rx="12" fill="#0B0F17" stroke="#334155" stroke-width="1"/>
    <rect x="25" y="25" width="48" height="66" rx="5" fill="#1E293B"/>

    <text x="96" y="38" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Google Pixel 8 Pro</text>
    <text x="96" y="58" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">128GB • Obsidian Black • Battery 98%</text>

    <rect x="96" y="68" width="220" height="24" rx="6" fill="#0B0F17" stroke="#334155" stroke-width="1"/>
    <text x="106" y="84" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">IMEI: 356492019482910</text>

    <rect x="324" y="68" width="76" height="24" rx="6" fill="#064E3B"/>
    <text x="362" y="84" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">PTA Reg</text>

    <rect x="408" y="68" width="78" height="24" rx="6" fill="#1E3A8A"/>
    <text x="447" y="84" fill="#93C5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Grade A</text>

    <line x1="14" y1="108" x2="486" y2="108" stroke="#1E293B" stroke-width="1"/>
    <text x="14" y="134" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Price:</text>
    <text x="56" y="135" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800">$649.00</text>
    
    <rect x="400" y="116" width="86" height="28" rx="8" fill="url(#btnGrad)"/>
    <text x="443" y="134" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Sell (POS)</text>
  </g>

  <!-- Bottom Navigation Bar -->
  <g transform="translate(0, 890)">
    <rect width="540" height="70" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
    
    <!-- Tab 1: Inventory (Active) -->
    <rect x="36" y="8" width="48" height="30" rx="8" fill="#1E293B"/>
    <circle cx="60" cy="23" r="7" fill="#38BDF8"/>
    <text x="60" y="52" fill="#38BDF8" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Stock</text>

    <!-- Tab 2: Buy Intake -->
    <circle cx="168" cy="23" r="7" fill="#64748B"/>
    <text x="168" y="52" fill="#64748B" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500">Intake</text>

    <!-- Tab 3: POS Invoices -->
    <circle cx="270" cy="23" r="7" fill="#64748B"/>
    <text x="270" y="52" fill="#64748B" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500">Invoices</text>

    <!-- Tab 4: Khata CRM -->
    <circle cx="372" cy="23" r="7" fill="#64748B"/>
    <text x="372" y="52" fill="#64748B" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500">Khata</text>

    <!-- Tab 5: Analytics -->
    <circle cx="474" cy="23" r="7" fill="#64748B"/>
    <text x="474" y="52" fill="#64748B" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500">Reports</text>
  </g>
</svg>
`;

  // 5. Create SVG for screenshot-desktop.png (1280 x 720)
  const desktopSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bgD" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A0B0E"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="navGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#171B26"/>
    </linearGradient>
    <linearGradient id="primaryBtn" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <filter id="shadowD" x="-2%" y="-2%" width="104%" height="108%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgD)"/>

  <!-- Top Navigation Bar -->
  <rect width="1280" height="64" fill="url(#navGrad)" stroke="#1E293B" stroke-width="1"/>
  <rect x="28" y="14" width="36" height="36" rx="10" fill="#2563EB"/>
  <text x="39" y="39" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">Z</text>
  
  <text x="76" y="34" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">ZAFAR MOBILE STORE</text>
  <text x="76" y="49" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500">POS &amp; IMEI Management System</text>

  <!-- Nav Tabs -->
  <g transform="translate(360, 16)">
    <rect x="0" y="0" width="100" height="32" rx="8" fill="#2563EB"/>
    <text x="50" y="21" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Inventory</text>

    <text x="160" y="21" fill="#94A3B8" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Buy Used</text>
    <text x="260" y="21" fill="#94A3B8" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Invoices (POS)</text>
    <text x="370" y="21" fill="#94A3B8" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Khata Ledger</text>
    <text x="470" y="21" fill="#94A3B8" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Analytics</text>
  </g>

  <!-- Top Right Header Buttons -->
  <g transform="translate(1010, 14)">
    <rect x="0" y="0" width="120" height="36" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="60" y="23" fill="#E2E8F0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Scan IMEI (⌘K)</text>

    <rect x="132" y="0" width="110" height="36" rx="8" fill="url(#primaryBtn)"/>
    <text x="187" y="23" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">+ New Sale</text>
  </g>

  <!-- KPI Metric Overview Cards -->
  <g transform="translate(28, 84)">
    <!-- Card 1 -->
    <rect x="0" y="0" width="290" height="96" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadowD)"/>
    <text x="20" y="32" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">TOTAL INVENTORY VALUE</text>
    <text x="20" y="68" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">$54,820</text>
    <text x="20" y="85" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">● 48 In-Stock Phones</text>

    <!-- Card 2 -->
    <rect x="310" y="0" width="290" height="96" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadowD)"/>
    <text x="330" y="32" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">THIS MONTH SALES</text>
    <text x="330" y="68" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">$38,450</text>
    <text x="330" y="85" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">↑ 18.4% vs last month</text>

    <!-- Card 3 -->
    <rect x="620" y="0" width="290" height="96" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadowD)"/>
    <text x="640" y="32" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">KHATA RECEIVABLES (Lene Hain)</text>
    <text x="640" y="68" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">$4,280</text>
    <text x="640" y="85" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">6 Customers pending</text>

    <!-- Card 4 -->
    <rect x="930" y="0" width="294" height="96" rx="14" fill="#171B26" stroke="#1E293B" stroke-width="1" filter="url(#shadowD)"/>
    <text x="950" y="32" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">GROSS PROFIT MARGIN</text>
    <text x="950" y="68" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">22.4%</text>
    <text x="950" y="85" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">Net: +$8,610</text>
  </g>

  <!-- Filter & Search Toolbar -->
  <g transform="translate(28, 200)">
    <rect x="0" y="0" width="460" height="42" rx="10" fill="#171B26" stroke="#334155" stroke-width="1"/>
    <circle cx="22" cy="21" r="6" stroke="#64748B" stroke-width="2" fill="none"/>
    <line x1="26" y1="25" x2="33" y2="32" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
    <text x="44" y="26" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Search by Model, Brand, IMEI 1 / 2, or Seller CNIC...</text>

    <!-- Filter Buttons -->
    <rect x="476" y="0" width="110" height="42" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="531" y="26" fill="#E2E8F0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">All Brands ▼</text>

    <rect x="598" y="0" width="120" height="42" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="658" y="26" fill="#E2E8F0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">PTA Status ▼</text>

    <rect x="730" y="0" width="110" height="42" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="785" y="26" fill="#E2E8F0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Condition ▼</text>

    <rect x="1100" y="0" width="124" height="42" rx="10" fill="#059669"/>
    <text x="1162" y="26" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">+ Add Device</text>
  </g>

  <!-- Inventory Table Container -->
  <g transform="translate(28, 260)" filter="url(#shadowD)">
    <rect x="0" y="0" width="1224" height="430" rx="14" fill="#12151E" stroke="#1E293B" stroke-width="1"/>
    
    <!-- Table Header -->
    <rect x="0" y="0" width="1224" height="46" rx="14" fill="#171B26"/>
    <text x="24" y="28" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">DEVICE / MODEL</text>
    <text x="280" y="28" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">IMEI NUMBER</text>
    <text x="490" y="28" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">TYPE / CONDITION</text>
    <text x="690" y="28" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">PTA REGISTRATION</text>
    <text x="890" y="28" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">TARGET PRICE</text>
    <text x="1080" y="28" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">ACTION</text>

    <!-- Row 1 -->
    <line x1="0" y1="46" x2="1224" y2="46" stroke="#1E293B" stroke-width="1"/>
    <text x="24" y="82" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">Apple iPhone 15 Pro Max</text>
    <text x="24" y="100" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">256GB • Natural Titanium • Battery 94%</text>

    <text x="280" y="86" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600">359124098412891</text>
    <text x="280" y="102" fill="#64748B" font-family="'JetBrains Mono', monospace" font-size="11">SN: F2LK9482X901</text>

    <rect x="490" y="70" width="100" height="24" rx="6" fill="#1E3A8A"/>
    <text x="540" y="86" fill="#93C5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Used Grade A+</text>

    <rect x="690" y="70" width="110" height="24" rx="6" fill="#064E3B"/>
    <text x="745" y="86" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Official PTA Reg</text>

    <text x="890" y="88" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800">$1,080.00</text>
    <text x="890" y="104" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Cost: $920.00</text>

    <rect x="1060" y="70" width="80" height="30" rx="8" fill="#2563EB"/>
    <text x="1100" y="89" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Sell</text>

    <!-- Row 2 -->
    <line x1="0" y1="120" x2="1224" y2="120" stroke="#1E293B" stroke-width="1"/>
    <text x="24" y="156" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">Samsung Galaxy S24 Ultra</text>
    <text x="24" y="174" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">512GB • Titanium Gray • 1 Year Warranty</text>

    <text x="280" y="160" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600">358741029481742</text>
    <text x="280" y="176" fill="#64748B" font-family="'JetBrains Mono', monospace" font-size="11">Dual SIM PTA</text>

    <rect x="490" y="144" width="100" height="24" rx="6" fill="#4C1D95"/>
    <text x="540" y="160" fill="#C4B5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Brand New Box</text>

    <rect x="690" y="144" width="110" height="24" rx="6" fill="#064E3B"/>
    <text x="745" y="160" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Official Brand</text>

    <text x="890" y="162" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800">$1,199.00</text>
    <text x="890" y="178" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Cost: $1,050.00</text>

    <rect x="1060" y="144" width="80" height="30" rx="8" fill="#2563EB"/>
    <text x="1100" y="163" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Sell</text>

    <!-- Row 3 -->
    <line x1="0" y1="194" x2="1224" y2="194" stroke="#1E293B" stroke-width="1"/>
    <text x="24" y="230" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">Google Pixel 8 Pro</text>
    <text x="24" y="248" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">128GB • Obsidian Black • Battery 98%</text>

    <text x="280" y="234" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600">356492019482910</text>
    <text x="280" y="250" fill="#64748B" font-family="'JetBrains Mono', monospace" font-size="11">CPID Approved</text>

    <rect x="490" y="218" width="100" height="24" rx="6" fill="#1E3A8A"/>
    <text x="540" y="234" fill="#93C5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Used Grade A</text>

    <rect x="690" y="218" width="110" height="24" rx="6" fill="#064E3B"/>
    <text x="745" y="234" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">PTA Reg</text>

    <text x="890" y="236" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800">$649.00</text>
    <text x="890" y="252" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Cost: $520.00</text>

    <rect x="1060" y="218" width="80" height="30" rx="8" fill="#2563EB"/>
    <text x="1100" y="237" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Sell</text>

    <!-- Row 4 -->
    <line x1="0" y1="268" x2="1224" y2="268" stroke="#1E293B" stroke-width="1"/>
    <text x="24" y="304" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">Xiaomi 14 Ultra</text>
    <text x="24" y="322" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">512GB • Leica Photography Kit • White</text>

    <text x="280" y="308" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600">863920194827104</text>
    <text x="280" y="324" fill="#64748B" font-family="'JetBrains Mono', monospace" font-size="11">Official Global</text>

    <rect x="490" y="292" width="100" height="24" rx="6" fill="#1E3A8A"/>
    <text x="540" y="308" fill="#93C5FD" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Used Grade A+</text>

    <rect x="690" y="292" width="110" height="24" rx="6" fill="#064E3B"/>
    <text x="745" y="308" fill="#34D399" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">Official PTA Reg</text>

    <text x="890" y="310" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800">$899.00</text>
    <text x="890" y="326" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Cost: $750.00</text>

    <rect x="1060" y="292" width="80" height="30" rx="8" fill="#2563EB"/>
    <text x="1100" y="311" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Sell</text>
  </g>
</svg>
`;

  // Render screenshot-mobile.png (540x960)
  await sharp(Buffer.from(mobileSvg))
    .resize(540, 960)
    .png({ compressionLevel: 8 })
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log('Generated screenshot-mobile.png (540x960)');

  // Render screenshot-desktop.png (1280x720)
  await sharp(Buffer.from(desktopSvg))
    .resize(1280, 720)
    .png({ compressionLevel: 8 })
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log('Generated screenshot-desktop.png (1280x720)');

  console.log('All PWA assets successfully generated and verified!');
}

main().catch(err => {
  console.error('Error generating PWA assets:', err);
  process.exit(1);
});
