// preload.js — secure bridge between main and renderer
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close:    () => ipcRenderer.send("window:close"),
  saveRecording: (dataUrl, defaultName) =>
    ipcRenderer.invoke("dialog:save", { dataUrl, defaultName }),
  getVersion: () => ipcRenderer.invoke("app:getVersion")
});
