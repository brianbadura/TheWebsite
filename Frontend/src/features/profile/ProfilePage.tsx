import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import Avatar from '../../components/common/Avatar'
import Post from '../../components/Post/Post'
import { useFriends } from '../../context/FriendsContext'
import { usePosts } from '../../context/PostContext'
import { useUser } from '../../context/UserContext'
import { useMessages } from '../../context/MessagesContext'
import { useState, useEffect } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import type { User, FriendRequest } from '../../types'
import './ProfilePage.css'

interface UsersMapValue {
  displayName: string
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { currentUser, authFetch } = useUser()
  const navigate = useNavigate()
  const { isFriend, sendFriendRequest, removeFriend, hasPendingRequest, hasIncomingRequestFrom, getIncomingRequestFrom, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const { posts } = usePosts()
  const { fetchOrCreateConversation } = useMessages()

  const [user, setUser] = useState<User | null>(null)
  const [notFound, setNotFound] = useState<boolean>(false)
  const [confirmRemove, setConfirmRemove] = useState<boolean>(false)
  const [profileFriends, setProfileFriends] = useState<string[]>([])
  const [friendsUserMap, setFriendsUserMap] = useState<Record<string, UsersMapValue>>({})
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false)
  const [openingMessage, setOpeningMessage] = useState<boolean>(false)

  useEffect(() => {
    // If this is the current user's profile, use cached currentUser data
    if (currentUser && currentUser.username === username) {
      setUser(currentUser)
      setNotFound(false)
      return
    }

    authFetch(`/api/users/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data: User) => {
        setUser(data)
        setNotFound(false)
      })
      .catch(() => {
        setNotFound(true)
      })
  }, [username, currentUser, authFetch])

  // Fetch the profile user's friends
  useEffect(() => {
    if (!user) return
    setFriendsLoading(true)
    authFetch(`/api/friends?owner=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data: string[]) => {
        if (Array.isArray(data)) {
          setProfileFriends(data)
        } else {
          setProfileFriends([])
        }
      })
      .catch(() => setProfileFriends([]))
      .finally(() => setFriendsLoading(false))
  }, [user, authFetch])

  // Fetch user display names for the profile's friends
  useEffect(() => {
    if (profileFriends.length === 0) {
      setFriendsUserMap({})
      return
    }
    authFetch('/api/users')
      .then((res) => res.json())
      .then((data: Record<string, UsersMapValue>) => setFriendsUserMap(data))
      .catch(() => setFriendsUserMap({}))
  }, [profileFriends, authFetch])

  if (notFound || (!user && currentUser && currentUser.username !== username)) {
    return (
      <main className="profile-page">
        <div className="profile-error">
          <h1 className="profile-error-title">User not found</h1>
          <p>The user &ldquo;{username}&rdquo; doesn&rsquo;t exist.</p>
          <Link to="/" style={{ color: 'var(--text-secondary)' }}>
            &larr; Back to feed
          </Link>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-loading">Loading...</div>
      </main>
    )
  }

  const userPosts = posts.filter((post) => post.userId === user.id)
  const friendStatus = isFriend(username!)
  const requestSent = hasPendingRequest(username!)
  const incoming = hasIncomingRequestFrom(username!)
  const incomingRequest: FriendRequest | undefined = incoming ? getIncomingRequestFrom(username!) : undefined

  const handleFriendAction = async () => {
    if (friendStatus) {
      setConfirmRemove(true)
    } else if (incoming && incomingRequest) {
      await acceptFriendRequest(incomingRequest.id)
    } else if (requestSent) {
      // Do nothing — request already sent
    } else {
      try {
        await sendFriendRequest(username!)
      } catch {
        // already handled
      }
    }
  }

  let buttonLabel = '+ Add Friend'
  let buttonClass = 'profile-friend-btn'
  let disabled = false

  if (friendStatus) {
    buttonLabel = 'Remove Friend'
    buttonClass = 'profile-friend-btn friend'
  } else if (incoming && incomingRequest) {
    buttonLabel = 'Accept Request'
    buttonClass = 'profile-friend-btn accept-request'
  } else if (requestSent) {
    buttonLabel = 'Request Sent'
    buttonClass = 'profile-friend-btn request-sent'
    disabled = true
  }

  // Show reject button if there's an incoming request
  const showReject = incoming && incomingRequest

  const handleReject = async () => {
    if (incomingRequest) {
      await rejectFriendRequest(incomingRequest.id)
    }
  }

  const handleConfirmRemove = async () => {
    setConfirmRemove(false)
    await removeFriend(username!)
  }

  const handleCancelRemove = () => {
    setConfirmRemove(false)
  }

  const handleMessage = async () => {
    if (!user || openingMessage) return
    setOpeningMessage(true)
    try {
      const conv = await fetchOrCreateConversation(user.username)
      if (conv && conv.id) {
        navigate(`/messages?conversation=${conv.id}`)
      }
    } finally {
      setOpeningMessage(false)
    }
  }

  const getFriendDisplayName = (friendUsername: string): string => {
    const friendUser = friendsUserMap[friendUsername]
    return friendUser ? friendUser.displayName : friendUsername
  }

  return (
    <main className="profile-page">
      {confirmRemove && (
        <ConfirmDialog
          message={`Are you sure you want to remove ${user.displayName} as a friend?`}
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
        />
      )}

      {/* Profile card */}
      <div className="profile-card">
        <div className="profile-header">
          <Avatar username={user.displayName} size={72} />
          <div className="profile-info">
            <h1 className="profile-display-name">{user.displayName}</h1>
            <p className="profile-username">@{user.username}</p>
          </div>
        </div>

        <p className="profile-bio">{user.bio}</p>

        <div className="profile-actions">
          {currentUser && currentUser.username === username ? null : (
            <>
              <button
                className={buttonClass}
                onClick={handleFriendAction}
                disabled={disabled}
              >
                {buttonLabel}
              </button>
              {showReject && (
                <button
                  className="profile-reject-btn"
                  onClick={handleReject}
                >
                  Reject
                </button>
              )}
              <button
                className="profile-message-btn"
                onClick={handleMessage}
                disabled={openingMessage}
              >
                {openingMessage ? 'Opening…' : '✉ Message'}
              </button>
            </>
          )}
        </div>

        <div className="profile-meta">
          <span>📅</span>
          <span>Joined {formatDate(user.joinedAt)}</span>
        </div>
      </div>

      {/* Friends list */}
      <div className="profile-friends-section">
        <h2 className="profile-friends-title">
          Friends {profileFriends.length > 0 && `(${profileFriends.length})`}
        </h2>
        {friendsLoading ? (
          <div className="profile-friends-loading">Loading friends...</div>
        ) : profileFriends.length === 0 ? (
          <div className="profile-friends-empty">No friends yet.</div>
        ) : (
          <div className="profile-friends-grid">
            {profileFriends.map((friendUsername) => (
              <Link
                key={friendUsername}
                to={`/profile/${friendUsername}`}
                className="profile-friend-card"
              >
                <Avatar
                  username={getFriendDisplayName(friendUsername)}
                  size={40}
                />
                <span className="profile-friend-name">
                  {getFriendDisplayName(friendUsername)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* User's posts */}
      <h2 className="profile-posts-title">
        Posts {userPosts.length > 0 && `(${userPosts.length})`}
      </h2>

      {userPosts.length === 0 ? (
        <div className="profile-empty">
          No posts yet.
        </div>
      ) : (
        <div className="profile-posts">
          {userPosts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              userId={post.userId}
              username={post.username}
              displayName={post.displayName || user.displayName}
              image={post.image}
              description={post.description}
              createdAt={post.createdAt}
              commentCount={post.commentCount}
              likeCount={post.likeCount}
              likedByCurrentUser={post.likedByCurrentUser}
            />
          ))}
        </div>
      )}
    </main>
  )
}