import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import Avatar from '../common/Avatar'
import LikeButton from '../LikeButton/LikeButton'
import type { User, Comment as CommentType } from '../../types'
import './Comment.css'

interface CommentProps {
  comment: CommentType
  currentUser: User | null
  onReply: (commentId: number, content: string) => void
  onEdit: (commentId: number, content: string) => void
  onDelete: (commentId: number) => void
}

export default function Comment({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
}: CommentProps) {
  const [showReplyInput, setShowReplyInput] = useState<boolean>(false)
  const [replyText, setReplyText] = useState<string>('')
  const [editing, setEditing] = useState<boolean>(false)
  const [editText, setEditText] = useState<string>(comment.content)

  const isOwnComment = currentUser && comment.userId === currentUser.id
  const profilePath = `/profile/${comment.username}`

  const handleSubmitReply = () => {
    const trimmed = replyText.trim()
    if (trimmed) {
      onReply(comment.id, trimmed)
      setReplyText('')
      setShowReplyInput(false)
    }
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== comment.content) {
      onEdit(comment.id, trimmed)
    }
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(comment.content)
    setEditing(false)
  }

  return (
    <div className="comment">
      <div className="comment-main">
        <Link to={profilePath} className="comment-author-link">
          <Avatar username={comment.displayName || comment.username} size={28} />
        </Link>
        <div className="comment-body">
          <div className="comment-header">
            <Link to={profilePath} className="comment-author-link">
              <span className="comment-display-name">
                {comment.displayName || comment.username}
              </span>
            </Link>
            <span className="comment-username">@{comment.username}</span>
            <span className="comment-time">{formatDate(comment.createdAt)}</span>
          </div>

          {editing ? (
            <div className="comment-edit-area">
              <textarea
                className="comment-edit-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                autoFocus
              />
              <div className="comment-edit-actions">
                <button className="comment-btn comment-btn-cancel" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button
                  className="comment-btn comment-btn-save"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="comment-content">{comment.content}</p>
          )}

          <div className="comment-actions-row">
            <button
              className="comment-action-btn"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              💬 Reply
            </button>
            <LikeButton
              targetType="comment"
              targetId={comment.id}
              initialLikeCount={comment.likeCount}
              initialLiked={comment.likedByCurrentUser}
              size="small"
            />
            {isOwnComment && !editing && (
              <>
                <button
                  className="comment-action-btn"
                  onClick={() => setEditing(true)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="comment-action-btn comment-action-btn-danger"
                  onClick={() => onDelete(comment.id)}
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>

          {showReplyInput && (
            <div className="comment-reply-input-area">
              <textarea
                className="comment-reply-textarea"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                autoFocus
              />
              <div className="comment-reply-actions">
                <button
                  className="comment-btn comment-btn-cancel"
                  onClick={() => {
                    setShowReplyInput(false)
                    setReplyText('')
                  }}
                >
                  Cancel
                </button>
                <button
                  className="comment-btn comment-btn-save"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim()}
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}