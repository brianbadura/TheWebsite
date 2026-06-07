import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { SITE_NAME } from '../../utils/constants'
import './RegisterPage.css'

export default function RegisterPage() {
  const { register } = useUser()
  const navigate = useNavigate()

  const [username, setUsername] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedUsername = username.trim().toLowerCase()
    if (!trimmedUsername) {
      setError('Username is required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setBusy(true)
    try {
      await register({
        username: trimmedUsername,
        displayName: displayName.trim() || trimmedUsername,
        email: email.trim().toLowerCase(),
        bio: bio.trim(),
        password,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setBusy(false)
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <h1 className="register-title">Join {SITE_NAME}</h1>
        <p className="register-subtitle">Create your account and start connecting.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label className="register-label" htmlFor="reg-username">Username *</label>
            <input
              id="reg-username"
              className="register-input"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="reg-displayname">Display Name</label>
            <input
              id="reg-displayname"
              className="register-input"
              type="text"
              placeholder="Your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="register-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="reg-bio">Bio</label>
            <textarea
              id="reg-bio"
              className="register-input register-textarea"
              rows={3}
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="reg-password">Password *</label>
            <input
              id="reg-password"
              className="register-input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="reg-confirm">Confirm Password *</label>
            <input
              id="reg-confirm"
              className="register-input"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          {error && <p className="register-error">{error}</p>}

          <button
            className="register-btn"
            type="submit"
            disabled={busy || !username.trim() || !password || !confirmPassword}
          >
            {busy ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  )
}