import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMessages } from '../../context/MessagesContext'
import Avatar from '../common/Avatar'
import { formatDate } from '../../utils/formatDate'
import './MessageBell.css'

export default function MessageBell() {
  const { unreadCount, unreadConversations, markAsRead } = useMessages()
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

  const handleOpenConversation = async (convId: number) => {
    close()
    await markAsRead(convId)
    navigate(`/messages?conversation=${convId}`)
  }

  const handleSeeAll = () => {
    close()
    navigate('/messages')
  }

  return (
    <div className="message-bell" ref={dropdownRef}>
      <button
        className="message-bell-btn"
        onClick={toggleOpen}
        aria-label={`Messages (${unreadCount} unread)`}
        title={`Messages (${unreadCount} unread)`}
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
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {unreadCount > 0 && (
          <span className="message-bell-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="message-dropdown">
          <div className="message-dropdown-header">
            Messages
          </div>
          {unreadConversations.length === 0 ? (
            <div className="message-dropdown-empty">
              No new messages
            </div>
          ) : (
            <div className="message-dropdown-list">
              {unreadConversations.map((preview) => {
                const other = preview.otherUser
                const latest = preview.lastMessage
                const previewText = latest?.body || ''
                const truncated = previewText.length > 60
                  ? previewText.slice(0, 60) + '…'
                  : previewText
                return (
                  <button
                    key={preview.conversationId ?? preview.id}
                    className="message-preview-item"
                    onClick={() => handleOpenConversation(preview.conversationId ?? preview.id)}
                  >
                    <Avatar username={other?.displayName || other?.username} size={36} />
                    <div className="message-preview-info">
                      <div className="message-preview-top">
                        <span className="message-preview-name">
                          {other?.displayName || other?.username}
                        </span>
                        <span className="message-preview-time">
                          {latest?.createdAt ? formatDate(latest.createdAt) : ''}
                        </span>
                      </div>
                      <div className="message-preview-bottom">
                        <span className="message-preview-text">{truncated}</span>
                        {preview.unreadCount > 0 && (
                          <span className="message-preview-count">
                            {preview.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          <div className="message-dropdown-footer">
            <button className="message-see-all-btn" onClick={handleSeeAll}>
              See all messages
            </button>
          </div>
        </div>
      )}
    </div>
  )
}