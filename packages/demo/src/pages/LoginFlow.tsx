import { useEffect, useState } from 'react'
import { initOpenLog } from '../openlog'

/**
 * 登录流程测试页
 *
 * 演示 @openlog[checkpoint] 完整使用方式：
 * AI 在关键节点埋入 console.log('@openlog[checkpoint] node: desc')
 * 通过 get_checkpoints 工具验证流程是否按预期执行
 */

interface CpNode {
  name: string
  desc: string
  hit: boolean
  data?: any
}

const FLOW_NODES: CpNode[] = [
  { name: 'page-ready', desc: '页面初始化完成', hit: false },
  { name: 'input-validate', desc: '表单输入验证通过', hit: false },
  { name: 'api-call', desc: '登录 API 请求发起', hit: false },
  { name: 'api-success', desc: '登录 API 成功响应', hit: false },
  { name: 'token-save', desc: 'Token 写入 localStorage', hit: false },
  { name: 'redirect', desc: '跳转到首页', hit: false },
]

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

export default function LoginFlow() {
  const [form, setForm] = useState({ username: 'test@example.com', password: '123456' })
  const [nodes, setNodes] = useState<CpNode[]>(FLOW_NODES.map(n => ({ ...n })))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<'idle' | 'success' | 'fail'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    initOpenLog().then(() => {
      console.log('@openlog[checkpoint] page-ready: 登录页初始化完成', {
        page: 'LoginFlow',
        ts: Date.now(),
      })
      hitNode('page-ready')
    })
  }, [])

  function hitNode(name: string, data?: any) {
    setNodes(prev => prev.map(n => n.name === name ? { ...n, hit: true, data } : n))
  }

  function addLog(msg: string) {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString('zh-CN', { hour12: false })} ${msg}`])
  }

  function resetFlow() {
    setNodes(FLOW_NODES.map(n => ({ ...n })))
    setResult('idle')
    setErrorMsg('')
    setLogs([])
    console.log('@openlog[checkpoint] page-ready: 流程重置，登录页重新就绪', { reset: true })
    hitNode('page-ready')
    addLog('流程已重置')
  }

  async function handleLogin() {
    if (running) return
    setRunning(true)
    setResult('idle')
    setErrorMsg('')

    try {
      // ── Step 1: 输入验证 ───────────────────────────────────────
      addLog('Step 1: 验证表单输入...')
      await sleep(300)

      if (!form.username || !form.password) {
        throw new Error('用户名或密码不能为空')
      }
      if (!form.username.includes('@')) {
        throw new Error('邮箱格式不正确')
      }
      if (form.password.length < 6) {
        throw new Error('密码长度不能少于 6 位')
      }

      console.log('@openlog[checkpoint] input-validate: 表单验证通过', {
        username: form.username,
        passwordLength: form.password.length,
      })
      hitNode('input-validate', { username: form.username })
      addLog('✅ 表单验证通过')

      // ── Step 2: 发起 API 请求 ──────────────────────────────────
      addLog('Step 2: 调用登录 API...')
      await sleep(200)

      console.log('@openlog[checkpoint] api-call: 登录 API 请求发起', {
        url: '/api/auth/login',
        method: 'POST',
        body: { username: form.username },
      })
      hitNode('api-call', { url: '/api/auth/login' })
      addLog('📡 API 请求已发起')

      // Mock API（使用 jsonplaceholder 模拟）
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
      if (!res.ok) throw new Error(`API 错误: ${res.status}`)
      const user = await res.json()

      // ── Step 3: 处理成功响应 ───────────────────────────────────
      console.log('@openlog[checkpoint] api-success: 登录 API 成功响应', {
        status: res.status,
        userId: user.id,
        username: user.username,
      })
      hitNode('api-success', { userId: user.id })
      addLog(`✅ API 响应成功：userId=${user.id}`)

      // ── Step 4: 保存 Token ─────────────────────────────────────
      await sleep(100)
      const token = `mock_token_${user.id}_${Date.now()}`
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify({ id: user.id, name: user.name }))

      console.log('@openlog[checkpoint] token-save: Token 写入 localStorage', {
        tokenPrefix: token.slice(0, 20) + '...',
        keys: ['auth_token', 'auth_user'],
      })
      hitNode('token-save', { tokenPrefix: token.slice(0, 20) })
      addLog('💾 Token 已保存')

      // ── Step 5: 跳转 ──────────────────────────────────────────
      await sleep(200)
      console.log('@openlog[checkpoint] redirect: 登录完成，准备跳转到首页', {
        from: '/login',
        to: '/',
        userId: user.id,
      })
      hitNode('redirect', { to: '/' })
      addLog('🔀 跳转到首页（Demo 中不实际跳转）')

      setResult('success')

    } catch (err: any) {
      console.error('@openlog[checkpoint] 登录流程异常', err)
      setErrorMsg(err.message)
      setResult('fail')
      addLog(`❌ 流程异常：${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  async function handleErrorFlow() {
    // 故意触发验证失败，演示 AI 如何发现缺失节点
    setForm({ username: 'bad-email', password: '123' })
    await sleep(100)
    await handleLogin()
    setForm({ username: 'test@example.com', password: '123456' })
  }

  const allHit = nodes.every(n => n.hit)
  const hitCount = nodes.filter(n => n.hit).length

  return (
    <div>
      <div className="page-header">
        <h2>🔐 登录流程</h2>
        <p>完整演示 <code>@openlog[checkpoint]</code> 打点规范 — 用 AI 工具的 <code>get_checkpoints</code> 验证流程</p>
      </div>

      {/* 流程图 */}
      <div className="section">
        <h3>📊 检查点进度 ({hitCount}/{nodes.length})</h3>
        <div className="checkpoint-result">
          {nodes.map(n => (
            <div key={n.name} className={`cp-item ${n.hit ? 'hit' : 'miss'}`}>
              <span>{n.hit ? '✅' : '⬜'}</span>
              <span className="cp-node">{n.name}</span>
              <span className="cp-desc">{n.desc}</span>
              {n.data && (
                <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 'auto' }}>
                  {JSON.stringify(n.data).slice(0, 40)}
                </span>
              )}
            </div>
          ))}
        </div>
        {allHit && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#e8f5e9', borderRadius: 6, fontSize: 13, color: '#2e7d32' }}>
            🎉 所有检查点均已命中！AI 验证：<code>get_checkpoints(feature="login")</code>
          </div>
        )}
      </div>

      {/* 表单 */}
      <div className="section">
        <h3>📋 登录表单</h3>
        <div className="form-group">
          <label>邮箱</label>
          <input
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="输入邮箱"
          />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="输入密码（≥6位）"
          />
        </div>
        {result === 'fail' && (
          <div style={{ padding: '8px 12px', background: '#fce4ec', borderRadius: 6, fontSize: 13, color: '#c62828', marginBottom: 12 }}>
            ❌ {errorMsg}
          </div>
        )}
        {result === 'success' && (
          <div style={{ padding: '8px 12px', background: '#e8f5e9', borderRadius: 6, fontSize: 13, color: '#2e7d32', marginBottom: 12 }}>
            ✅ 登录成功！（AI 现在可以调用 get_checkpoints 验证所有节点）
          </div>
        )}
        <div className="btn-group">
          <button className="btn-primary" onClick={handleLogin} disabled={running}>
            {running ? '⏳ 登录中...' : '🔐 正常登录流程'}
          </button>
          <button className="btn-warn" onClick={handleErrorFlow} disabled={running}>
            ⚠️ 触发验证失败（缺失节点示例）
          </button>
          <button className="btn-secondary" onClick={resetFlow} disabled={running}>
            🔄 重置
          </button>
        </div>
      </div>

      {/* 执行日志 */}
      <div className="section">
        <h3>🗒️ 执行记录</h3>
        <div className="log-output">
          {logs.length === 0 && <div style={{ color: '#555' }}>点击登录按钮开始流程…</div>}
          {[...logs].reverse().map((l, i) => (
            <div key={i} className="log-item log">{l}</div>
          ))}
        </div>
      </div>

      {/* AI 验证说明 */}
      <div className="section">
        <h3>🤖 如何让 AI 验证此流程</h3>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: '#555' }}>
          <p>1. 确保 <code>/openlog:start</code> 已执行（WS 连接已建立）</p>
          <p>2. 点击「正常登录流程」按钮</p>
          <p>3. 在 Claude Code 中输入：<code>/openlog:logs</code> 查看实时日志</p>
          <p>4. 或让 AI 调用 MCP 工具：<code>get_checkpoints(feature="login")</code></p>
          <p>5. AI 将返回哪些节点命中、哪些缺失，并给出修复建议</p>
        </div>
      </div>
    </div>
  )
}
