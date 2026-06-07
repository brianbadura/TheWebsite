import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { SITE_NAME } from '../../utils/constants'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useUser()
  const navigate = useNavigate()

  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your username or email')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setBusy(true)
    setError('')
    try {
      await login(trimmed, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to {SITE_NAME}.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            id="login-username"
            className="login-input"
            type="text"
            placeholder="Username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            disabled={busy}
          />
          <input
            id="login-password"
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn" type="submit" disabled={busy || !username.trim() || !password}>
            {busy ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <Link to="/register">Join the Club</Link>
        </p>
      </div>
    </main>
  )
}