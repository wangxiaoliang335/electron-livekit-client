const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取屏幕共享源
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  // 平台信息
  platform: process.platform
});
