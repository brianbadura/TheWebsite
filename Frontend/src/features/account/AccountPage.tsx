import { useState, useEffect } from 'react'
import Avatar from '../../components/common/Avatar'
import Toggle from '../../components/Toggle/Toggle'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import './AccountPage.css'

export default function AccountPage() {
  const { isDark, toggleTheme } = useTheme()
  const { currentUser, loading, saveProfile, changePassword } = useUser()

  const [displayName, setDisplayName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [saved, setSaved] = useState<boolean>(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false)
  const [passwordBusy, setPasswordBusy] = useState<boolean>(false)

  // Sync form fields when currentUser loads
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '')
      setEmail(currentUser.email || '')
      setBio(currentUser.bio || '')
    }
  }, [currentUser])

  const handleSave = () => {
    saveProfile({ displayName, email, bio })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError('Please enter your current password')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    }
    setPasswordBusy(false)
  }

  if (loading || !currentUser) {
    return (
      <main className="account-page">
        <h1 className="account-title">Account Settings</h1>
        <div className="account-card">
          <p className="account-avatar-label">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="account-page">
      <h1 className="account-title">Account Settings</h1>

      {/* Profile Card */}
      <div className="account-card">
        {/* Avatar */}
        <div className="account-avatar-section">
          <Avatar username={currentUser.displayName} size={64} />
          <div>
            <p className="account-avatar-label">Profile picture</p>
            <p className="account-avatar-label account-avatar-label-small">
              Click the avatar in the header to return here anytime.
            </p>
          </div>
        </div>

        {/* Username (read-only) */}
        <div className="account-field">
          <label className="account-field-label" htmlFor="account-username">
            Username
          </label>
          <input
            id="account-username"
            className="account-field-input"
            type="text"
            value={currentUser.username}
            readOnly
            autoComplete="username"
          />
        </div>

        {/* Name */}
        <div className="account-field">
          <label className="account-field-label" htmlFor="name">
            Display Name
          </label>
          <input
            id="name"
            className="account-field-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        {/* Email */}
        <div className="account-field">
          <label className="account-field-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            className="account-field-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        {/* Bio */}
        <div className="account-field">
          <label className="account-field-label" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            className="account-field-input account-textarea"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
          />
        </div>

        {/* Joined date (read-only) */}
        <div className="account-field">
          <label className="account-field-label" htmlFor="joined">
            Member Since
          </label>
          <input
            id="joined"
            className="account-field-input"
            type="text"
            value={new Date(currentUser.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            disabled
          />
        </div>

        {/* Save button */}
        <div className="account-field account-save-row">
          <button className="account-save-btn" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="account-card">
        <h2 className="account-section-title">Change Password</h2>

        <div className="account-field">
          <label className="account-field-label" htmlFor="current-password">
            Current Password
          </label>
          <input
            id="current-password"
            className="account-field-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            disabled={passwordBusy}
          />
        </div>

        <div className="account-field">
          <label className="account-field-label" htmlFor="new-password">
            New Password
          </label>
          <input
            id="new-password"
            className="account-field-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            disabled={passwordBusy}
          />
        </div>

        <div className="account-field">
          <label className="account-field-label" htmlFor="confirm-new-password">
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
            className="account-field-input"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Repeat your new password"
            disabled={passwordBusy}
          />
        </div>

        {passwordError && <p className="account-error">{passwordError}</p>}
        {passwordSuccess && <p className="account-success">Password changed successfully!</p>}

        <div className="account-field account-field-nomargin">
          <button
            className="account-save-btn"
            onClick={handleChangePassword}
            disabled={passwordBusy || !currentPassword || !newPassword || !confirmNewPassword}
          >
            {passwordBusy ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Theme Toggle Card */}
      <div className="account-card">
        <div className="account-field account-field-nomargin">
          <Toggle
            checked={isDark}
            onChange={toggleTheme}
            label="Dark Mode"
          />
        </div>
      </div>
    </main>
  )
}