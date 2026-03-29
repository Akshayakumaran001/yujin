import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Send, Users, FileText, ScrollText, LogOut, Zap } from 'lucide-react'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('wa_user') || '{}')

  function logout() {
    localStorage.removeItem('wa_token')
    localStorage.removeItem('wa_user')
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/send', icon: <Send size={18} />, label: 'Send Message' },
    { to: '/contacts', icon: <Users size={18} />, label: 'Contacts' },
    { to: '/templates', icon: <FileText size={18} />, label: 'Templates' },
    { to: '/logs', icon: <ScrollText size={18} />, label: 'Logs' },
  ]

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Yujin
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>{user.role}</div>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
