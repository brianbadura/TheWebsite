import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMessages } from '../../context/MessagesContext'
import { useUser } from '../../context/UserContext'
import ConversationList from './ConversationList'
import ConversationPanel from './ConversationPanel'
import type { Message } from '../../types'
import './MessagesPage.css'

export default function MessagesPage() {
  const { currentUser } = useUser()
  const {
    conversations,
    fetchMessages,
    sendMessage,
    markAsRead,
  } = useMessages()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialConvId = searchParams.get('conversation')
  const [activeConvId, setActiveConvId] = useState<number | null>(
    initialConvId ? Number(initialConvId) : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState<string>('')
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false)
  const [sending, setSending] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Back button for mobile: deselect active conversation
  const handleBack = () => {
    setActiveConvId(null)
    setMessages([])
    navigate('/messages')
  }

  // If ?conversation=X is in the URL, activate it
  useEffect(() => {
    const c = searchParams.get('conversation')
    if (c) {
      const id = Number(c)
      if (!Number.isNaN(id)) setActiveConvId(id)
    }
  }, [searchParams])

  // Derive the active conversation object
  const activeConv = conversations.find((c) => c.id === activeConvId) || null

  // Load messages whenever the active conversation changes
  const loadMessages = useCallback(async (convId: number | null, isBackground: boolean = false) => {
    if (!convId) {
      setMessages([])
      return
    }
    if (!isBackground) setLoadingMessages(true)
    const data = await fetchMessages(convId)
    if (Array.isArray(data)) {
      setMessages((prev) => {
        // Only update if the data actually changed
        if (prev.length === data.length) {
          const changed = data.some((msg, i) => msg.id !== (prev[i]?.id ?? msg.id))
          if (!changed) return prev
        }
        return data
      })
    }
    if (!isBackground) setLoadingMessages(false)
  }, [fetchMessages])

  useEffect(() => {
    loadMessages(activeConvId)
    if (activeConvId) {
      markAsRead(activeConvId)
    }
  }, [activeConvId, loadMessages, markAsRead])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [messages])

  // Poll for new messages in the active conversation every 3 seconds
  useEffect(() => {
    if (!activeConvId) return
    const interval = setInterval(() => {
      loadMessages(activeConvId, true)
    }, 3000)
    return () => clearInterval(interval)
  }, [activeConvId, loadMessages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || !activeConvId || sending) return
    setSending(true)
    const newMsg = await sendMessage(activeConvId, body)
    if (newMsg) {
      setMessages((prev) => [...prev, newMsg])
    }
    setDraft('')
    setSending(false)
  }

  const handleSelectConversation = (id: number) => {
    setActiveConvId(id)
    navigate(`/messages?conversation=${id}`)
  }

  if (!currentUser) {
    return (
      <main className="messages-page">
        <div className="messages-empty">Please log in to view messages.</div>
      </main>
    )
  }

  return (
    <main className="messages-page">
      <div className={`messages-container ${activeConvId ? '' : 'no-active'}`}>
        <ConversationList
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConversation={handleSelectConversation}
        />
        <ConversationPanel
          activeConv={activeConv}
          currentUser={currentUser}
          messages={messages}
          loadingMessages={loadingMessages}
          messagesEndRef={messagesEndRef}
          draft={draft}
          setDraft={setDraft}
          sending={sending}
          onSend={handleSend}
          onBack={handleBack}
        />
      </div>
    </main>
  )
}