import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Zap } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('wa_token', res.data.data.token)
      localStorage.setItem('wa_user', JSON.stringify(res.data.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          Yujin
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>
          Sign in to your club dashboard
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@club.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginTop: 20 }}>
          First time? Use <code style={{ color: 'var(--accent)' }}>POST /auth/register</code> to create admin account.
        </p>
      </div>
    </div>
  )
}
