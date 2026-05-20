const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("engine", {
  onToggleHud: (cb) => ipcRenderer.on("toggle-hud", cb),
  onShowPresetMenu: (cb) => ipcRenderer.on("show-preset-menu", cb),
  onShowDisplayPicker: (cb) => ipcRenderer.on("show-display-picker", cb),
  onToggleFFT: (cb) => ipcRenderer.on("toggle-fft", cb),
  getDisplays: () => ipcRenderer.invoke("get-displays"),
  moveToDisplay: (id) => ipcRenderer.send("move-to-display", id),
});
