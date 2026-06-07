import { useEffect } from 'react'
import { useUser } from '../../context/UserContext'
import { useLikes } from '../../context/LikesContext'
import './LikeButton.css'

interface LikeButtonProps {
  targetType: 'post' | 'comment'
  targetId: number
  initialLikeCount?: number
  initialLiked?: boolean
  size?: 'small' | 'medium'
}

export default function LikeButton({
  targetType,
  targetId,
  initialLikeCount = 0,
  initialLiked = false,
  size = 'medium',
}: LikeButtonProps) {
  const { currentUser } = useUser()
  const { getState, initTarget, toggleLike } = useLikes()

  useEffect(() => {
    initTarget(targetType, targetId, initialLikeCount, initialLiked)
  }, [targetType, targetId, initialLikeCount, initialLiked, initTarget])

  const { likeCount, likedByCurrentUser, pending } = getState(targetType, targetId)

  const handleClick = () => {
    if (!currentUser) return
    toggleLike(targetType, targetId)
  }

  const className = [
    'like-button',
    `like-button-${size}`,
    likedByCurrentUser ? 'liked' : '',
    pending ? 'pending' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={!currentUser || pending}
      title={likedByCurrentUser ? 'Unlike' : 'Like'}
      aria-label={likedByCurrentUser ? 'Unlike' : 'Like'}
      aria-pressed={likedByCurrentUser}
    >
      <span className="like-button-icon" aria-hidden="true">
        {/* Thumbs up icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={likedByCurrentUser ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L15 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </span>
      <span className="like-button-count">{likeCount}</span>
    </button>
  )
}