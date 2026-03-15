const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// 忽略自签名证书错误
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 创建日志文件
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`);

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(logFile, logMessage);
}

// 全局异常处理
process.on('uncaughtException', (error) => {
  log('ERROR', 'Uncaught Exception', { message: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  log('ERROR', 'Unhandled Rejection', { reason: String(reason) });
});

log('INFO', 'Application starting...');

let mainWindow;

function createWindow() {
  log('INFO', 'Creating main window');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,  // 允许加载本地文件和跨域
      allowRunningInsecureContent: true  // 允许加载不安全的内容（HTTPS证书错误时仍可加载）
    },
    title: 'LiveKit 视频会议客户端'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 打开 DevTools 以便查看日志和错误
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    log('INFO', 'Window finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log('ERROR', 'Window failed to load', { errorCode, errorDescription });
  });

  // 捕获控制台日志
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelName = ['verbose', 'info', 'warning', 'error'][level] || 'unknown';
    log('RENDERER', `[${levelName}] ${message}`, { line, sourceId });
  });
}

app.whenReady().then(() => {
  log('INFO', 'App is ready');

  // 设置 session 忽略证书错误
  const { session } = require('electron');
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    // 忽略所有证书错误
    callback(0);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('INFO', 'All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: 获取屏幕共享源
ipcMain.handle('get-sources', async () => {
  log('INFO', 'Getting screen sources');
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 320, height: 180 }
    });
    
    log('INFO', `Found ${sources.length} sources`);
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    log('ERROR', 'Error getting sources', { message: error.message, stack: error.stack });
    return [];
  }
});
