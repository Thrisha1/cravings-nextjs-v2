const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  silentPrint: (content) => ipcRenderer.invoke('silent-print', content)
}); 