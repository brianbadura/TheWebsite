import { useState } from 'react'
import { usePosts } from '../../context/PostContext'
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog'
import './PostComposer.css'

export default function PostComposer() {
  const { createPost } = usePosts()
  const [text, setText] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [focused, setFocused] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)

  const trimmed = text.trim()
  const hasContent = trimmed.length > 0

  const handlePost = () => {
    if (!hasContent) return
    setShowConfirm(true)
  }

  const confirmPost = () => {
    createPost(trimmed, imageUrl.trim() || null)
    setText('')
    setImageUrl('')
    setFocused(false)
    setShowConfirm(false)
  }

  const cancelPost = () => {
    setShowConfirm(false)
  }

  const handleCancelCompose = () => {
    setText('')
    setImageUrl('')
    setFocused(false)
  }

  return (
    <>
      <div className="post-composer">
        <textarea
          className="post-composer-textarea"
          placeholder="What's going on?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          rows={focused ? 3 : 1}
        />
        {focused && (
          <>
            <input
              type="url"
              className="post-composer-image-input"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div className="post-composer-actions">
              <button
                className="post-composer-btn post-composer-btn-cancel"
                onClick={handleCancelCompose}
              >
                Cancel
              </button>
              <button
                className="post-composer-btn post-composer-btn-post"
                disabled={!hasContent}
                onClick={handlePost}
              >
                Post
              </button>
            </div>
          </>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to post this?"
          onConfirm={confirmPost}
          onCancel={cancelPost}
        />
      )}
    </>
  )
}