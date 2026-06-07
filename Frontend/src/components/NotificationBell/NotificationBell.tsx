import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFriends } from '../../context/FriendsContext'
import Avatar from '../common/Avatar'
import './NotificationBell.css'

export default function NotificationBell() {
  const { incomingRequests, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const [open, setOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const toggleOpen = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pendingCount = incomingRequests.length

  const handleAccept = async (requestId: number) => {
    await acceptFriendRequest(requestId)
  }

  const handleReject = async (requestId: number) => {
    await rejectFriendRequest(requestId)
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={toggleOpen}
        aria-label={`Friend requests (${pendingCount} pending)`}
        title={`Friend requests (${pendingCount} pending)`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {pendingCount > 0 && (
          <span className="notification-bell-badge">{pendingCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            Friend Requests
          </div>
          {pendingCount === 0 ? (
            <div className="notification-dropdown-empty">
              No pending requests
            </div>
          ) : (
            <div className="notification-dropdown-list">
              {incomingRequests.map((req) => (
                <div key={req.id} className="notification-request-item">
                  <button
                    className="notification-request-user"
                    onClick={() => {
                      close()
                      navigate(`/profile/${req.sender.username}`)
                    }}
                  >
                    <Avatar username={req.sender.displayName} size={32} />
                    <div className="notification-request-info">
                      <span className="notification-request-name">
                        {req.sender.displayName}
                      </span>
                      <span className="notification-request-username">
                        @{req.sender.username}
                      </span>
                    </div>
                  </button>
                  <div className="notification-request-actions">
                    <button
                      className="notification-accept-btn"
                      onClick={() => handleAccept(req.id)}
                      title="Accept"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      className="notification-reject-btn"
                      onClick={() => handleReject(req.id)}
                      title="Reject"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}