// Preload script - can expose IPC here later
import { contextBridge } from 'electron';

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('api', {
  backend_url: 'http://localhost:8000',
});
