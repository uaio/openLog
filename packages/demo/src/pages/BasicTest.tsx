import { useEffect, useRef, useState } from 'react'
import { initOpenLog } from '../openlog'

interface LogItem {
  level: 'log' | 'info' | 'warn' | 'error' | 'checkpoint'
  msg: string
  time: string
}

function useLocalLogs() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const add = (level: LogItem['level'], msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    setLogs(prev => [...prev.slice(-49), { level, msg, time }])
  }
  return { logs, add }
}

export default function BasicTest() {
  const { logs, add } = useLocalLogs()
  const [sdkReady, setSdkReady] = useState(false)
  const reqCount = useRef(0)

  useEffect(() => {
    initOpenLog().then(() => setSdkReady(true))
  }, [])

  // ── Console 测试 ──────────────────────────────────────────
  const testLog = () => { console.log('这是一条普通日志', { ts: Date.now() }); add('log', '发送 console.log') }
  const testInfo = () => { console.info('这是一条 info 日志'); add('info', '发送 console.info') }
  const testWarn = () => { console.warn('这是一条警告', { code: 'W001' }); add('warn', '发送 console.warn') }
  const testError = () => { console.error('这是一条错误', new Error('测试错误')); add('error', '发送 console.error') }
  const testBatch = () => {
    for (let i = 1; i <= 5; i++) console.log(`批量日志 #${i}`, { i, ts: Date.now() })
    add('log', '发送 5 条批量日志')
  }
  const testObject = () => { console.log('对象测试', { user: { id: 1, name: '测试用户' }, arr: [1, 2, 3] }); add('log', '发送复杂对象') }

  // ── Network 测试 ──────────────────────────────────────────
  const testFetch = async () => {
    reqCount.current++
    add('info', `发起 fetch 请求 #${reqCount.current}`)
    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${reqCount.current}`)
      const data = await res.json()
      console.log('fetch 响应', data)
      add('log', `fetch 完成：${res.status} ${JSON.stringify(data).slice(0, 60)}`)
    } catch (e: any) {
      add('error', `fetch 失败：${e.message}`)
    }
  }
  const testFetchFail = async () => {
    add('warn', '发起注定失败的请求')
    try {
      await fetch('https://httpstat.us/500')
    } catch (e: any) {
      console.error('请求失败', e)
      add('error', `请求异常：${e.message}`)
    }
  }

  // ── Storage 测试 ──────────────────────────────────────────
  const testSetStorage = () => {
    const val = `value_${Date.now()}`
    localStorage.setItem('openlog_test_key', val)
    console.log('localStorage.setItem', { key: 'openlog_test_key', value: val })
    add('log', `写入 localStorage: ${val}`)
  }
  const testGetStorage = () => {
    const val = localStorage.getItem('openlog_test_key')
    console.log('localStorage.getItem', { key: 'openlog_test_key', value: val })
    add('log', `读取 localStorage: ${val ?? '(未设置)'}`)
  }
  const testClearStorage = () => {
    localStorage.removeItem('openlog_test_key')
    console.log('localStorage.removeItem', 'openlog_test_key')
    add('warn', '清除 localStorage key')
  }

  // ── Error 测试 ──────────────────────────────────────────
  const testUncaughtError = () => {
    add('error', '即将触发未捕获错误')
    setTimeout(() => {
      throw new Error('测试未捕获错误 — openLog 应该能捕获此错误')
    }, 100)
  }
  const testPromiseReject = () => {
    add('error', '即将触发未处理 Promise rejection')
    Promise.reject(new Error('测试未处理 Promise rejection'))
  }

  return (
    <div>
      <div className="page-header">
        <h2>🧪 基础功能测试</h2>
        <p>测试 openLog SDK 各项数据采集能力，打开 PC 面板实时查看</p>
      </div>

      <div className="section">
        <h3>
          SDK 状态：
          <span className={`status-badge ${sdkReady ? 'connected' : 'disconnected'}`}>
            {sdkReady ? '✅ 已初始化' : '⏳ 加载中...'}
          </span>
        </h3>
        <p style={{ fontSize: 12, color: '#888' }}>
          修改 <code>src/openlog.ts</code> 中的 <code>SERVER_URL</code> 或设置环境变量 <code>VITE_OPENLOG_SERVER=ws://192.168.x.x:38291</code>
        </p>
      </div>

      <div className="section">
        <h3>📝 Console 日志</h3>
        <div className="btn-group">
          <button className="btn-secondary" onClick={testLog}>log</button>
          <button className="btn-secondary" onClick={testInfo}>info</button>
          <button className="btn-warn" onClick={testWarn}>warn</button>
          <button className="btn-danger" onClick={testError}>error</button>
          <button className="btn-secondary" onClick={testObject}>对象</button>
          <button className="btn-secondary" onClick={testBatch}>批量 ×5</button>
        </div>
      </div>

      <div className="section">
        <h3>🌐 网络请求</h3>
        <div className="btn-group">
          <button className="btn-primary" onClick={testFetch}>fetch 请求</button>
          <button className="btn-danger" onClick={testFetchFail}>500 错误请求</button>
        </div>
      </div>

      <div className="section">
        <h3>💾 Storage</h3>
        <div className="btn-group">
          <button className="btn-success" onClick={testSetStorage}>写入 localStorage</button>
          <button className="btn-secondary" onClick={testGetStorage}>读取 localStorage</button>
          <button className="btn-warn" onClick={testClearStorage}>清除 key</button>
        </div>
      </div>

      <div className="section">
        <h3>💥 错误捕获</h3>
        <div className="btn-group">
          <button className="btn-danger" onClick={testUncaughtError}>触发未捕获错误</button>
          <button className="btn-danger" onClick={testPromiseReject}>Promise rejection</button>
        </div>
      </div>

      <div className="section">
        <h3>📋 本页操作记录</h3>
        <div className="log-output">
          {logs.length === 0 && <div style={{ color: '#555' }}>点击上方按钮开始测试…</div>}
          {[...logs].reverse().map((l, i) => (
            <div key={i} className={`log-item ${l.level}`}>
              <span className="log-time">{l.time}</span>
              {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
