# LiveKit Electron 客户端 - API 开发文档

本文档面向视频会议客户端开发人员，详细说明该客户端提供的所有接口和使用方法。

---

## 1. 项目概述

这是一个基于 Electron + LiveKit SDK 构建的桌面视频会议客户端，支持：
- 视频通话
- 音频通话
- 屏幕共享
- 房间管理

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron 主进程                         │
│  ┌─────────────────┐                                       │
│  │   main.js       │  - 创建窗口                            │
│  │                 │  - 处理 IPC 请求                       │
│  │                 │  - 管理桌面捕获源                       │
│  └─────────────────┘                                       │
│  ┌─────────────────┐                                       │
│  │   preload.js    │  - 暴露安全 API 到渲染进程             │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                     contextBridge
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Electron 渲染进程                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  index.html (LiveKit SDK + 前端逻辑)                     ││
│  │  - 连接房间                                             ││
│  │  - 发布/订阅音视频轨道                                   ││
│  │  - 屏幕共享                                             ││
│  │  - 媒体控制                                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                     WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                       LiveKit 服务器                         │
│  - WebSocket: wss://114.67.86.96:8443                        │
│  - Token 服务: https://114.67.86.96:8443                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 服务器配置

### 3.1 服务器地址

| 服务类型 | 地址 | 说明 |
|---------|------|------|
| LiveKit WebSocket | `wss://114.67.86.96:8443` | 音视频传输 |
| Token 服务 | `https://114.67.86.96:8443` | 认证 Token |

### 3.2 修改服务器地址

在 `src/renderer/index.html` 中修改：

```javascript:336:340:src/renderer/index.html
const serverUrl = document.getElementById('serverUrl').value;
// <input type="text" id="serverUrl" value="wss://114.67.86.96:8443">
```

Token 服务器地址在代码中修改：

```javascript:328:332:src/renderer/index.html
async function getToken(roomName, userName) {
  const response = await fetch(`https://114.67.86.96:8443/token?user=${userName}`);
  return await response.text();
}
```

---

## 4. 客户端暴露接口 (window.electronAPI)

该客户端通过 Electron 的 contextBridge 暴露了一个安全 API 对象 `window.electronAPI` 供前端调用。

### 4.1 获取屏幕共享源

获取可用于屏幕共享的窗口和屏幕列表。

**接口调用：**

```javascript
const sources = await window.electronAPI.getSources();
```

**返回数据：**

```typescript
interface DesktopSource {
  id: string;           // 源 ID，用于开始共享时传递
  name: string;        // 源名称（如窗口标题、屏幕名称）
  thumbnail: string;   // 缩略图 Base64 字符串 (data:image/png;base64,...)
}
```

**示例：**

```javascript
const sources = await window.electronAPI.getSources();
sources.forEach(source => {
  console.log(`源: ${source.name}`);
  console.log(`ID: ${source.id}`);
  console.log(`缩略图: ${source.thumbnail}`);
});
```

### 4.2 获取平台信息

获取客户端运行的操作平台。

**接口调用：**

```javascript
const platform = window.electronAPI.platform;
// 返回值: 'win32' | 'darwin' | 'linux'
```

---

## 5. LiveKit SDK 接口

前端使用 LiveKit SDK 进行视频会议功能开发。

### 5.1 初始化 Room

```javascript
room = new LiveKit.Room();
```

### 5.2 连接房间

```javascript
await room.connect(serverUrl, token);
```

**参数说明：**
| 参数 | 类型 | 说明 |
|-----|------|------|
| serverUrl | string | LiveKit WebSocket 服务器地址 |
| token | string | 认证 Token（从 Token 服务器获取） |

### 5.3 创建本地音视频轨道

```javascript
const tracks = await LiveKit.createLocalTracks({
  audio: true,   // 开启麦克风
  video: true    // 开启摄像头
});
```

### 5.4 发布本地轨道

```javascript
for (const track of tracks) {
  await room.localParticipant.publishTrack(track);
}
```

### 5.5 房间事件监听

```javascript
// 订阅远程轨道
room.on('trackSubscribed', (track, publication, participant) => {
  if (track.kind === 'video' || track.kind === 'audio') {
    track.attach(remoteVideo);
  }
});

// 取消订阅
room.on('trackUnsubscribed', (track) => {
  track.detach();
});

// 参与者加入
room.on('participantConnected', (participant) => {
  console.log('参与者加入:', participant.identity);
});

// 参与者离开
room.on('participantDisconnected', (participant) => {
  console.log('参与者离开:', participant.identity);
});
```

### 5.6 断开连接

```javascript
await room.disconnect();
```

---

## 6. 媒体控制接口

### 6.1 切换视频开关

```javascript
// 关闭视频
room.localParticipant.enableVideo(false);

// 开启视频
room.localParticipant.enableVideo(true);
```

### 6.2 切换音频开关

```javascript
// 关闭音频
room.localParticipant.enableAudio(false);

// 开启音频
room.localParticipant.enableAudio(true);
```

### 6.3 屏幕共享

#### 开始屏幕共享

**第一步：获取屏幕源**

```javascript
const sources = await window.electronAPI.getSources();
```

**第二步：选择源并开始共享**

```javascript
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: sourceId  // 从第一步获取的源 ID
    }
  },
  audio: false
});

const videoTrack = stream.getVideoTracks()[0];
const track = new LiveKit.LocalVideoTrack(videoTrack);
await room.localParticipant.publishTrack(track);

// 监听用户通过浏览器UI停止共享
videoTrack.onended = () => {
  stopScreenShare();
};
```

#### 停止屏幕共享

```javascript
for (const track of room.localParticipant.tracks.values()) {
  if (track.source === 'screen_share') {
    await room.localParticipant.unpublishTrack(track);
    track.track.stop();
  }
}
```

---

## 7. Token 获取接口

### 7.1 Token 服务

客户端需要从 Token 服务器获取认证 Token。

**请求方式：** GET

**请求地址：** `https://114.67.86.96:8443/token`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| user | string | 是 | 用户名/用户ID |
| room | string | 否 | 房间名（可选，默认使用 URL 中的 room 参数） |

**请求示例：**

```
GET https://114.67.86.96:8443/token?user=user1
```

**响应格式：**

直接返回 Token 字符串（纯文本，非 JSON）。

---

## 8. 完整使用示例

以下是一个完整的客户端连接和操作流程：

```javascript
// 1. 获取 Token
const token = await fetch('https://114.67.86.96:8443/token?user=user1')
  .then(res => res.text());

// 2. 创建 Room 实例
const room = new LiveKit.Room();

// 3. 监听事件
room.on('trackSubscribed', (track) => {
  if (track.kind === 'video') {
    track.attach(document.getElementById('remoteVideo'));
  }
});

room.on('participantConnected', (participant) => {
  console.log(participant.identity + ' 加入了房间');
});

// 4. 连接房间
await room.connect('wss://114.67.86.96:8443', token);

// 5. 创建并发布本地轨道
const tracks = await LiveKit.createLocalTracks({
  audio: true,
  video: true
});

for (const track of tracks) {
  await room.localParticipant.publishTrack(track);
  if (track.kind === 'video') {
    track.attach(document.getElementById('localVideo'));
  }
}

// 6. 媒体控制示例
// 关闭摄像头
room.localParticipant.enableVideo(false);

// 静音
room.localParticipant.enableAudio(false);

// 7. 断开连接
await room.disconnect();
```

---

## 9. 注意事项

1. **安全考虑**：生产环境中，Token 服务器应该实现完整的用户认证机制，不应直接暴露在公网。

2. **HTTPS 要求**：当客户端通过 HTTPS 访问时，getDisplayMedia 需要确保使用了安全的上下文。

3. **权限要求**：首次使用时，浏览器会请求摄像头和麦克风权限，需要用户授权。

4. **跨域问题**：开发时若遇到 CORS 问题，可以在 Electron 中设置 `webSecurity: false`（当前已设置）。

---

## 10. 故障排查

| 问题 | 可能原因 | 解决方案 |
|-----|---------|---------|
| 无法获取屏幕共享源 | Electron 版本问题或权限不足 | 检查 Electron 版本，更新到最新稳定版 |
| 连接失败 | 服务器地址错误或网络问题 | 确认服务器地址，检查网络连接 |
| 无法获取 Token | Token 服务器未运行 | 检查 Token 服务器是否启动 |
| 无远程视频 | 对方未发布视频轨道或网络问题 | 检查对方是否开启摄像头 |

---

## 11. 联系支持

如有问题，请联系开发团队。

---

*文档版本：1.0*
*最后更新：2026-03-15*
