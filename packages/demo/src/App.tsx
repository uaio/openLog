import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import BasicTest from './pages/BasicTest'
import LoginFlow from './pages/LoginFlow'
import './App.css'

const NAV = [
  { path: '/basic', label: '🧪 基础功能测试', desc: 'Console / Network / Storage / Error' },
  { path: '/login', label: '🔐 登录流程', desc: '@openlog[checkpoint] 完整示例' },
]

function NavBar() {
  const { pathname } = useLocation()
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">📡</span>
        <span className="brand-name">openLog Demo</span>
        <span className="brand-tag">测试项目</span>
      </div>
      <div className="navbar-links">
        {NAV.map(n => (
          <Link key={n.path} to={n.path} className={`nav-link ${pathname === n.path ? 'active' : ''}`}>
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <h1>openLog 测试项目</h1>
        <p>用于验证 openLog 完整工作流：SDK 采集 → WS 传输 → PC 面板 → AI 工具</p>
      </div>
      <div className="home-cards">
        {NAV.map(n => (
          <Link key={n.path} to={n.path} className="home-card">
            <div className="card-label">{n.label}</div>
            <div className="card-desc">{n.desc}</div>
          </Link>
        ))}
      </div>
      <div className="home-tip">
        <strong>使用前：</strong>确保 <code>npx openlog</code> 已启动，并在控制台复制 SDK 接入地址配置到 <code>src/openlog.ts</code>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/basic" element={<BasicTest />} />
          <Route path="/login" element={<LoginFlow />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
