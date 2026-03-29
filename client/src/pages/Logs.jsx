import { useEffect, useState } from 'react'
import api from '../api'
import { RefreshCw } from 'lucide-react'

const STATUS_CLASS = { sent: 'badge-green', failed: 'badge-red', pending: 'badge-yellow' }

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | sent | failed | pending
  const [tab, setTab] = useState('messages') // messages | audit

  async function load() {
    setLoading(true)
    try {
      if (tab === 'messages') {
        const res = await api.get('/logs/messages', { params: { status: filter === 'all' ? undefined : filter, limit: 100 } })
        setLogs(res.data.data)
      } else {
        const res = await api.get('/logs/audit', { params: { limit: 100 } })
        setLogs(res.data.data)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter, tab])

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Logs</h1>
          <p className="page-sub">Full delivery and audit trail</p>
        </div>
        <button className="btn btn-outline" onClick={load}><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button className={`btn ${tab === 'messages' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('messages')}>Message Logs</button>
        <button className={`btn ${tab === 'audit' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('audit')}>Audit Logs</button>
      </div>

      {/* Message filter */}
      {tab === 'messages' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {['all', 'sent', 'failed', 'pending'].map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : logs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>No logs found.</p>
        ) : tab === 'messages' ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Contact</th><th>Phone</th><th>Status</th><th>Attempts</th><th>Error</th><th>Time</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{l.contact?.name || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.phone}</td>
                    <td><span className={`badge ${STATUS_CLASS[l.status] || 'badge-gray'}`}>{l.status}</span></td>
                    <td>{l.attempt}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 12 }}>{l.error || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{l.sentAt ? new Date(l.sentAt).toLocaleString() : new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{l.user?.name || '—'}</td>
                    <td><span className="badge badge-gray">{l.action}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace' }}>{JSON.stringify(l.metadata).slice(0, 60)}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(l.createdAt).toLocaleString()}</td>
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
