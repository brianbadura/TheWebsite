import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider, useUser } from './context/UserContext'
import { FriendsProvider } from './context/FriendsContext'
import { PostProvider } from './context/PostContext'
import { MessagesProvider } from './context/MessagesContext'
import { LikesProvider } from './context/LikesContext'
import { lazy, Suspense, type ReactNode } from 'react'
import Layout from './components/Layout/Layout'
import './App.css'

const HomePage = lazy(() => import('./features/home/HomePage'))
const AccountPage = lazy(() => import('./features/account/AccountPage'))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'))
const LoginPage = lazy(() => import('./features/login/LoginPage'))
const RegisterPage = lazy(() => import('./features/register/RegisterPage'))
const MessagesPage = lazy(() => import('./features/messages/MessagesPage'))

function AppInner(): ReactNode {
  const { currentUser, loading } = useUser()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/account"
              element={currentUser ? <AccountPage /> : <LoginPage />}
            />
            <Route
              path="/profile/:username"
              element={currentUser ? <ProfilePage /> : <LoginPage />}
            />
            <Route
              path="/messages"
              element={currentUser ? <MessagesPage /> : <LoginPage />}
            />
          </Routes>
        </Layout>
      </Suspense>
    </BrowserRouter>
  )
}

function App(): ReactNode {
  return (
    <ThemeProvider>
      <UserProvider>
        <FriendsProvider>
          <PostProvider>
            <MessagesProvider>
              <LikesProvider>
                <AppInner />
              </LikesProvider>
            </MessagesProvider>
          </PostProvider>
        </FriendsProvider>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App