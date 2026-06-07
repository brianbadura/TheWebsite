# TheWebsite

A full-stack social-media-style web application with a **React (Vite) frontend**, a **Flask REST API backend** (SQLAlchemy ORM), a **PostgreSQL database**, and an **nginx reverse proxy** — all orchestrated with Docker Compose.

---

## Features

- **Authentication** — JWT-based registration and login (username/email + password)
- **User Profiles** — Display name, bio, avatar, join date; editable via account settings
- **Posts** — Create, edit, and delete posts with optional image URLs
- **Comments** — Threaded comments with replies on posts
- **Likes** — Like/unlike posts and comments with real-time counts
- **Friends** — Send, accept, or reject friend requests; bidirectional friend relationships
- **Direct Messaging** — One-on-one conversations with real-time polling for new messages
- **Notifications** — Friend request notifications and unread message badges with live polling
- **User Search** — Debounced search by username or display name
- **Responsive Design** — Mobile-friendly layout with hamburger menu and adaptive UI

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes `docker` and `docker compose`)

---

## Quick Start

### 1. Build the images

```bash
docker compose -f Infrastructure/docker/docker-compose.yml build
```

### 2. Launch the containers

```bash
docker compose -f Infrastructure/docker/docker-compose.yml up -d
```

### 3. Access the application

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:80](http://localhost:80) |
| Backend API | [http://localhost:5000](http://localhost:5000) |
| pgAdmin | [http://localhost:5050](http://localhost:5050) |

On first launch, SQLAlchemy automatically creates all database tables. Visit the frontend to register a new account.

### 4. Verify everything is running

```bash
docker compose -f Infrastructure/docker/docker-compose.yml ps
```

You should see `thewebsite_postgres-1`, `thewebsite_backend-1`, `thewebsite_frontend-1`, `thewebsite_nginx-1`, and `thewebsite_pgadmin-1` all with a status of `Up`.

---

## Architecture

```
Browser ──► nginx (port 80) ─┬── /api/* ──► backend:5000 ──► postgres:5432
                             └── static files (React app)
```

- **nginx** — Reverse proxy that routes `/api/*` requests to the backend and serves the React frontend for all other routes.
- **Backend** — Flask API with gunicorn, SQLAlchemy ORM, and JWT authentication.
- **Frontend** — React SPA built with Vite, served by nginx.
- **PostgreSQL 16** — Primary database with a named Docker volume (`pgdata`) for persistence.
- **pgAdmin** — Optional web-based database management UI (port 5050).

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | No | Register a new account `{ "username", "displayName", "email", "bio", "password" }` |
| POST | `/api/login` | No | Login with username/email + password `{ "username", "password" }` |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | No | List all users (keyed by username) |
| GET | `/api/users/search?q=` | No | Search users by username or display name |
| GET | `/api/users/:username` | No | Get a single user profile |
| PUT | `/api/users/:username` | Yes | Update profile fields (displayName, email, bio, avatar) |
| POST | `/api/users/:username/change-password` | Yes | Change password `{ "currentPassword", "newPassword" }` |

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | No | List all posts (newest first, includes like counts) |
| POST | `/api/posts` | Yes | Create a post `{ "description", "image" }` |
| PUT | `/api/posts/:id` | Yes | Update a post (author only) |
| DELETE | `/api/posts/:id` | Yes | Delete a post (author only) |

### Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/:id/comments` | No | List top-level comments for a post (with replies) |
| POST | `/api/posts/:id/comments` | Yes | Add a comment `{ "content" }` |
| POST | `/api/comments/:id/replies` | Yes | Reply to a comment `{ "content" }` |
| PUT | `/api/comments/:id` | Yes | Update a comment (author only) |
| DELETE | `/api/comments/:id` | Yes | Delete a comment (author only) |

### Likes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/posts/:id/like` | Yes | Like a post |
| DELETE | `/api/posts/:id/like` | Yes | Unlike a post |
| POST | `/api/comments/:id/like` | Yes | Like a comment |
| DELETE | `/api/comments/:id/like` | Yes | Unlike a comment |

### Friends

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/friends` | Yes | List current user's friends |
| POST | `/api/friends/:username` | Yes | Add a friend (creates bidirectional relationship) |
| DELETE | `/api/friends/:username` | Yes | Remove a friend |

### Friend Requests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/friend-requests` | Yes | Send a friend request `{ "receiver" }` |
| GET | `/api/friend-requests/incoming` | Yes | List incoming pending requests |
| GET | `/api/friend-requests/outgoing` | Yes | List outgoing pending requests |
| POST | `/api/friend-requests/:id/accept` | Yes | Accept a friend request |
| POST | `/api/friend-requests/:id/reject` | Yes | Reject a friend request |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/conversations` | Yes | Create or get a conversation `{ "user2" }` |
| GET | `/api/conversations` | Yes | List all conversations (with last message + unread count) |
| GET | `/api/conversations/:id` | Yes | Get a single conversation |
| GET | `/api/conversations/:id/messages` | Yes | List all messages in a conversation |
| POST | `/api/conversations/:id/messages` | Yes | Send a message `{ "body" }` |
| POST | `/api/conversations/:id/read` | Yes | Mark conversation as read |
| GET | `/api/messages/unread` | Yes | Get unread message count and previews |

> **Auth**: Endpoints marked "Yes" require a valid JWT in the `Authorization: Bearer <token>` header.

---

## Database Models

| Model | Description |
|-------|-------------|
| **User** | User accounts with username, display name, email, bio, avatar, hashed password |
| **Post** | Posts with description, optional image URL, and timestamps |
| **Comment** | Threaded comments on posts (supports nested replies via `parent_id`) |
| **Like** | Polymorphic likes on posts or comments |
| **Friend** | Bidirectional friend relationships |
| **FriendRequest** | Pending/accepted/rejected friend requests between users |
| **Conversation** | Direct message conversations between two users |
| **Message** | Individual messages within a conversation |

---

## Project Structure

```
TheWebsite/
├── Backend/
│   ├── Dockerfile              # Python/Flask image definition
│   ├── app.py                  # Flask application factory
│   ├── auth_utils.py           # JWT helpers and @require_auth decorator
│   ├── requirements.txt        # Python dependencies
│   ├── models/                 # SQLAlchemy model classes
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── like.py
│   │   ├── friend.py
│   │   ├── friend_request.py
│   │   ├── conversation.py
│   │   └── message.py
│   └── routes/                 # API route blueprints
│       ├── auth.py             # Register + login
│       ├── users.py            # User CRUD + search
│       ├── posts.py            # Post CRUD
│       ├── comments.py         # Comment CRUD + replies
│       ├── likes.py            # Like/unlike posts and comments
│       ├── friends.py          # Friend list management
│       ├── friend_requests.py  # Friend request workflow
│       └── messages.py         # Conversations + messaging
├── Frontend/
│   ├── Dockerfile              # Multi-stage build (Vite → nginx)
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   └── src/
│       ├── features/           # Page-level components
│       │   ├── home/           # Home/feed page
│       │   ├── login/          # Login page
│       │   ├── register/       # Registration page
│       │   ├── profile/        # User profile page
│       │   ├── account/        # Account settings page
│       │   └── messages/       # Direct messaging page
│       ├── context/            # React context providers
│       │   ├── UserContext.jsx
│       │   ├── PostContext.jsx
│       │   ├── MessagesContext.jsx
│       │   ├── FriendsContext.jsx
│       │   ├── LikesContext.jsx
│       │   └── ThemeContext.jsx
│       └── components/         # Reusable UI components
│           ├── Header/         # App header with nav + search
│           ├── Post/           # Post card component
│           ├── PostComposer/   # New post form
│           ├── Comment/        # Comment display
│           ├── CommentSection/ # Comments thread on posts
│           ├── LikeButton/     # Like/unlike toggle
│           ├── MessageBell/    # Unread messages dropdown
│           ├── NotificationBell/ # Friend request dropdown
│           ├── FriendsSidebar/ # Friends list sidebar
│           ├── Avatar/         # User avatar component
│           ├── ConfirmDialog/  # Confirmation modal
│           └── Toggle/         # Toggle switch component
├── Infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml  # Service orchestration
│   └── nginx/
│       └── nginx.conf          # nginx reverse proxy config
└── README.md
```

---

## Useful Commands

| Action | Command |
|--------|---------|
| Build images | `docker compose -f Infrastructure/docker/docker-compose.yml build` |
| Start containers (detached) | `docker compose -f Infrastructure/docker/docker-compose.yml up -d` |
| Stop containers | `docker compose -f Infrastructure/docker/docker-compose.yml down` |
| Stop containers + delete volumes | `docker compose -f Infrastructure/docker/docker-compose.yml down -v` |
| View logs (all services) | `docker compose -f Infrastructure/docker/docker-compose.yml logs -f` |
| View logs (backend only) | `docker compose -f Infrastructure/docker/docker-compose.yml logs -f backend` |
| Open a shell in the database | `docker compose -f Infrastructure/docker/docker-compose.yml exec postgres psql -U admin thewebsite` |
| Reset database (lose all data) | `docker compose -f Infrastructure/docker/docker-compose.yml down -v && docker compose -f Infrastructure/docker/docker-compose.yml up -d` |

---

## Configuration

All sensitive values (database credentials, JWT secret, pgAdmin login) are stored in `Infrastructure/docker/.env`. See that file for the available variables and their current development defaults. **Do not commit or share this file.**
