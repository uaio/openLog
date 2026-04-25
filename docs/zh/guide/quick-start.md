# 快速开始

## 安装和运行

启动 openLog 最快的方式：

```bash
npx @openlogs/cli
```

这将在 38291 端口启动服务器并打开 Web 仪表板。

## 集成 SDK

将 SDK 添加到你的 H5 页面：

### 通过 CDN (IIFE)

```html
<script src="https://unpkg.com/@openlogs/sdk/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    server: 'ws://localhost:38291',
    projectId: 'my-app',
  });
</script>
```

### 通过 npm

```bash
npm install @openlogs/sdk
```

```typescript
import OpenLog from '@openlogs/sdk';

new OpenLog({
  server: 'ws://localhost:38291',
  projectId: 'my-app',
});
```

## CLI 选项

```bash
npx @openlogs/cli [options]

Options:
  -p, --port <number>       服务器端口（默认：38291）
  --no-open                 不自动打开浏览器
  --persist                 启用 SQLite 持久化
  --db-path <path>          数据库文件路径（默认：~/.openlog/data.db）
  --retention-days <days>   数据保留天数（默认：1）
  --api-key <key>           需要访问 API 密钥
  --cors-origin <origin>    允许的 CORS 来源（逗号分隔）
```

## 验证连接

SDK 初始化且服务器运行后：
1. 打开 Web 仪表板（自动打开或访问 `http://localhost:38291`）
2. 你的设备应该出现在左侧的设备列表中
3. 控制台日志、网络请求和性能数据将实时流入
