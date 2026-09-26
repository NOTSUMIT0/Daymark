<div align="center">
  <h1>🌅 Daymark (YourDailyDEED)</h1>
  <p><strong>A powerful and versatile productivity application to manage your daily tasks, roadmaps, notes, files, and generate insightful reports.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tauri-FFC131?style=flat-square&logo=tauri&logoColor=white" alt="Tauri" />
    <img src="https://img.shields.io/badge/Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white" alt="Capacitor" />
  </p>
</div>

---

## ✨ Features

- 📅 **Daily Tasks Management**: Organize your daily routine with an intuitive task tracker.
- 🗺️ **Roadmaps**: Plan long-term goals and visualize your progress over time.
- 📝 **Notes & Ideas**: Capture your thoughts instantly with a built-in rich note-taking interface.
- 📁 **File Management**: Store and manage relevant files directly within the app context.
- 📊 **Insights & Reports**: Generate reports to track your productivity and habits.
- 📱 **Cross-Platform**: Seamless unified experience on Desktop (Windows/macOS/Linux) and Mobile (Android).
- ⌨️ **Command Palette**: Quickly navigate and perform actions using global shortcuts (e.g., `Ctrl+K`).
- ⏱️ **Focus Sprints**: Built-in Pomodoro-style timer for focus sessions.
- 🎨 **Beautiful UI**: Supports fully customizable Dark & Light themes.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Desktop Packaging**: Tauri (`@tauri-apps/cli`) built with Rust
- **Mobile Packaging**: Capacitor (`@capacitor/core`, `@capacitor/android`)
- **Data Storage**: LocalStorage & IndexedDB (Privacy-first, local-first architecture)

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) (Required for Tauri Desktop builds)
- [Android Studio](https://developer.android.com/studio) & Java JDK 17+ (Required for Android builds)

### Installation & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/daymark.git
   cd daymark
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in Development Mode (Web)**:
   ```bash
   npm run dev
   ```

---

## 📦 Building & GitHub Releases Guide

When you are ready to distribute Daymark to users, you will create a **GitHub Release**. Below is the guide on how to build and exactly what files to upload.

### 🖥️ Desktop (Windows / macOS / Linux)

Daymark uses [Tauri](https://tauri.app/) to package the web app into a lightweight desktop application. **Note:** You must build on the target OS (e.g., build on Windows for Windows users).

**Build Command:**
```bash
npm run build
npm run tauri:build
```

**Files to upload to GitHub Release:**
- 🪟 **Windows**: Go to `src-tauri/target/release/bundle/nsis/` and upload `Daymark_x.x.x_x64-setup.exe` (and/or the `.msi` file).
- 🍎 **macOS**: Go to `src-tauri/target/release/bundle/dmg/` and upload `Daymark_x.x.x_x64.dmg`.
- 🐧 **Linux**: Go to `src-tauri/target/release/bundle/appimage/` and upload `daymark_x.x.x_amd64.AppImage` (and the `.deb` file).

### 📱 Android (Mobile)

Daymark uses [Capacitor](https://capacitorjs.com/) for native Android.

**Build Steps:**
1. Sync Web Assets to Android:
   ```bash
   npm run build
   npm run cap:sync
   ```
2. Open Android Studio:
   ```bash
   npm run cap:android
   ```
3. In Android Studio, go to `Build` -> `Generate Signed Bundle / APK...` -> choose `APK`.

**Files to upload to GitHub Release:**
- 🤖 **Android**: Navigate to `android/app/release/` and upload `app-release.apk`. *(If you didn't sign it, upload `android/app/build/outputs/apk/debug/app-debug.apk`, though a signed release APK is recommended).*

---

## 🔒 Security Best Practices (DO NOT COMMIT)

To protect your app's security and your users, **NEVER commit or upload the following files** to GitHub (ensure they are in your `.gitignore`):

- ❌ **`.env` files**: Contains your secret API keys, database URLs, or private tokens.
- ❌ **Android Keystore files (`*.jks`, `*.keystore`)**: Used to cryptographically sign your Android APK. If leaked, anyone can impersonate your app.
- ❌ **`key.properties`**: Contains the passwords for your Android keystore.
- ❌ **Tauri private keys**: If you use Tauri's built-in updater, keep the `.key` private key file strictly local.
- ❌ **`node_modules/` or build folders**: Keep your repository clean.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Toggle Command Palette Search |
| `Alt + N` | Jump to Notes |
| `Alt + T` | Jump to Tasks |
| `Alt + R` | Jump to Roadmaps |
| `Alt + S` | Jump to Settings |
| `Alt + Space` | Start/Pause Focus Timer Sprint |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
