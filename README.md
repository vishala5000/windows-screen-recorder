# windows-screen-recorder

**Screen Recorder** — a fully working Windows desktop app built with HTML, CSS, and JavaScript, packaged with [Electron](https://www.electronjs.org/).

## Features
- Record screen, window, or specific tab
- Optional system audio + microphone capture
- Live preview while recording
- Pause / Resume support
- Recording timer (MM:SS or HH:MM:SS)
- Save dialog — choose where to save the .webm file
- Custom frameless window with native titlebar controls
- Auto-built .exe installer via GitHub Actions

## Download the .exe
1. Go to **Actions** tab -> latest run -> **Artifacts** -> download `ScreenRecorder-Setup`
2. OR go to **Releases** -> download `Screen-Recorder-Setup-1.0.0.exe`
3. Run the installer (or use the portable .exe)

## Run locally (development)
```
npm install
npm start
```

## Build locally
```
npm run build
```
Output: `dist/` folder with `.exe` installer + portable version.

## Project structure
- `main.js` — Electron main process (window, IPC, save dialog)
- `preload.js` — secure bridge to renderer
- `src/` — the web app (HTML/CSS/JS)
- `assets/` — app icon
- `package.json` — Electron + electron-builder config
- `.github/workflows/build.yml` — auto-builds .exe on every push/tag

## Release a new version
```
git tag v1.0.1 && git push --tags
```
GitHub Actions will build and attach the new .exe to the release.