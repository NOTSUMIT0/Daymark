# Daymark (YourDailyDEED)

Daymark is a powerful and versatile productivity application designed to help you manage your daily tasks, roadmaps, notes, files, and generate insightful reports. Built with modern web technologies, Daymark provides a seamless experience across multiple platforms, including **Desktop (Windows/macOS/Linux)** and **Android**.

## Features

- **Daily Tasks Management**: Organize your daily routine with an intuitive task tracker.
- **Roadmaps**: Plan long-term goals and visualize your progress.
- **Notes & Ideas**: Capture your thoughts instantly with a built-in note-taking interface.
- **File Management**: Store and manage relevant files directly within the app.
- **Insights & Reports**: Generate reports to track your productivity over time.
- **Cross-Platform Support**: Enjoy a unified experience on both Desktop and Android mobile devices.
- **Command Palette**: Quickly navigate and perform actions using global shortcuts (e.g., `Ctrl+K`).
- **Focus Sprints**: Built-in timer for focus sessions (Toggle with `Alt+Space`).
- **Dark & Light Themes**: Customizable appearance to suit your preferences.

## Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Desktop Packaging**: Tauri (`@tauri-apps/cli`)
- **Mobile Packaging**: Capacitor (`@capacitor/core`, `@capacitor/android`)
- **Data Storage**: LocalStorage & IndexedDB

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (Required for Tauri Desktop builds)
- [Android Studio](https://developer.android.com/studio) (Required for Android builds) & Java JDK 17+

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/daymark.git
   cd daymark
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Run the app in Development Mode (Web)**:
   ```bash
   npm run dev
   ```

---

## Building for Production & Releases

### 🖥️ Desktop (Windows / macOS / Linux)

Daymark uses [Tauri](https://tauri.app/) to package the web app into a lightweight, fast, and secure desktop application.

To build the desktop executable:
```bash
npm run build
npm run tauri:build
```
Once the process completes, the built executable files can be found in `src-tauri/target/release/`.

### 📱 Android (APK)

Daymark uses [Capacitor](https://capacitorjs.com/) to wrap the web experience into a native Android application.

**Step 1: Sync Web Assets to Android**
```bash
npm run build
npm run cap:sync
```

**Step 2: Open Android Studio**
```bash
npm run cap:android
```
*(Alternatively, you can manually open the `android` folder in Android Studio.)*

**Step 3: Set Java JDK**
- In Android Studio, go to `File` -> `Project Structure...` -> `SDK Location` (or `Gradle`).
- Ensure the **Gradle JDK** is set to **Java 17** (or Java 21).

**Step 4: Generate the APK**
- In the top menu bar, click `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`.
- The generated APK will be located at:
  `android/app/build/outputs/apk/debug/app-debug.apk`

*For more details on the Android build process, please see `ANDROID_APK_BUILD_STEPS.txt`.*

---

## Keyboard Shortcuts

- `Ctrl + K` / `Cmd + K`: Toggle Command Palette Search
- `Alt + N`: Jump to Notes
- `Alt + T`: Jump to Tasks
- `Alt + R`: Jump to Roadmaps
- `Alt + S`: Jump to Settings
- `Alt + Space`: Start/Pause Focus Timer Sprint

## License

This project is licensed under the [MIT License](LICENSE).
