import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SITE_NAME } from '../../utils/constants'
import { useUser } from '../../context/UserContext'
import { useFriends } from '../../context/FriendsContext'
import Avatar from '../common/Avatar'
import NotificationBell from '../NotificationBell/NotificationBell'
import MessageBell from '../MessageBell/MessageBell'
import './Header.css'

interface SearchUser {
  username: string
  displayName: string
}

export default function Header() {
  const { currentUser, logout } = useUser()
  const { incomingRequests } = useFriends()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/')
  }

  // Fetch search results with debounce
  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json() as SearchUser[]
      setSearchResults(data)
      setShowDropdown(data.length > 0)
    } catch {
      setSearchResults([])
    }
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSearchResults(value)
    }, 300)
  }

  const handleSelectResult = (username: string) => {
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
    closeMenu()
    navigate(`/profile/${username}`)
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={closeMenu}>
          {SITE_NAME}
        </Link>

        {/* Search bar (logged in only) */}
        {currentUser && (
          <div className="header-search" ref={searchRef}>
            <input
              type="search"
              className="header-search-input"
              placeholder="Search users..."
              autoComplete="off"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true)
              }}
            />
            {showDropdown && (
              <div className="header-search-dropdown">
                {searchResults.map((user) => (
                  <button
                    key={user.username}
                    className="header-search-result"
                    onClick={() => handleSelectResult(user.username)}
                  >
                    <Avatar username={user.displayName} size={32} />
                    <div className="header-search-result-info">
                      <span className="header-search-result-name">{user.displayName}</span>
                      <span className="header-search-result-username">@{user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop nav */}
        <nav className="header-nav-desktop">
          {currentUser ? (
            <>
              <MessageBell />
              <NotificationBell />
              <Link to="/account" className="header-link header-settings-btn" title="Account Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
              <Link to={`/profile/${currentUser.username}`} className="header-link">
                <Avatar username={currentUser.displayName} size={36} />
              </Link>
              <button className="header-link header-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="header-link header-login-link">Log In</Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <nav className="header-nav-mobile">
          {currentUser ? (
            <>
              <div className="header-link-mobile header-link-mobile-row">
                <MessageBell />
                <span>Messages</span>
              </div>
              <div className="header-link-mobile header-link-mobile-row">
                <NotificationBell />
                <span>Friend Requests ({incomingRequests.length})</span>
              </div>
              <Link to={`/profile/${currentUser.username}`} className="header-link-mobile" onClick={closeMenu}>
                Profile
              </Link>
              <Link to="/account" className="header-link-mobile" onClick={closeMenu}>
                Account Settings
              </Link>
              <button className="header-link-mobile header-logout-btn-mobile" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="header-link-mobile" onClick={closeMenu}>
              Log In
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}