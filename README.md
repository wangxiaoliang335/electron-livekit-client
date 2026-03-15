# LiveKit Electron 客户端

基于 Electron + LiveKit SDK 的视频会议客户端，支持：
- 视频通话
- 音频通话
- 屏幕共享

## 环境要求

- Node.js 18+
- npm 8+

## 安装

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

## 打包为 Windows EXE

```bash
npm run build
```

打包完成后，在 `dist/` 目录下找到 `LiveKit Client Setup.exe` 安装包。

## 配置

在 `src/renderer/index.html` 中修改默认配置：

- 服务器地址：`ws://114.67.86.96:7880`
- Token 服务器：`http://114.67.86.96:8080`

## 功能说明

### 连接房间
输入服务器地址、房间名、用户名，点击"连接房间"。

### 屏幕共享
点击"共享屏幕"，选择要共享的窗口或屏幕。

### 开关摄像头/麦克风
使用底部控制按钮切换。

## 项目结构

```
electron-livekit-client/
├── package.json
├── src/
│   ├── main/
│   │   ├── main.js      # Electron 主进程
│   │   └── preload.js    # 预加载脚本
│   └── renderer/
│       └── index.html    # 前端页面
└── dist/                 # 打包输出
```

## Token 服务器

如果 Token 服务器返回格式不是 `{ token: "..." }`，需要修改 `index.html` 中的 `getToken` 函数。

默认 Token 服务器参考：`gen_livekit_token.py`
