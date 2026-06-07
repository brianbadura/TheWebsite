import { useState, useEffect, useCallback, type RefObject } from 'react'
import { useUser } from '../../context/UserContext'
import Comment from '../Comment/Comment'
import type { Comment as CommentType } from '../../types'
import './CommentSection.css'

interface CommentSectionProps {
  postId: number
  inputRef: RefObject<HTMLTextAreaElement | null>
  composerOpen: boolean
  onCancel: () => void
}

export default function CommentSection({ postId, inputRef, composerOpen, onCancel }: CommentSectionProps) {
  const { currentUser, authFetch } = useUser()
  const [comments, setComments] = useState<CommentType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [newComment, setNewComment] = useState<string>('')

  const fetchComments = useCallback(() => {
    setLoading(true)
    authFetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data: CommentType[]) => {
        setComments(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [postId, authFetch])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCreateComment = () => {
    const trimmed = newComment.trim()
    if (!trimmed || !currentUser) return

    authFetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content: trimmed,
      }),
    })
      .then((res) => res.json())
      .then((created: CommentType) => {
        setComments((prev) => [created, ...prev])
        setNewComment('')
      })
  }

  const handleCancelComment = () => {
    setNewComment('')
    onCancel?.()
  }

  const handleReply = (commentId: number, content: string) => {
    if (!currentUser) return

    authFetch(`/api/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({
        content,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        // Refresh to get the full updated tree
        fetchComments()
      })
  }

  const handleEdit = (commentId: number, content: string) => {
    if (!currentUser) return

    authFetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        content,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchComments()
      })
  }

  const handleDelete = (commentId: number) => {
    if (!currentUser) return

    authFetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.ok) {
          fetchComments()
        }
      })
  }

  return (
    <div className="comment-section">
      {currentUser && composerOpen && (
        <div className="comment-composer">
          <textarea
            ref={inputRef}
            className="comment-composer-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
          />
          <div className="comment-composer-actions">
            <button
              className="comment-composer-btn comment-composer-btn-cancel"
              onClick={handleCancelComment}
            >
              Cancel
            </button>
            <button
              className="comment-composer-btn"
              onClick={handleCreateComment}
              disabled={!newComment.trim()}
            >
              Comment
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="comment-section-loading">Loading comments...</p>
      ) : comments.length === 0 ? null : (
        <div className="comment-list">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}