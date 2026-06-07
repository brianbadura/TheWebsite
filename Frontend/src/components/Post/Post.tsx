import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { useUser } from '../../context/UserContext'
import { usePosts } from '../../context/PostContext'
import Avatar from '../common/Avatar'
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog'
import CommentSection from '../CommentSection/CommentSection'
import LikeButton from '../LikeButton/LikeButton'
import './Post.css'

interface PostProps {
  id: number
  userId: number
  username: string
  displayName: string
  image: string | null
  description: string
  createdAt: string
  commentCount: number
  likeCount: number
  likedByCurrentUser: boolean
}

export default function Post({ id, userId, username, displayName, image, description, createdAt, commentCount, likeCount, likedByCurrentUser }: PostProps) {
  const { currentUser } = useUser()
  const { updatePost, deletePost } = usePosts()
  const profilePath = `/profile/${username}`
  const isOwnPost = currentUser && userId === currentUser.id

  const [editing, setEditing] = useState<boolean>(false)
  const [editText, setEditText] = useState<string>(description)
  const [editImageUrl, setEditImageUrl] = useState<string>(image || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [composerOpen, setComposerOpen] = useState<boolean>(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const openComposer = () => {
    setComposerOpen(true)
    setTimeout(() => commentInputRef.current?.focus(), 0)
  }
  const closeComposer = () => {
    setComposerOpen(false)
  }
  const toggleComposer = () => {
    if (composerOpen) {
      setComposerOpen(false)
    } else {
      openComposer()
    }
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    const trimmedImage = editImageUrl.trim()
    const imageChanged = trimmedImage !== (image || '')
    if (trimmed && (trimmed !== description || imageChanged)) {
      updatePost(id, trimmed, trimmedImage || null)
    }
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(description)
    setEditImageUrl(image || '')
    setEditing(false)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deletePost(id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <article className="post-card">
        {/* Info first: Description + Meta */}
        <div className="post-body">
          {/* Meta: Avatar + Username + Time */}
          <div className="post-meta">
            <Link to={profilePath} className="post-author-link">
              <div className="post-author">
                <Avatar username={displayName || username} size={32} />
                <div className="post-author-info">
                  <span className="post-display-name">{displayName || username}</span>
                  <span className="post-username">@{username}</span>
                </div>
              </div>
            </Link>
            <time className="post-time" dateTime={createdAt}>
              {formatDate(createdAt)}
            </time>
          </div>

          {/* Description or Edit textarea */}
          {editing ? (
            <div className="post-edit-area">
              <textarea
                className="post-edit-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
              />
              <input
                type="url"
                className="post-edit-image-input"
                placeholder="Image URL (optional)"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
              />
              <div className="post-edit-actions">
                <button className="post-btn post-btn-cancel" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button
                  className="post-btn post-btn-save"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="post-description">{description}</p>
          )}
        </div>

        {/* Image second (hidden while editing) */}
        {!editing && image && (
          <div className="post-image-wrapper">
            <img
              src={image}
              alt={`Post by ${username}`}
              className="post-image"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Action icons row */}
        <div className="post-actions">
          <button
            className="post-action-btn"
            onClick={toggleComposer}
            title="Toggle comments"
          >
            💬 <span className="post-action-label">Leave a comment</span>
          </button>
          <LikeButton
            targetType="post"
            targetId={id}
            initialLikeCount={likeCount}
            initialLiked={likedByCurrentUser}
          />
          {isOwnPost && !editing && (
            <div className="post-actions-right">
              <button className="post-action-btn" onClick={() => setEditing(true)} title="Edit post">
                ✏️
              </button>
              <button className="post-action-btn post-action-btn-danger" onClick={handleDelete} title="Delete post">
                🗑️
              </button>
            </div>
          )}
        </div>

        <CommentSection
          postId={id}
          inputRef={commentInputRef}
          composerOpen={composerOpen}
          onCancel={closeComposer}
        />
      </article>

      {showDeleteConfirm && (
        <ConfirmDialog
          message="Are you sure you want to delete this post?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}