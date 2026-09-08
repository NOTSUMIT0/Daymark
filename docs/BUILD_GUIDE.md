# Daymark — Desktop (.exe) & Android (.apk) Build Guide

This step-by-step guide explains how to compile the standalone **Windows Desktop executable (.exe)** and **Android Mobile package (.apk)** for Daymark.

---

## 🖥️ PART 1: Windows Desktop App Build (.exe & .msi)

### Step 1: Complete Visual Studio C++ Installation
1. Wait for the **Visual Studio Installer** (shown in your screenshot) to finish downloading and installing **Visual Studio Build Tools**.
2. Ensure the **"Desktop development with C++"** workload is selected and installed.

### Step 2: Open a Fresh Terminal Window
1. Close your existing terminal or command prompt window.
2. Open a **new** PowerShell terminal inside VS Code or Command Prompt. (Opening a fresh window ensures Windows loads the newly added `cargo` and `link.exe` PATH variables).

### Step 3: Run the Desktop Build Command
In your project directory (`k:\Work\YourDailyDEED`), execute:

```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
npm run tauri:build
```

### Step 4: Retrieve Your Executable & Installer
Once the build completes, your standalone Windows desktop files are ready in:

- **Standalone `.exe` Executable:**  
  `k:\Work\YourDailyDEED\src-tauri\target\release\Daymark.exe`

- **Windows Installer (`.msi`):**  
  `k:\Work\YourDailyDEED\src-tauri\target\release\bundle\msi\Daymark_1.0.0_x64_en-US.msi`

---

## 📱 PART 2: Android Mobile App Build (.apk)

### Step 1: Install Android Studio
1. Download & install **Android Studio** from [https://developer.android.com/studio](https://developer.android.com/studio).
2. Complete the initial wizard to install the standard Android SDK tools.

### Step 2: Build & Sync Latest Web Assets
In your project terminal, execute:

```bash
npm run build
npm run cap:sync
```

### Step 3: Open in Android Studio
Run the following command to open the native project in Android Studio:

```bash
npm run cap:android
```

### Step 4: Generate `.apk`
1. Inside Android Studio, click on the top menu:  
   **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)**
2. Once complete, click **locate** in the popup notification to find your `app-debug.apk` file ready to install on your Android smartphone or tablet!

---

## 🔄 PART 3: Future Updates & Version Re-building

Whenever you add new features, update UI designs, or modify code with my help in the future:

1. We will update the code and automatically push commits to GitHub.
2. **Re-build Windows Desktop EXE:**  
   Run `$env:PATH += ";$env:USERPROFILE\.cargo\bin"; npm run tauri:build`
3. **Re-build Android APK:**  
   Run `npm run build && npm run cap:sync` then build APK in Android Studio!
