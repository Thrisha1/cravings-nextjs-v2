import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  silentPrint: (content) => ipcRenderer.invoke('silent-print', content)
}); 