import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useUser } from './UserContext'
import type { FriendsContextType, FriendRequest } from '../types'

const FriendsContext = createContext<FriendsContextType | undefined>(undefined)

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { currentUser, authFetch } = useUser()
  const [friends, setFriends] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])

  const fetchFriends = useCallback(async () => {
    if (!currentUser) {
      setFriends([])
      setLoading(false)
      return
    }
    try {
      const res = await authFetch('/api/friends')
      const data = await res.json() as string[]
      setFriends(data)
    } catch {
      setFriends([])
    }
    setLoading(false)
  }, [currentUser, authFetch])

  const fetchIncomingRequests = useCallback(async () => {
    if (!currentUser) {
      setIncomingRequests([])
      return
    }
    try {
      const res = await authFetch('/api/friend-requests/incoming')
      const data = await res.json() as FriendRequest[]
      setIncomingRequests(data)
    } catch {
      setIncomingRequests([])
    }
  }, [currentUser, authFetch])

  const fetchOutgoingRequests = useCallback(async () => {
    if (!currentUser) {
      setOutgoingRequests([])
      return
    }
    try {
      const res = await authFetch('/api/friend-requests/outgoing')
      const data = await res.json() as FriendRequest[]
      setOutgoingRequests(data)
    } catch {
      setOutgoingRequests([])
    }
  }, [currentUser, authFetch])

  useEffect(() => {
    fetchFriends()
    fetchIncomingRequests()
    fetchOutgoingRequests()
  }, [currentUser, fetchFriends, fetchIncomingRequests, fetchOutgoingRequests])

  // Poll for incoming requests every 10 seconds
  useEffect(() => {
    if (!currentUser) return
    const interval = setInterval(() => {
      fetchIncomingRequests()
    }, 10000)
    return () => clearInterval(interval)
  }, [currentUser, fetchIncomingRequests])

  const sendFriendRequest = useCallback(
    async (username: string): Promise<void> => {
      if (!currentUser) return
      const res = await authFetch('/api/friend-requests', {
        method: 'POST',
        body: JSON.stringify({ receiver: username }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send friend request')
      }
      await fetchOutgoingRequests()
    },
    [currentUser, authFetch, fetchOutgoingRequests]
  )

  const acceptFriendRequest = useCallback(
    async (requestId: number): Promise<void> => {
      const res = await authFetch(`/api/friend-requests/${requestId}/accept`, {
        method: 'POST',
      })
      if (!res.ok) return
      // Refresh friends list and incoming requests
      await fetchFriends()
      await fetchIncomingRequests()
    },
    [currentUser, authFetch, fetchFriends, fetchIncomingRequests]
  )

  const rejectFriendRequest = useCallback(
    async (requestId: number): Promise<void> => {
      const res = await authFetch(`/api/friend-requests/${requestId}/reject`, {
        method: 'POST',
      })
      if (!res.ok) return
      await fetchIncomingRequests()
    },
    [currentUser, authFetch, fetchIncomingRequests]
  )

  const removeFriend = useCallback(
    async (username: string): Promise<void> => {
      if (!currentUser) return
      const res = await authFetch(`/api/friends/${username}`, {
        method: 'DELETE',
      })
      const data = await res.json() as string[]
      setFriends(data)
    },
    [currentUser, authFetch]
  )

  const isFriend = useCallback(
    (username: string): boolean => friends.includes(username),
    [friends]
  )

  const hasPendingRequest = useCallback(
    (username: string): boolean => {
      return outgoingRequests.some((r) => r.sender?.username === currentUser?.username && r.receiver?.username === username)
    },
    [outgoingRequests, currentUser]
  )

  const hasIncomingRequestFrom = useCallback(
    (username: string): boolean => {
      return incomingRequests.some((r) => r.sender?.username === username)
    },
    [incomingRequests]
  )

  const getIncomingRequestFrom = useCallback(
    (username: string): FriendRequest | undefined => {
      return incomingRequests.find((r) => r.sender?.username === username)
    },
    [incomingRequests]
  )

  return (
    <FriendsContext.Provider value={{
      friends,
      loading,
      incomingRequests,
      outgoingRequests,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      isFriend,
      hasPendingRequest,
      hasIncomingRequestFrom,
      getIncomingRequestFrom,
    }}>
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends(): FriendsContextType {
  const context = useContext(FriendsContext)
  if (!context) throw new Error('useFriends must be used within a FriendsProvider')
  return context
}