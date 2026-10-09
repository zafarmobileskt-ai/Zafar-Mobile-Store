# How to Convert ZAFAR MOBILE STORE into a Windows Installation File (.exe / .msix)

This repository supports multiple methods to package and run this application as a Windows desktop software.

---

### Method 1: Microsoft PWABuilder (Official Microsoft Tool - Generates .msix / Windows Store Setup)
1. Open [https://www.pwabuilder.com](https://www.pwabuilder.com)
2. Enter your live app URL:
   `https://ais-pre-5rqxp63fkivomm7hhrxvoc-243110999915.asia-southeast1.run.app`
3. Click **"Package for Windows"**.
4. PWABuilder automatically validates the PWA manifest, service worker, and high-resolution icons (192px, 512px, 1024px).
5. Download your signed Windows `.msix` or `.zip` package.
6. Double-click the `.msix` file on Windows 10 or Windows 11 to install with 1-click!

---

### Method 2: Electron & electron-builder (Produces standard `Setup.exe` NSIS Installer)
To compile a native Windows `.exe` setup file using Electron:

1. Install Electron dependencies:
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. Add this build configuration to `package.json`:
   ```json
   {
     "main": "electron/main.cjs",
     "scripts": {
       "electron:start": "electron electron/main.cjs",
       "electron:build:win": "npm run build && electron-builder --win nsis"
     },
     "build": {
       "appId": "com.zafarmobile.pos",
       "productName": "Zafar Mobile Store POS",
       "directories": {
         "output": "dist-electron"
       },
       "win": {
         "target": ["nsis", "portable"],
         "icon": "public/favicon.ico"
       },
       "nsis": {
         "oneClick": false,
         "allowToChangeInstallationDirectory": true,
         "createDesktopShortcut": true,
         "createStartMenuShortcut": true,
         "shortcutName": "Zafar Mobile POS"
       }
     }
   }
   ```

3. Run the Windows build command:
   ```bash
   npm run electron:build:win
   ```
4. Output installer will be in `dist-electron/Zafar Mobile Store POS Setup.exe`.

---

### Method 3: 1-Line Nativefier Command (Creates ready-to-use Windows .exe folder)
Run anywhere in terminal (requires Node.js):
```bash
npx @nativefier/nativefier --name "Zafar Mobile POS" "https://ais-pre-5rqxp63fkivomm7hhrxvoc-243110999915.asia-southeast1.run.app" --platform windows --arch x64 --icon public/icon-512.png --single-instance
```
This generates a folder with `Zafar Mobile POS.exe` that runs completely standalone without any browser controls.

---

### Method 4: Native Windows PWA App (Built-in to Windows 10 & 11)
In Microsoft Edge or Google Chrome:
1. Open the app link.
2. Click the **Install** icon in the address bar (or Menu `...` -> **Apps** -> **Install ZAFAR MOBILE STORE**).
3. Check **Create Desktop shortcut**, **Pin to taskbar**, and **Auto-start on Windows login**.
4. The app now launches like any native desktop `.exe` program with full hardware scanner and printer support!
