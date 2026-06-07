import Avatar from '../../components/common/Avatar'
import { formatDate } from '../../utils/formatDate'
import type { Conversation } from '../../types'
import './ConversationList.css'

interface ConversationListProps {
  conversations: Conversation[]
  activeConvId: number | null
  onSelectConversation: (id: number) => void
}

export default function ConversationList({
  conversations,
  activeConvId,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <aside className="messages-sidebar">
      <div className="messages-sidebar-header">
        <h2 className="messages-sidebar-title">Messages</h2>
      </div>
      <div className="messages-sidebar-list">
        {conversations.length === 0 ? (
          <div className="messages-sidebar-empty">
            No conversations yet. Visit a profile to start one!
          </div>
        ) : (
          conversations.map((conv) => {
            const other = conv.otherUser
            const lastMsg = conv.lastMessage
            const preview = lastMsg?.body || ''
            const truncated = preview.length > 50
              ? preview.slice(0, 50) + '…'
              : preview
            const isActive = conv.id === activeConvId
            return (
              <button
                key={conv.id}
                className={`messages-conv-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <Avatar
                  username={other?.displayName || other?.username}
                  size={40}
                />
                <div className="messages-conv-info">
                  <div className="messages-conv-top">
                    <span className="messages-conv-name">
                      {other?.displayName || other?.username}
                    </span>
                    <span className="messages-conv-time">
                      {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <div className="messages-conv-bottom">
                    <span className="messages-conv-preview">{truncated || 'No messages yet'}</span>
                    {conv.unreadCount > 0 && (
                      <span className="messages-conv-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}