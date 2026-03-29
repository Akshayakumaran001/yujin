import { useEffect, useState } from 'react'
import api from '../api'
import { Plus, X, Pencil, Check } from 'lucide-react'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', content: '' })
  const [error, setError] = useState('')

  // Editing state
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', content: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  async function load() {
    try { const r = await api.get('/templates'); setTemplates(r.data.data) }
    catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault(); setError('')
    try {
      await api.post('/templates', form)
      setForm({ name: '', content: '' }); setShowForm(false); load()
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed') }
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditForm({ name: t.name, content: t.content })
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  async function handleUpdate(id) {
    if (!editForm.name || !editForm.content) return
    setEditLoading(true); setEditError('')
    try {
      await api.put(`/templates/${id}`, editForm)
      setEditingId(null); load()
    } catch (err) {
      setEditError(err.response?.data?.error?.message || 'Update failed')
    } finally { setEditLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return
    try { await api.delete(`/templates/${id}`); load() } catch {}
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-sub">Reusable message formats with {'{{placeholders}}'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> New Template</button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header"><span className="card-title">Create Template</span></div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Template Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Welcome Message" />
            </div>
            <div className="form-group">
              <label className="form-label">Content (use {'{{name}}'}, {'{{club}}'}, etc.)</label>
              <textarea className="textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required placeholder="Hi {{name}}, welcome to our club! 🎉" style={{ minHeight: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Create</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : templates.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>No templates yet. Create one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {templates.map(t => (
              <div key={t.id}>
                {editingId === t.id ? (
                  /* ── Inline Edit Row ── */
                  <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: 10, margin: '4px 0' }}>
                    {editError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{editError}</div>}
                    <div className="form-row" style={{ marginBottom: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Name</label>
                        <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Content</label>
                      <textarea className="textarea" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} style={{ minHeight: 100 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary" style={{ padding: '6px 16px' }} onClick={() => handleUpdate(t.id)} disabled={editLoading}>
                        <Check size={15} /> {editLoading ? 'Saving…' : 'Save'}
                      </button>
                      <button className="btn btn-outline" style={{ padding: '6px 16px' }} onClick={cancelEdit}>
                        <X size={15} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal Row ── */
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 4px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {t.content.slice(0, 160)}{t.content.length > 160 ? '…' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
                        Created {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => startEdit(t)}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleDelete(t.id)}>
                        <X size={13} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
