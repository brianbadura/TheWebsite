import { Link } from 'react-router-dom'
import Avatar from '../../components/common/Avatar'
import { formatDate } from '../../utils/formatDate'
import type { Conversation, Message, User } from '../../types'
import './ConversationPanel.css'

interface ConversationPanelProps {
  activeConv: Conversation | null
  currentUser: User | null
  messages: Message[]
  loadingMessages: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  draft: string
  setDraft: (value: string) => void
  sending: boolean
  onSend: (e?: React.FormEvent) => Promise<void>
  onBack: () => void
}

export default function ConversationPanel({
  activeConv,
  currentUser,
  messages,
  loadingMessages,
  messagesEndRef,
  draft,
  setDraft,
  sending,
  onSend,
  onBack,
}: ConversationPanelProps) {
  if (!activeConv) {
    return (
      <section className="messages-panel">
        <div className="messages-panel-empty">
          <p>Select a conversation to start chatting</p>
        </div>
      </section>
    )
  }

  return (
    <section className="messages-panel">
      <div className="messages-panel-header">
        <button
          className="messages-panel-back"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Link
          to={`/profile/${activeConv.otherUser?.username}`}
          className="messages-panel-user"
        >
          <Avatar
            username={activeConv.otherUser?.displayName || activeConv.otherUser?.username}
            size={36}
          />
          <div className="messages-panel-userinfo">
            <span className="messages-panel-name">
              {activeConv.otherUser?.displayName || activeConv.otherUser?.username}
            </span>
            <span className="messages-panel-username">
              @{activeConv.otherUser?.username}
            </span>
          </div>
        </Link>
      </div>

      <div className="messages-thread">
        {loadingMessages ? (
          <div className="messages-thread-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="messages-thread-empty">
            No messages yet — say hi!
          </div>
        ) : (
          <>
            <div className="messages-thread-spacer" />
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.id
              return (
                <div
                  key={msg.id}
                  className={`message-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                >
                  <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    <div className="message-bubble-body">{msg.body}</div>
                    <div className="message-bubble-time">
                      {msg.createdAt ? formatDate(msg.createdAt) : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="messages-composer" onSubmit={onSend}>
        <input
          type="text"
          className="messages-composer-input"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="messages-composer-send"
          disabled={!draft.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  )
}