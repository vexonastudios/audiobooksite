const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (updates) => ipcRenderer.invoke('save-settings', updates),

  // Generation
  runDryRun: () => ipcRenderer.send('run-dry-run'),
  runGenerate: () => ipcRenderer.send('run-generate'),
  cancelGeneration: () => ipcRenderer.send('cancel-generation'),

  // Events from main process → renderer
  onGenStarted: (cb) => ipcRenderer.on('gen-started', (_e, data) => cb(data)),
  onGenLog: (cb) => ipcRenderer.on('gen-log', (_e, data) => cb(data)),
  onGenDone: (cb) => ipcRenderer.on('gen-done', (_e, data) => cb(data)),

  // Utilities
  openOutputFolder: () => ipcRenderer.send('open-output-folder'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
