import { useEffect, useState } from 'react'
import api from '../api'
import { Send, Sparkles } from 'lucide-react'

export default function SendMessage() {
  const [templates, setTemplates] = useState([])
  const [contacts, setContacts] = useState([])
  const [mode, setMode] = useState('template') // 'template' | 'direct'
  const [templateId, setTemplateId] = useState('')
  const [content, setContent] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'tags' | 'specific'
  const [tags, setTags] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // AI
  const [aiContext, setAiContext] = useState('')
  const [aiTone, setAiTone] = useState('friendly')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')

  useEffect(() => {
    api.get('/templates').then(r => setTemplates(r.data.data)).catch(() => {})
    api.get('/contacts').then(r => setContacts(r.data.data)).catch(() => {})
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    setError(''); setResult(null); setLoading(true)
    try {
      const body = {}
      if (mode === 'template') body.templateId = templateId
      else body.content = content

      if (filterMode === 'tags' && tags) body.filters = { tags: tags.split(',').map(t => t.trim()) }
      else if (filterMode === 'specific') body.contactIds = selectedContacts

      const res = await api.post('/messages/send', body)
      setResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Send failed')
    } finally { setLoading(false) }
  }

  async function handleAIGenerate() {
    if (!aiContext) return
    setAiLoading(true); setAiResult('')
    try {
      const res = await api.post('/ai/generate', { context: aiContext, tone: aiTone })
      setAiResult(res.data.data.generatedText)
    } catch (err) {
      setAiResult('AI Error: ' + (err.response?.data?.error?.message || 'Failed'))
    } finally { setAiLoading(false) }
  }

  function useAIResult() {
    setContent(aiResult)
    setMode('direct')
    setAiResult('')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Send Message</h1>
        <p className="page-sub">Send messages to contacts with rate limiting and queue management</p>
      </div>

      {/* AI Assistant */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />AI Message Generator</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">What's your message about?</label>
            <input className="input" placeholder="e.g. Invite 2nd year students for hackathon" value={aiContext} onChange={e => setAiContext(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tone</label>
            <select className="select" value={aiTone} onChange={e => setAiTone(e.target.value)}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>
        <button className="btn btn-outline" onClick={handleAIGenerate} disabled={aiLoading || !aiContext}>
          <Sparkles size={16} /> {aiLoading ? 'Generating...' : 'Generate Draft'}
        </button>
        {aiResult && (
          <>
            <div className="ai-output">{aiResult}</div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={useAIResult}>Use This Draft</button>
          </>
        )}
      </div>

      {/* Send form */}
      <div className="card">
        <div className="card-header"><span className="card-title">Message Details</span></div>

        {error && <div className="alert alert-error">{error}</div>}
        {result && (
          <div className="alert alert-success">
            ✅ Queued {result.queuedCount} messages! Batch ID: {result.messageId}
          </div>
        )}

        <form onSubmit={handleSend}>
          {/* Message mode */}
          <div className="form-group">
            <label className="form-label">Message Source</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className={`btn ${mode === 'template' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('template')}>Use Template</button>
              <button type="button" className={`btn ${mode === 'direct' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('direct')}>Direct Message</button>
            </div>
          </div>

          {mode === 'template' ? (
            <div className="form-group">
              <label className="form-label">Template</label>
              <select className="select" value={templateId} onChange={e => setTemplateId(e.target.value)} required>
                <option value="">— Select template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Message (use {'{{name}}'} for personalization)</label>
              <textarea className="textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Hi {{name}}, welcome to our club!" required />
            </div>
          )}

          {/* Recipients */}
          <div className="form-group">
            <label className="form-label">Recipients</label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {['all', 'tags', 'specific'].map(m => (
                <button key={m} type="button" className={`btn ${filterMode === m ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterMode(m)} style={{ textTransform: 'capitalize' }}>
                  {m === 'all' ? 'All Contacts' : m === 'tags' ? 'By Tags' : 'Specific'}
                </button>
              ))}
            </div>
            {filterMode === 'tags' && (
              <input className="input" placeholder="CSE, 2nd_year (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
            )}
            {filterMode === 'specific' && (
              <select className="select" multiple style={{ height: 120 }} value={selectedContacts} onChange={e => setSelectedContacts([...e.target.selectedOptions].map(o => o.value))}>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} /> {loading ? 'Sending...' : 'Queue Messages'}
          </button>
        </form>
      </div>
    </div>
  )
}
