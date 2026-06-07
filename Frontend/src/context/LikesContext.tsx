import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { useUser } from './UserContext'
import type { LikesContextType, LikeStateEntry } from '../types'

const LikesContext = createContext<LikesContextType | undefined>(undefined)

export function LikesProvider({ children }: { children: ReactNode }) {
  const { currentUser, authFetch } = useUser()
  // Map of `${type}:${id}` -> { likeCount, likedByCurrentUser, pending }
  const [state, setState] = useState<Record<string, LikeStateEntry>>({})
  // Mirror of the latest likedByCurrentUser values for accurate rollback
  const likedRef = useRef<Record<string, boolean>>({})

  const key = (type: string, id: number): string => `${type}:${id}`

  const getState = useCallback(
    (type: 'post' | 'comment', id: number): LikeStateEntry => {
      const k = key(type, id)
      return state[k] || {
        likeCount: 0,
        likedByCurrentUser: false,
        pending: false,
      }
    },
    [state]
  )

  // Initialize state for a target. Always syncs with the latest values from the API.
  const initTarget = useCallback((type: 'post' | 'comment', id: number, likeCount: number, likedByCurrentUser: boolean): void => {
    const k = key(type, id)
    likedRef.current[k] = likedByCurrentUser
    setState((prev) => ({
      ...prev,
      [k]: { likeCount, likedByCurrentUser, pending: false },
    }))
  }, [])

  // Toggle a like for a post or comment. Optimistic with rollback on error.
  const toggleLike = useCallback(
    async (type: 'post' | 'comment', id: number): Promise<void> => {
      if (!currentUser) return
      if (type !== 'post' && type !== 'comment') return

      const k = key(type, id)
      const url = type === 'post'
        ? `/api/posts/${id}/like`
        : `/api/comments/${id}/like`

      // Snapshot current state (from the ref) to know what we're flipping from
      const currentEntry = likedRef.current[k] !== undefined
        ? likedRef.current[k]
        : false

      // Bail if already in flight
      if (state[k]?.pending) return

      const willLike = !currentEntry

      // Optimistic update
      setState((prev) => {
        const existing = prev[k] || {
          likeCount: 0,
          likedByCurrentUser: currentEntry,
          pending: false,
        }
        return {
          ...prev,
          [k]: {
            ...existing,
            pending: true,
            likedByCurrentUser: willLike,
            likeCount: Math.max(0, existing.likeCount + (willLike ? 1 : -1)),
          },
        }
      })
      likedRef.current[k] = willLike

      try {
        const res = await authFetch(url, {
          method: willLike ? 'POST' : 'DELETE',
        })
        if (!res.ok) throw new Error('Like request failed')
        const data = await res.json() as { likeCount: number; likedByCurrentUser: boolean }

        setState((prev) => {
          const existing = prev[k] || {
            likeCount: data.likeCount,
            likedByCurrentUser: data.likedByCurrentUser,
            pending: true,
          }
          return {
            ...prev,
            [k]: {
              ...existing,
              likeCount: data.likeCount,
              likedByCurrentUser: data.likedByCurrentUser,
              pending: false,
            },
          }
        })
        likedRef.current[k] = data.likedByCurrentUser
      } catch {
        // Roll back optimistic update
        setState((prev) => {
          const existing = prev[k]
          if (!existing) return prev
          return {
            ...prev,
            [k]: {
              ...existing,
              likedByCurrentUser: currentEntry,
              likeCount: Math.max(0, existing.likeCount + (currentEntry ? 1 : -1)),
              pending: false,
            },
          }
        })
        likedRef.current[k] = currentEntry
      }
    },
    [currentUser, state, authFetch]
  )

  return (
    <LikesContext.Provider value={{ getState, initTarget, toggleLike }}>
      {children}
    </LikesContext.Provider>
  )
}

export function useLikes(): LikesContextType {
  const context = useContext(LikesContext)
  if (!context) throw new Error('useLikes must be used within a LikesProvider')
  return context
}