// Electron main process for Windows Desktop App (.exe)
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'ZAFAR MOBILE STORE - POS & IMEI Inventory',
    icon: path.join(__dirname, '../public/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    backgroundColor: '#0B0F17',
    autoHideMenuBar: true,
    show: false,
  });

  // Check if running in development or packaged production
  const isDev = process.env.NODE_ENV === 'development';
  const liveUrl = process.env.APP_URL || 'https://ais-pre-5rqxp63fkivomm7hhrxvoc-243110999915.asia-southeast1.run.app';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // When built with electron-builder, load dist/index.html or the hosted live URL
    const distPath = path.join(__dirname, '../dist/index.html');
    const fs = require('fs');
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      mainWindow.loadURL(liveUrl);
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Handle external links safely in system default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
