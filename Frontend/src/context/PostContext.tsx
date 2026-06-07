import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useUser } from './UserContext'
import type { PostContextType, Post } from '../types'

const PostContext = createContext<PostContextType | undefined>(undefined)

export function PostProvider({ children }: { children: ReactNode }) {
  const { currentUser, authFetch } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch all posts on mount (and whenever the current user changes so that
  // likedByCurrentUser fields reflect the right viewer).
  useEffect(() => {
    setLoading(true)
    authFetch('/api/posts')
      .then((res) => res.json())
      .then((data: Post[]) => {
        setPosts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentUser, authFetch])

  const createPost = useCallback(
    (description: string, image: string | null): void => {
      if (!currentUser) return

      authFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          description,
          image: image || null,
        }),
      })
        .then((res) => res.json())
        .then((newPost: Post) => {
          setPosts((prev) => [newPost, ...prev])
        })
    },
    [currentUser, authFetch]
  )

  const updatePost = useCallback((id: number, description: string, image: string | null): void => {
    authFetch(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ description, image: image || null }),
    })
      .then((res) => res.json())
      .then((updated: Post) => {
        setPosts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        )
      })
  }, [authFetch])

  const deletePost = useCallback((id: number): void => {
    authFetch(`/api/posts/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (res.ok) {
          setPosts((prev) => prev.filter((p) => p.id !== id))
        }
      })
  }, [authFetch])

  return (
    <PostContext.Provider value={{ posts, loading, createPost, updatePost, deletePost }}>
      {children}
    </PostContext.Provider>
  )
}

export function usePosts(): PostContextType {
  const context = useContext(PostContext)
  if (!context) throw new Error('usePosts must be used within a PostProvider')
  return context
}