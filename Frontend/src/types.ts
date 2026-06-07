// ---- User & Auth ----

export interface User {
  id: number
  username: string
  displayName: string
  email: string
  bio: string
  joinedAt: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterData {
  username: string
  displayName: string
  email: string
  bio: string
  password: string
}

// ---- Posts ----

export interface Post {
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

// ---- Comments ----

export interface Comment {
  id: number
  userId: number
  username: string
  displayName: string
  content: string
  createdAt: string
  likeCount: number
  likedByCurrentUser: boolean
  replies: Comment[]
}

// ---- Messages ----

export interface OtherUser {
  username: string
  displayName: string
}

export interface Conversation {
  id: number
  otherUser: OtherUser
  lastMessage: { body: string; createdAt?: string } | null
  lastMessageAt: string | null
  unreadCount: number
  conversationId?: number
}

export interface Message {
  id: number
  senderId: number
  body: string
  createdAt: string
}

// ---- Friend Requests ----

export interface FriendRequestSender {
  username: string
  displayName: string
}

export interface FriendRequest {
  id: number
  sender: FriendRequestSender
  receiver: FriendRequestSender
}

// ---- Context Types ----

export interface UserContextType {
  currentUser: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<User>
  logout: () => void
  saveProfile: (updates: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

export interface LikesContextType {
  getState: (type: 'post' | 'comment', id: number) => { likeCount: number; likedByCurrentUser: boolean; pending: boolean }
  initTarget: (type: 'post' | 'comment', id: number, likeCount: number, likedByCurrentUser: boolean) => void
  toggleLike: (type: 'post' | 'comment', id: number) => Promise<void>
}

export interface FriendsContextType {
  friends: string[]
  loading: boolean
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
  sendFriendRequest: (username: string) => Promise<void>
  acceptFriendRequest: (requestId: number) => Promise<void>
  rejectFriendRequest: (requestId: number) => Promise<void>
  removeFriend: (username: string) => Promise<void>
  isFriend: (username: string) => boolean
  hasPendingRequest: (username: string) => boolean
  hasIncomingRequestFrom: (username: string) => boolean
  getIncomingRequestFrom: (username: string) => FriendRequest | undefined
}

export interface PostContextType {
  posts: Post[]
  loading: boolean
  createPost: (description: string, image: string | null) => void
  updatePost: (id: number, description: string, image: string | null) => void
  deletePost: (id: number) => void
}

export interface MessagesContextType {
  conversations: Conversation[]
  unreadCount: number
  unreadConversations: Conversation[]
  fetchConversations: () => Promise<void>
  fetchOrCreateConversation: (otherUsername: string) => Promise<Conversation | null>
  fetchMessages: (conversationId: number) => Promise<Message[]>
  sendMessage: (conversationId: number, body: string) => Promise<Message | null>
  markAsRead: (conversationId: number) => Promise<void>
  fetchUnread: () => Promise<void>
}

export interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

// ---- Like State (internal to LikesContext) ----

export interface LikeStateEntry {
  likeCount: number
  likedByCurrentUser: boolean
  pending: boolean
}