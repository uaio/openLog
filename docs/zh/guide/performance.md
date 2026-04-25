# 性能监控

openLog 通过 Web Vitals 和运行时指标提供全面的性能监控。

## 采集的指标

### Web Vitals
- **LCP**（Largest Contentful Paint）— 加载性能
- **CLS**（Cumulative Layout Shift）— 视觉稳定性
- **FCP**（First Contentful Paint）— 首次渲染速度
- **TTFB**（Time to First Byte）— 服务器响应时间
- **INP**（Interaction to Next Paint）— 交互响应性

### 运行时指标
- **FPS** — 通过 requestAnimationFrame 采样获取的每秒帧数
- **内存** — JS 堆内存使用量（当可用时）
- **长任务** — 阻塞主线程超过 50ms 的任务
- **资源计时** — 各个资源的加载耗时

## 性能评分

Perf Run 功能提供综合评分（0-100）及等级：

| 等级 | 分数范围 | 描述 |
|-------|------------|-------------|
| A | 90-100 | 性能优秀 |
| B | 75-89 | 性能良好，有少量优化空间 |
| C | 60-74 | 性能一般，建议优化 |
| D | 45-59 | 性能较差，需要优化 |
| F | 0-44 | 性能严重不足，需立即处理 |

## 健康检查

健康面板自动评估以下指标：
- 近期错误率（5 分钟窗口）
- 长任务总耗时
- 内存使用量
- 未压缩的大型资源
