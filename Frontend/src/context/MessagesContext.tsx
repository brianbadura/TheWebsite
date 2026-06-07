import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useUser } from './UserContext'
import type { MessagesContextType, Conversation, Message } from '../types'

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { currentUser, authFetch } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [unreadConversations, setUnreadConversations] = useState<Conversation[]>([])

  // -------------------------------------------------------------------------
  // Fetchers
  // -------------------------------------------------------------------------

  const fetchConversations = useCallback(async () => {
    if (!currentUser) {
      setConversations([])
      return
    }
    try {
      const res = await authFetch('/api/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch {
      setConversations([])
    }
  }, [currentUser, authFetch])

  const fetchUnread = useCallback(async () => {
    if (!currentUser) {
      setUnreadCount(0)
      setUnreadConversations([])
      return
    }
    try {
      const res = await authFetch('/api/messages/unread')
      const data = await res.json() as { count: number; conversations: Conversation[] }
      setUnreadCount(data.count || 0)
      setUnreadConversations(data.conversations || [])
    } catch {
      setUnreadCount(0)
      setUnreadConversations([])
    }
  }, [currentUser, authFetch])

  const fetchOrCreateConversation = useCallback(async (otherUsername: string): Promise<Conversation | null> => {
    if (!currentUser) return null
    try {
      const res = await authFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          user2: otherUsername,
        }),
      })
      if (!res.ok) return null
      const data = await res.json() as Conversation
      // Refresh lists so the new conversation shows up
      await fetchConversations()
      await fetchUnread()
      return data
    } catch {
      return null
    }
  }, [currentUser, authFetch, fetchConversations, fetchUnread])

  const fetchMessages = useCallback(async (conversationId: number): Promise<Message[]> => {
    if (!conversationId || !currentUser) return []
    try {
      const res = await authFetch(`/api/conversations/${conversationId}/messages`)
      if (!res.ok) return []
      return await res.json() as Message[]
    } catch {
      return []
    }
  }, [currentUser, authFetch])

  const sendMessage = useCallback(async (conversationId: number, body: string): Promise<Message | null> => {
    if (!currentUser || !conversationId) return null
    try {
      const res = await authFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      if (!res.ok) return null
      const msg = await res.json() as Message
      // Refresh conversation list so the preview updates
      await fetchConversations()
      return msg
    } catch {
      return null
    }
  }, [currentUser, authFetch, fetchConversations])

  const markAsRead = useCallback(async (conversationId: number): Promise<void> => {
    if (!currentUser || !conversationId) return
    try {
      await authFetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      })
      // Refresh local state
      await fetchConversations()
      await fetchUnread()
    } catch {
      // ignore
    }
  }, [currentUser, authFetch, fetchConversations, fetchUnread])

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
      fetchUnread()
    } else {
      setConversations([])
      setUnreadCount(0)
      setUnreadConversations([])
    }
  }, [currentUser, fetchConversations, fetchUnread])

  // Poll for unread every 5 seconds
  useEffect(() => {
    if (!currentUser) return
    const interval = setInterval(() => {
      fetchUnread()
      fetchConversations()
    }, 5000)
    return () => clearInterval(interval)
  }, [currentUser, fetchUnread, fetchConversations])

  return (
    <MessagesContext.Provider value={{
      conversations,
      unreadCount,
      unreadConversations,
      fetchConversations,
      fetchOrCreateConversation,
      fetchMessages,
      sendMessage,
      markAsRead,
      fetchUnread,
    }}>
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages(): MessagesContextType {
  const context = useContext(MessagesContext)
  if (!context) throw new Error('useMessages must be used within a MessagesProvider')
  return context
}