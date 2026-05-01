# ChatWave — Real-Time MERN Chat Application

A full-stack, real-time chat application built with MongoDB, Express.js, React.js, and Node.js. Features JWT authentication, Socket.io messaging, typing indicators, online status, emoji support, file sharing, message reactions, and a polished dark/light mode UI.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Tailwind CSS, Socket.io-client |
| Backend   | Node.js, Express.js, Socket.io      |
| Database  | MongoDB + Mongoose                  |
| Auth      | JWT (JSON Web Tokens) + bcryptjs    |
| Real-time | Socket.io (WebSocket)               |

---

## Features

- **Authentication** — JWT signup/login/logout with bcrypt password hashing
- **Real-time messaging** — Instant delivery via Socket.io WebSockets
- **Message status** — Sent → Delivered → Seen indicators
- **Typing indicators** — Live "typing..." with debouncing
- **Online/offline status** — Real-time presence tracking
- **Emoji picker** — Full emoji picker integration
- **File/image sharing** — Upload and share images and files
- **Message reactions** — React to messages with emoji
- **Dark/light mode** — System-aware with manual toggle, persisted
- **Responsive design** — Mobile-first, works on all screen sizes
- **Auto-scroll** — Always scrolls to latest message

---

## Project Structure

```
chatapp/
├── backend/
│   ├── config/
│   │   └── socket.js          # Socket.io event handlers
│   ├── controllers/
│   │   ├── authController.js  # Signup, login, profile
│   │   ├── userController.js  # User search, conversations
│   │   └── messageController.js # Messages, file upload
│   ├── middleware/
│   │   └── auth.js            # JWT protection middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Message.js         # Message schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── messages.js
│   ├── uploads/               # Uploaded files (auto-created)
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Chat/
    │   │   │   ├── ChatWindow.js      # Main chat area
    │   │   │   ├── Sidebar.js         # Users/conversations list
    │   │   │   ├── MessageBubble.js   # Individual message
    │   │   │   ├── MessageInput.js    # Compose area
    │   │   │   └── TypingIndicator.js
    │   │   └── UI/
    │   │       └── Avatar.js
    │   ├── context/
    │   │   ├── AuthContext.js    # Auth state + JWT
    │   │   ├── SocketContext.js  # Socket.io connection
    │   │   └── ChatContext.js    # Messages + conversations
    │   ├── hooks/
    │   │   ├── useTyping.js      # Debounced typing events
    │   │   └── useTheme.js       # Dark/light mode
    │   ├── pages/
    │   │   ├── ChatPage.js
    │   │   ├── LoginPage.js
    │   │   └── SignupPage.js
    │   ├── utils/
    │   │   └── api.js            # Axios with JWT interceptor
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── tailwind.config.js
    └── package.json
```

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB (local install or [MongoDB Atlas](https://cloud.mongodb.com) free tier)
- npm or yarn

---

### 1. Clone / Download

```bash
# If using git
git clone <repo-url>
cd chatapp
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
# OR for Atlas:
# MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/chatapp

JWT_SECRET=change_this_to_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
SERVER_URL=http://localhost:5000
```

Start the backend:

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📡 Socket.io ready
```

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

The frontend uses Create React App's proxy (set to `http://localhost:5000` in `package.json`), so no extra config needed for local dev.

Optional: create `frontend/.env` for custom settings:

```env
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_API_URL=/api
```

Start the frontend:

```bash
npm start
```

App opens at **http://localhost:3000**

---

### 4. Using the App

1. Open **http://localhost:3000**
2. Click **Create one** to sign up
3. Open another browser (or incognito) and sign up as a second user
4. In the sidebar, click **+** (New Chat) to see all users
5. Select a user to open a conversation
6. Start chatting in real-time!

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login user |
| GET  | /api/auth/me | Get current user |
| PUT  | /api/auth/profile | Update profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users |
| GET | /api/users/conversations | Get users with chat history |
| GET | /api/users/search?q=name | Search users |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/messages/:userId | Get conversation |
| DELETE | /api/messages/:messageId | Delete message |
| POST   | /api/messages/upload | Upload file/image |

### Socket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| message:send | Client → Server | Send a message |
| message:sent | Server → Client | Message confirmation |
| message:receive | Server → Client | Incoming message |
| message:status | Server → Client | Delivery status update |
| message:seen | Client ↔ Server | Mark messages as seen |
| message:react | Client → Server | Add reaction to message |
| message:reacted | Server → Client | Reaction update |
| typing:start | Client → Server | User started typing |
| typing:stop | Client → Server | User stopped typing |
| user:online | Server → All | User online/offline |
| users:online | Server → Client | List of online user IDs |

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Set environment variables on your hosting platform
2. Set `NODE_ENV=production`
3. Update `CLIENT_URL` to your frontend URL

### Frontend (Vercel / Netlify)

1. Set `REACT_APP_SERVER_URL=https://your-backend.com`
2. Set `REACT_APP_API_URL=https://your-backend.com/api`
3. Build: `npm run build`

### MongoDB Atlas (Production Database)

1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get connection string and set as `MONGODB_URI`
3. Whitelist your server IP in Network Access

---

## Extending the App

### Group Chat
- Add a `Group` model with `members: [ObjectId]`
- Modify socket events to use `socket.join(roomId)`
- Broadcast to rooms with `io.to(roomId).emit(...)`

### Push Notifications
- Integrate Web Push API or Firebase Cloud Messaging
- Store push subscription in User model
- Send notifications from socket disconnect events

### WebRTC Video Calls
- Use `simple-peer` library on frontend
- Signal peers through Socket.io
- Exchange ICE candidates and SDP via socket events

### Message Search
- Add full-text index to Message model: `content: 'text'`
- Query with `Message.find({ $text: { $search: query } })`
