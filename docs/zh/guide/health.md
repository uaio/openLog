# 健康检查

健康检查面板为当前页面提供自动化的诊断评分，帮助快速识别性能和稳定性问题。

## 健康评分

综合健康评分（0–100）由四个维度计算得出：

| 维度 | 权重 | 衡量内容 |
|-----------|--------|-----------------|
| 错误率 | 30% | 最近 5 分钟内的 JS 错误 |
| 长任务 | 25% | 主线程阻塞（>50ms 的任务） |
| 内存使用 | 25% | JS 堆内存利用率 |
| Web Vitals | 20% | LCP + CLS + INP 综合评分 |

### 评级

| 评级 | 分数 | 含义 |
|-------|-------|---------|
| 🟢 健康 | 80–100 | 页面运行良好 |
| 🟡 警告 | 60–79 | 检测到一些问题 |
| 🔴 严重 | 0–59 | 需要立即处理 |

## 检查内容

### 错误率
- 统计 5 分钟滑动窗口内的 `console.error` 和未捕获异常
- 错误数为 0 时评分 = 100；随错误数量线性下降

### 长任务
- 阻塞主线程超过 50ms 的任务总时长
- 总阻塞时间 <100ms 时评分 = 100
- 随阻塞时间增加逐渐趋向 0

### 内存使用
- 读取 `performance.memory.usedJSHeapSize`（仅限 Chrome）
- 根据已用/总堆内存比例计算评分
- 在不支持的浏览器中回退为中性评分（70）

### Web Vitals 综合
- 结合 LCP、CLS 和 INP 评级
- 每个 Core Web Vitals 贡献相等权重
- `good` = 100，`needs-improvement` = 50，`poor` = 0

## 使用健康检查

### PC 面板

**健康**标签页（🩺）显示：
- 总体评分和评级徽章
- 各维度的独立评分及进度条
- 具体问题和建议
- 历史评分趋势（如果启用了持久化）

### MCP 工具

```
health_check: {}
```

返回结构化健康数据供 AI 分析：
```json
{
  "score": 72,
  "grade": "Warning",
  "dimensions": {
    "errorRate": { "score": 90, "details": "5分钟内2个错误" },
    "longTasks": { "score": 55, "details": "总阻塞320ms" },
    "memory": { "score": 70, "details": "45MB / 100MB 堆内存" },
    "vitals": { "score": 75, "details": "LCP 良好, CLS 良好, INP 需改进" }
  },
  "recommendations": [
    "减少主线程阻塞 — 考虑代码拆分或使用 Web Workers",
    "优化 INP — 检查事件处理器中是否有大量计算"
  ]
}
```

### SDK（编程方式）

健康检查是基于收集的数据在服务端计算的。SDK 本身不暴露健康检查方法——请使用 REST API 或 MCP 工具。

```bash
curl http://localhost:38291/api/devices/:id/health
```

## 提示

- 页面活动超过 30 秒后健康检查效果最佳（足够的数据量）
- 在 SDK 配置中启用性能监控（`performance.enabled: true`）以获取准确的 Vitals 数据
- 内存指标仅在基于 Chromium 的浏览器中可用
- 使用 `--persist` 标志来追踪健康评分的变化趋势
