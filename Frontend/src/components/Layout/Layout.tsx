import { type ReactNode } from 'react'
import Header from '../Header/Header'
import FriendsSidebar from '../FriendsSidebar/FriendsSidebar'
import { useUser } from '../../context/UserContext'

interface LayoutProps {
  children: ReactNode
}

/**
 * Layout component that wraps all pages with common UI elements.
 * Includes the header and friends sidebar (when user is logged in).
 */
export default function Layout({ children }: LayoutProps) {
  const { currentUser } = useUser()

  return (
    <>
      <Header />
      {children}
      {currentUser && <FriendsSidebar />}
    </>
  )
}