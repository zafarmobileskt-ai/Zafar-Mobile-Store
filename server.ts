import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Helper to initialize GoogleGenAI with mandatory headers
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.use(express.json({ limit: '50mb' }));

// Allow CORS for preview / dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Explicit PWA Service Worker & Manifest delivery with required PWA headers
app.get('/sw.js', (req, res) => {
  const swPath = path.resolve(process.cwd(), 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(swPath);
  }
  res.status(404).send('Service Worker not found');
});

app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const manifestPath = path.resolve(process.cwd(), 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(manifestPath);
  }
  res.status(404).send('Manifest not found');
});

// Storage file on disk for persistent cloud data between devices
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache
let storeDataCache: any = null;

function loadStoreData() {
  if (storeDataCache) return storeDataCache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      storeDataCache = JSON.parse(content);
      return storeDataCache;
    }
  } catch (err) {
    console.error('Error loading store data:', err);
  }
  return null;
}

function saveStoreData(data: any) {
  storeDataCache = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store data:', err);
  }
}

// Connected SSE clients for instant cross-device live sync
const sseClients = new Set<express.Response>();

// SSE stream for real-time changes
app.get('/api/sync/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

function broadcastSync(sourceDevice: string, counts: any) {
  const payload = JSON.stringify({
    type: 'sync',
    source: sourceDevice,
    timestamp: new Date().toISOString(),
    counts
  });
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  });
}

// GET master store data
app.get('/api/sync', (req, res) => {
  const data = loadStoreData();
  res.json({
    success: true,
    data: data || null,
    serverTime: new Date().toISOString(),
    connectedClients: sseClients.size
  });
});

// POST master store data (from phone or PC)
app.post('/api/sync', (req, res) => {
  const { inventory, sales, customers, settings, sourceDevice, forceOverwrite } = req.body;

  if (!inventory && !sales && !customers && !settings) {
    return res.status(400).json({ success: false, message: 'No sync data provided' });
  }

  const existing = loadStoreData() || { inventory: [], sales: [], customers: [], settings: null };

  if (forceOverwrite) {
    const updatedStore = {
      inventory: inventory || existing.inventory || [],
      sales: sales || existing.sales || [],
      customers: customers || existing.customers || [],
      settings: settings || existing.settings,
      lastSyncTime: new Date().toISOString(),
      lastUpdatedBy: sourceDevice || 'unknown'
    };
    saveStoreData(updatedStore);
    broadcastSync(sourceDevice || 'client', {
      inventory: updatedStore.inventory.length,
      sales: updatedStore.sales.length,
      customers: updatedStore.customers.length
    });
    return res.json({ success: true, message: 'Data overwritten successfully', data: updatedStore });
  }

  // Smart Merge
  // 1. Inventory: merge by ID
  const invMap = new Map();
  (existing.inventory || []).forEach((item: any) => {
    if (item && item.id) invMap.set(item.id, item);
  });
  (inventory || []).forEach((item: any) => {
    if (item && item.id) invMap.set(item.id, item);
  });
  const mergedInventory = Array.from(invMap.values());

  // 2. Sales: merge by saleId / invoiceNumber
  const salesMap = new Map();
  (existing.sales || []).forEach((sale: any) => {
    const key = sale.saleId || sale.invoiceNumber;
    if (key) salesMap.set(key, sale);
  });
  (sales || []).forEach((sale: any) => {
    const key = sale.saleId || sale.invoiceNumber;
    if (key) salesMap.set(key, sale);
  });
  const mergedSales = Array.from(salesMap.values());

  // 3. Customers: merge by ID or phone
  const custMap = new Map();
  (existing.customers || []).forEach((cust: any) => {
    const key = cust.id || (cust.phone ? cust.phone.replace(/\D/g, '') : null);
    if (key) custMap.set(key, cust);
  });
  (customers || []).forEach((cust: any) => {
    const key = cust.id || (cust.phone ? cust.phone.replace(/\D/g, '') : null);
    if (!key) return;

    const prev = custMap.get(key);
    if (prev) {
      // Merge ledger entries
      const ledgerMap = new Map();
      (prev.ledgerEntries || []).forEach((l: any) => { if (l && l.id) ledgerMap.set(l.id, l); });
      (cust.ledgerEntries || []).forEach((l: any) => { if (l && l.id) ledgerMap.set(l.id, l); });

      // Merge manual purchases
      const manualMap = new Map();
      (prev.manualPurchases || []).forEach((m: any) => { if (m && m.id) manualMap.set(m.id, m); });
      (cust.manualPurchases || []).forEach((m: any) => { if (m && m.id) manualMap.set(m.id, m); });

      custMap.set(key, {
        ...prev,
        ...cust,
        ledgerEntries: Array.from(ledgerMap.values()),
        manualPurchases: Array.from(manualMap.values())
      });
    } else {
      custMap.set(key, cust);
    }
  });
  const mergedCustomers = Array.from(custMap.values());

  // 4. Settings
  const mergedSettings = settings || existing.settings;

  const updatedStore = {
    inventory: mergedInventory,
    sales: mergedSales,
    customers: mergedCustomers,
    settings: mergedSettings,
    lastSyncTime: new Date().toISOString(),
    lastUpdatedBy: sourceDevice || 'mobile/desktop'
  };

  saveStoreData(updatedStore);

  // Broadcast to other devices (e.g. phone -> desktop, desktop -> phone)
  broadcastSync(sourceDevice || 'client', {
    inventory: mergedInventory.length,
    sales: mergedSales.length,
    customers: mergedCustomers.length
  });

  res.json({
    success: true,
    message: 'Synced successfully across all devices',
    data: updatedStore
  });
});

// Gemini Text/Voice Chat fallback endpoint (using gemini-3.8-flash)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const storeData = loadStoreData();
    const inventory = storeData?.inventory || [];
    const sales = storeData?.sales || [];
    const customers = storeData?.customers || [];
    const settings = storeData?.settings || {};

    const stockSummary = inventory.slice(0, 15).map((d: any) => `${d.brand} ${d.model} (${d.condition}, Rs. ${d.salePrice || d.sellingPrice})`).join('; ');

    const systemInstruction = `You are the AI Voice & Store Assistant for "${settings.shopName || 'ZAFAR MOBILE STORE'}", a professional mobile retail shop.
Shop stats: ${inventory.length} phones in stock, ${sales.length} sales invoices, ${customers.length} registered customers.
Recent stock sample: ${stockSummary || 'Various phones in stock'}.
Help the shopkeeper and customers with inventory inquiries, mobile specs, IMEI police verification rules, customer Khata balances, and sales advice in Urdu, English, or Roman Urdu.
Keep your answers concise, practical, and polite.`;

    const chatContents = history && Array.isArray(history) && history.length > 0
      ? [...history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: prompt }] }]
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('[Gemini API] Chat error:', err);
    res.status(500).json({ error: err.message || 'Gemini error' });
  }
});

// WebSocket Server for Gemini 3.8 Live API Voice Sessions
const wss = new WebSocketServer({ server, path: '/ws/live-voice' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live Voice] Client connected to live voice session');

  const ai = getGenAI();
  if (!ai) {
    clientWs.send(JSON.stringify({
      type: 'error',
      error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.'
    }));
    clientWs.close();
    return;
  }

  // Load latest store data for grounding
  const storeData = loadStoreData();
  const inventory = storeData?.inventory || [];
  const sales = storeData?.sales || [];
  const customers = storeData?.customers || [];
  const settings = storeData?.settings || {};

  const totalStock = inventory.filter((i: any) => i.status === 'in_stock').length;
  const recentPhones = inventory.slice(0, 15).map((d: any) => `${d.brand} ${d.model} (${d.condition}, IMEI: ${d.imei}, Rs. ${d.salePrice || d.sellingPrice})`).join('; ');

  const systemInstruction = `You are the friendly, fast, and helpful AI Voice Assistant for "${settings.shopName || 'ZAFAR MOBILE STORE'}", a professional mobile retail shop.
You can converse naturally in Urdu, English, or Roman Urdu as the user speaks.
Current Shop Data:
- Available phones in stock: ${totalStock}
- Recent inventory sample: ${recentPhones || 'Samsung, iPhone, Vivo, Xiaomi phones'}
- Total sales invoices: ${sales.length}
- Registered customers: ${customers.length}
Help the user with stock checks, phone prices, IMEI safety verification, warranty details, customer Khata ledger inquiries, and general retail mobile store assistance.
Keep your spoken responses natural, concise, and direct for real-time audio.`;

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          const sc = message.serverContent as any;
          if (sc?.outputAudioTranscription?.text && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'output_transcript', text: sc.outputAudioTranscription.text }));
          }
          if (sc?.inputAudioTranscription?.text && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'input_transcript', text: sc.inputAudioTranscription.text }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err) => {
          console.warn('[Live API] Session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Live session error' }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({
      type: 'connected',
      message: 'Gemini 3.8 Live Voice connected. Start speaking!'
    }));
  } catch (err: any) {
    console.error('[Live API] Connect failed:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Failed to connect to Live API' }));
      clientWs.close();
    }
    return;
  }

  clientWs.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'audio' && msg.audio && session) {
        session.sendRealtimeInput({
          audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' }
        });
      } else if (msg.type === 'text' && msg.text && session) {
        session.sendRealtimeInput({
          text: msg.text
        });
      }
    } catch (e) {
      console.warn('[Live API] Client msg error:', e);
    }
  });

  clientWs.on('close', () => {
    if (session) {
      try {
        session.close();
      } catch {}
      session = null;
    }
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Explicitly set hmr: false in middlewareMode to eliminate "[vite] failed to connect to websocket" errors in preview
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zafar Mobile Store Sync Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
