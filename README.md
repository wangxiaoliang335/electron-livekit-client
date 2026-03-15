# LiveKit Electron 客户端

基于 Electron + LiveKit SDK 的视频会议客户端，支持：
- 视频通话
- 音频通话
- 屏幕共享

## 快速开始（Windows）

### 1. 安装 Node.js

下载并安装 Node.js 18+：https://nodejs.org/

### 2. 下载代码

```bash
git clone https://github.com/wangxiaoliang335/electron-livekit-client.git
cd electron-livekit-client
```

### 3. 安装依赖

```bash
npm install
```

### 4. 运行开发模式

```bash
npm run dev
```

### 5. 打包为 EXE（可选）

```bash
npm run build
```

打包完成后，在 `dist/` 目录下找到 `LiveKit Client Setup.exe` 安装包。

## 服务器配置

默认配置已指向服务器 `114.67.86.96`，如需修改，在 `src/renderer/index.html` 中：

- LiveKit 服务器：`ws://114.67.86.96:7880`
- Token 服务器：`http://114.67.86.96:8080`

## 使用方法

1. 打开客户端
2. 输入服务器地址（默认已填好）
3. 输入房间名（如 `test-room`）
4. 输入你的名字
5. 点击"连接房间"
6. 另一个用户加入同一房间即可开始视频通话

## 功能说明

### 视频通话
连接房间后，自动开启摄像头。

### 屏幕共享
点击"共享屏幕"，选择要共享的窗口或屏幕。

### 开关摄像头/麦克风
使用底部控制按钮切换。

## 项目结构

```
electron-livekit-client/
├── package.json
├── README.md
├── src/
│   ├── main/
│   │   ├── main.js      # Electron 主进程
│   │   └── preload.js   # 预加载脚本
│   └── renderer/
│       └── index.html   # 前端页面
└── dist/                # 打包输出
```
