import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFriends } from '../../context/FriendsContext'
import { useMessages } from '../../context/MessagesContext'
import Avatar from '../common/Avatar'
import './FriendsSidebar.css'

interface UsersMapValue {
  displayName: string
}

export default function FriendsSidebar() {
  const { friends } = useFriends()
  const { fetchOrCreateConversation } = useMessages()
  const navigate = useNavigate()
  const [minimized, setMinimized] = useState<boolean>(false)
  const [usersMap, setUsersMap] = useState<Record<string, UsersMapValue>>({})
  const [opening, setOpening] = useState<string | null>(null)

  useEffect(() => {
    if (friends.length === 0) {
      setUsersMap({})
      return
    }

    fetch('/api/users')
      .then((res) => res.json())
      .then((data: Record<string, UsersMapValue>) => {
        // data is keyed by username (e.g. { "alice_dev": { ... }, "bob_designs": { ... } })
        setUsersMap(data)
      })
  }, [friends])

  const getDisplayName = (username: string): string => {
    const user = usersMap[username]
    return user ? user.displayName : username
  }

  const toggleMinimized = () => setMinimized((prev) => !prev)

  const handleMessage = async (e: React.MouseEvent, username: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (opening === username) return
    setOpening(username)
    try {
      const conv = await fetchOrCreateConversation(username)
      if (conv && conv.id) {
        setMinimized(false)
        navigate(`/messages?conversation=${conv.id}`)
      }
    } finally {
      setOpening(null)
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`friends-sidebar ${minimized ? 'minimized' : ''}`}>
        {minimized ? (
          <div className="friends-sidebar-tab" onClick={toggleMinimized} role="button" tabIndex={0} title="Show friends list">
            Friends ({friends.length})
          </div>
        ) : (
          <div className="friends-sidebar-content">
            <div className="friends-sidebar-header">
              <h3 className="friends-sidebar-title">Friends ({friends.length})</h3>
               <button className="friends-sidebar-toggle-btn" onClick={toggleMinimized} title="Minimize">
                 ✕
               </button>
            </div>
            <div className="friends-sidebar-list">
              {friends.length === 0 ? (
                <div className="friends-sidebar-empty">
                  No friends yet. Visit someone&rsquo;s profile to add them!
                </div>
              ) : (
                friends.map((username) => {
                  const displayName = getDisplayName(username)
                  return (
                    <div key={username} className="friends-sidebar-item-wrapper">
                      <Link
                        to={`/profile/${username}`}
                        className="friends-sidebar-item"
                        onClick={() => setMinimized(false)}
                      >
                        <Avatar username={displayName} size={28} />
                        <span className="friends-sidebar-item-name">{displayName}</span>
                      </Link>
                      <button
                        className="friends-sidebar-msg-btn"
                        onClick={(e) => handleMessage(e, username)}
                        disabled={opening === username}
                        title="Send message"
                        aria-label={`Message ${displayName}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}