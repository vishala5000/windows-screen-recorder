// main.js — Electron main process
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    backgroundColor: "#1a1a2e",
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("src/index.html");
  // mainWindow.webContents.openDevTools(); // uncomment to debug
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---- IPC handlers ----
ipcMain.on("window:minimize", () => mainWindow?.minimize());
ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window:close", () => mainWindow?.close());

ipcMain.handle("dialog:save", async (event, { dataUrl, defaultName }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save recording",
      defaultPath: defaultName,
      filters: [{ name: "WebM Video", extensions: ["webm"] }]
    });
    if (canceled || !filePath) return { ok: false, reason: "canceled" };

    // dataUrl is like "data:video/webm;base64,...."
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filePath, buffer);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
});

ipcMain.handle("app:getVersion", () => app.getVersion());
