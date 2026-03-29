import { useEffect, useState, useRef } from 'react'
import api from '../api'
import { Plus, X, Upload, Download, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react'

// ── Import Wizard (2-step) ────────────────────────────────
function ImportWizard({ onDone, onCancel }) {
  // Step 1: file pick + preview
  const [step, setStep] = useState(1) // 1 = upload, 2 = map columns, 3 = result
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null) // { headers, preview, totalRows }
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState('')

  // Step 2: mapping
  const [nameCol, setNameCol] = useState('')
  const [phoneCol, setPhoneCol] = useState('')
  const [tagsCol, setTagsCol] = useState('')
  const [importing, setImporting] = useState(false)

  // Step 3: result
  const [result, setResult] = useState(null)
  const [importError, setImportError] = useState('')

  const fileRef = useRef()

  // Auto-guess columns from header names
  function autoGuess(headers) {
    const find = (kws) => headers.find(h => kws.some(kw => h.toLowerCase().includes(kw))) || ''
    setNameCol(find(['name', 'student', 'member', 'candidate', 'full']))
    setPhoneCol(find(['phone', 'mobile', 'number', 'contact', 'whatsapp', 'cell']))
    setTagsCol(find(['tag', 'domain', 'branch', 'dept', 'role', 'category', 'group', 'label']))
  }

  async function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreviewError('')
    setPreview(null)
    setLoadingPreview(true)

    const fd = new FormData()
    fd.append('file', f)
    try {
      const res = await api.post('/contacts/import/preview', fd)
      setPreview(res.data.data)
      autoGuess(res.data.data.headers)
      setStep(2)
    } catch (err) {
      setPreviewError(err.response?.data?.error?.message || 'Could not read file')
    } finally { setLoadingPreview(false) }
  }

  async function handleImport() {
    if (!nameCol || !phoneCol) return
    setImporting(true); setImportError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('nameCol', nameCol)
    fd.append('phoneCol', phoneCol)
    if (tagsCol) fd.append('tagsCol', tagsCol)

    try {
      const res = await api.post('/contacts/import', fd)
      setResult(res.data.data)
      setStep(3)
      onDone()
    } catch (err) {
      setImportError(err.response?.data?.error?.message || 'Import failed')
    } finally { setImporting(false) }
  }

  // ── Step 1 ────────────────────────────────────────────────
  if (step === 1) return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Upload size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Import Contacts from Excel</span>
        <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => window.open('/contacts/template', '_blank')}>
          <Download size={13} /> Download Template
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        Works with <strong>any Excel format</strong> — you'll pick which column is which after uploading.
        Accepts <code>.xlsx</code> or <code>.xls</code>.
      </p>
      {previewError && <div className="alert alert-error">{previewError}</div>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="input"
          style={{ cursor: 'pointer' }}
          onChange={handleFileChange}
          disabled={loadingPreview}
        />
        <button className="btn btn-outline" onClick={onCancel}><X size={16} /> Cancel</button>
      </div>
      {loadingPreview && <p style={{ color: 'var(--text2)', marginTop: 12, fontSize: 13 }}>⏳ Reading file…</p>}
    </div>
  )

  // ── Step 2: Column Mapping ────────────────────────────────
  if (step === 2 && preview) return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Map Your Columns</span>
        <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { setStep(1); setFile(null); if (fileRef.current) fileRef.current.value = '' }}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        We detected <strong>{preview.totalRows} rows</strong> in your file.
        Tell us which column contains each field:
      </p>

      {/* Preview table */}
      <div className="table-wrap" style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 8 }}>
        <table style={{ fontSize: 12 }}>
          <thead>
            <tr>{preview.headers.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {preview.preview.map((row, i) => (
              <tr key={i}>{preview.headers.map(h => <td key={h} style={{ color: 'var(--text2)' }}>{row[h]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      {importError && <div className="alert alert-error">{importError}</div>}

      {/* Column selectors */}
      <div className="form-row" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Name column <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select className="select" value={nameCol} onChange={e => setNameCol(e.target.value)} required>
            <option value="">— select —</option>
            {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Phone column <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select className="select" value={phoneCol} onChange={e => setPhoneCol(e.target.value)} required>
            <option value="">— select —</option>
            {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group" style={{ maxWidth: 400 }}>
        <label className="form-label">Tags / Domain column <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(optional)</span></label>
        <select className="select" value={tagsCol} onChange={e => setTagsCol(e.target.value)}>
          <option value="">— none —</option>
          {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {/* Preview of mapped values */}
      {nameCol && phoneCol && (
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
          <strong style={{ color: 'var(--accent)' }}>Preview (first 3 rows):</strong>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {preview.preview.map((row, i) => (
              <div key={i} style={{ color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--text)' }}>{row[nameCol]}</strong>
                {' · '}{row[phoneCol]}
                {tagsCol && row[tagsCol] ? <span style={{ color: 'var(--accent)' }}> [{row[tagsCol]}]</span> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={importing || !nameCol || !phoneCol}
        >
          <ChevronRight size={16} />
          {importing ? `Importing ${preview.totalRows} rows…` : `Import ${preview.totalRows} contacts`}
        </button>
        <button className="btn btn-outline" onClick={onCancel}><X size={16} /> Cancel</button>
      </div>
    </div>
  )

  // ── Step 3: Result ────────────────────────────────────────
  if (step === 3 && result) return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <CheckCircle size={22} color="var(--accent)" />
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>Import complete!</span>
      </div>
      <div style={{ display: 'flex', gap: 24, fontSize: 15, marginBottom: 16 }}>
        <span>✅ Added: <strong>{result.imported}</strong></span>
        <span>🔄 Updated: <strong>{result.updated}</strong></span>
        <span>⚠️ Bad rows: <strong>{result.skippedRows}</strong></span>
        <span>❌ Failed: <strong>{result.failed}</strong></span>
      </div>
      {result.errors?.length > 0 && (
        <details style={{ marginBottom: 16 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            Show {result.errors.length} issue(s)
          </summary>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {result.errors.map((e, i) => <div key={i}>Row {e.row}: {e.reason}</div>)}
          </div>
        </details>
      )}
      <button className="btn btn-outline" onClick={onCancel}><X size={16} /> Close</button>
    </div>
  )

  return null
}

// ── Main Contacts Page ────────────────────────────────────
export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', tags: '' })
  const [error, setError] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  // Bulk selection
  const [selected, setSelected] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  async function loadContacts() {
    try {
      const res = await api.get('/contacts')
      setContacts(res.data.data)
      setSelected(new Set()) // clear selection on reload
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadContacts() }, [])

  async function handleAdd(e) {
    e.preventDefault(); setError('')
    try {
      await api.post('/contacts', {
        name: form.name, phone: form.phone,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      })
      setForm({ name: '', phone: '', tags: '' }); setShowForm(false); loadContacts()
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed') }
  }

  async function handleOptOut(id) {
    if (!confirm('Mark this contact as opted out?')) return
    try { await api.patch(`/contacts/${id}/opt-out`); loadContacts() } catch {}
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return
    try { await api.delete(`/contacts/${id}`); loadContacts() } catch {}
  }

  async function handleBulkDelete() {
    const ids = [...selected]
    if (!confirm(`Delete ${ids.length} selected contact(s)? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      await api.delete('/contacts/bulk', { data: { ids } })
      loadContacts()
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Bulk delete failed')
    } finally { setBulkDeleting(false) }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]
  const filtered = tagFilter ? contacts.filter(c => (c.tags || []).includes(tagFilter)) : contacts
  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-sub">{contacts.length} total · {contacts.filter(c => !c.optOut).length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => { setShowImport(true); setShowForm(false) }}>
            <Upload size={16} /> Import Excel
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setShowImport(false) }}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {showImport && (
        <ImportWizard onDone={() => { loadContacts() }} onCancel={() => setShowImport(false)} />
      )}

      {showForm && !showImport && (
        <div className="card">
          <div className="card-header"><span className="card-title">New Contact</span></div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Akshay Kumar" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone (with country code)</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="919876543210" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="interviewee, CSE, 2nd_year" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button className={`badge ${!tagFilter ? 'badge-green' : 'badge-gray'}`} style={{ cursor: 'pointer', border: 'none', padding: '6px 14px' }} onClick={() => setTagFilter('')}>All</button>
          {allTags.map(tag => (
            <button key={tag} className={`badge ${tagFilter === tag ? 'badge-green' : 'badge-gray'}`} style={{ cursor: 'pointer', border: 'none', padding: '6px 14px' }} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}>{tag}</button>
          ))}
        </div>
      )}

      {/* Bulk action toolbar */}
      {someSelected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{selected.size} selected</span>
          <button className="btn btn-danger" style={{ padding: '6px 16px' }} onClick={handleBulkDelete} disabled={bulkDeleting}>
            <X size={15} /> {bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
          </button>
          <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /><p>Loading contacts…</p></div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>
            {tagFilter ? `No contacts tagged "${tagFilter}"` : 'No contacts yet. Add one or import from Excel!'}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th>Name</th><th>Phone</th><th>Tags</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ background: selected.has(c.id) ? 'rgba(37,211,102,0.06)' : undefined }}>
                    <td>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>{c.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{c.phone}</td>
                    <td>{(c.tags || []).map(t => <span key={t} className="tag">{t}</span>)}</td>
                    <td><span className={`badge ${c.optOut ? 'badge-red' : 'badge-green'}`}>{c.optOut ? 'Opted Out' : 'Active'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!c.optOut && <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleOptOut(c.id)}>Opt Out</button>}
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    </td>
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

