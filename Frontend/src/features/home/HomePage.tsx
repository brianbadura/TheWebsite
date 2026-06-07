import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { usePosts } from '../../context/PostContext'
import { SITE_NAME } from '../../utils/constants'
import Post from '../../components/Post/Post'
import PostComposer from '../../components/PostComposer/PostComposer'
import './HomePage.css'

export default function HomePage() {
  const { currentUser } = useUser()
  const { posts } = usePosts()
  const navigate = useNavigate()

  return (
    <main className="home-page">
      {/* Hero Section — only for logged-out visitors */}
      {!currentUser && (
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">
              Connect with friends who share your passions.
            </h1>
            <p className="hero-subtitle">
              Join {SITE_NAME} — a community where every voice matters. Share posts,
              make friends, and be part of something great.
            </p>
            <button className="hero-cta" onClick={() => navigate('/register')}>
              Join the Club!
            </button>
          </div>
        </section>
      )}

      {/* Feed Section */}
      <section className="home-feed-section">
        {currentUser ? (
          <>
            <h2 className="home-feed-title">What's on your mind?</h2>
            <div className="home-composer-wrapper">
              <PostComposer />
            </div>
            <hr className="home-divider" />
            <h2 className="home-feed-title">Your Feed</h2>
            <div className="post-wall">
              {posts.length === 0 && (
                <p className="home-empty">No posts yet. Be the first!</p>
              )}
              {posts.map((post) => (
                <Post
                  key={post.id}
                  id={post.id}
                  userId={post.userId}
                  username={post.username}
                  displayName={post.displayName}
                  image={post.image}
                  description={post.description}
                  createdAt={post.createdAt}
                  commentCount={post.commentCount}
                  likeCount={post.likeCount}
                  likedByCurrentUser={post.likedByCurrentUser}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="home-signin-prompt">
            <h3>See what's happening</h3>
            <p>Log in or create an account to view the feed and join the conversation.</p>
            <div className="home-prompt-buttons">
              <button className="home-prompt-btn primary" onClick={() => navigate('/login')}>
                Log In
              </button>
              <button className="home-prompt-btn secondary" onClick={() => navigate('/register')}>
                Sign Up
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}