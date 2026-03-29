import { useEffect, useState } from 'react'
import api from '../api'
import { CheckCircle, XCircle, Clock, Wifi, WifiOff, Pause, Play } from 'lucide-react'

export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [summary, setSummary] = useState(null)
  const [messages, setMessages] = useState([])
  const user = JSON.parse(localStorage.getItem('wa_user') || '{}')

  async function load() {
    try {
      const [s, sum, msgs] = await Promise.all([
        api.get('/system/status'),
        api.get('/logs/summary'),
        api.get('/messages'),
      ])
      setStatus(s.data.data)
      setSummary(sum.data.data)
      setMessages(msgs.data.data.slice(0, 10))
    } catch {}
  }

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id) }, [])

  async function togglePause() {
    try {
      if (status?.isPaused) await api.post('/system/resume')
      else await api.post('/system/pause')
      load()
    } catch (err) { alert(err.response?.data?.error?.message || 'Action failed') }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">WhatsApp Automation System — System Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">WhatsApp Status</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 12 }}>
            {status?.whatsappConnected
              ? <><span className="status-dot dot-green" /><span style={{ color: 'var(--accent)' }}>Connected</span></>
              : <><span className="status-dot dot-red" /><span style={{ color: 'var(--danger)' }}>Disconnected</span></>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sent Today</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{summary?.today?.sent ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Today</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{summary?.today?.failed ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Queue Size</div>
          <div className="stat-value">{status?.queueSize ?? '—'}</div>
        </div>
      </div>

      {/* Success rate */}
      {summary && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Delivery Rate</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: summary.successRate >= 80 ? 'var(--accent)' : 'var(--danger)' }}>
              {summary.successRate}%
            </span>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 8, height: 8 }}>
            <div style={{ background: 'var(--accent)', height: 8, borderRadius: 8, width: `${summary.successRate}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}

      {/* Controls (admin only) */}
      {user.role === 'ADMIN' && status && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">System Control</span>
            <span className={`badge ${status.isPaused ? 'badge-red' : 'badge-green'}`}>
              {status.isPaused ? '⏸ Paused' : '▶ Running'}
            </span>
          </div>
          <button className={`btn ${status.isPaused ? 'btn-primary' : 'btn-danger'}`} onClick={togglePause}>
            {status.isPaused ? <><Play size={16} /> Resume System</> : <><Pause size={16} /> Pause System (Kill Switch)</>}
          </button>
        </div>
      )}

      {/* Recent messages */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Message Batches</span>
        </div>
        {messages.length === 0
          ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 24 }}>No messages sent yet</p>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Recipients</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.id.slice(0, 12)}…</td>
                      <td>
                        <span className={`badge ${m.status === 'completed' ? 'badge-green' : m.status === 'processing' ? 'badge-yellow' : 'badge-gray'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td>{m._count?.messageLogs ?? 0}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{new Date(m.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}
