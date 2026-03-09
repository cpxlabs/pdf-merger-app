const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pdfMerger', {
  selectFiles: () => ipcRenderer.invoke('pdf:select-files'),
  selectFolder: () => ipcRenderer.invoke('pdf:select-folder'),
  selectOutputFolder: () => ipcRenderer.invoke('pdf:select-output-folder'),
  mergePdfs: (payload) => ipcRenderer.invoke('pdf:merge', payload),
});
