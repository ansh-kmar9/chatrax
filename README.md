# ChatraX - Real-time Chat Application

A modern MERN stack chat application with real-time messaging, friend requests, and admin panel.

## Features

- 🔐 **Secure Authentication** - Register with full name, unique codename, mobile number, and location
- 💬 **Real-time Chat** - Instant messaging with Socket.io
- 👥 **Friend System** - Send/receive friend requests, chat only with accepted friends
- 🌓 **Theme Toggle** - Beautiful white & lavender theme with dark/light mode
- 📱 **Fully Responsive** - Works seamlessly on all devices
- 📍 **Location Tracking** - Captures user location during registration
- 👨‍💼 **Admin Panel** - View all chats and manage users
- ✅ **Real-time Codename Check** - Instant validation of codename uniqueness
- 🟢 **Online Status** - See when friends are online
- ⌨️ **Typing Indicators** - Know when someone is typing

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Socket.io-client
- Axios
- React Router
- Lucide Icons

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- bcryptjs

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (connection string provided)
- npm

### Backend Setup

1. Navigate to server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Environment variables are already configured in `.env` file

4. Start the server:

```bash
npm run dev
```

Server will run on http://localhost:5000

### Frontend Setup

1. Open a new terminal and navigate to client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Frontend will run on http://localhost:3000

## Usage

### User Flow

1. **Landing Page** - Visit http://localhost:3000
2. **Register** - Click "Get Started" and fill in:
   - Full Name
   - Unique Codename (will be checked in real-time)
   - Mobile Number
   - Password
   - Allow Location Access (required)
3. **Login** - Use your codename and password
4. **Find Friends** - Search users by codename in the "Search" tab
5. **Send Friend Request** - Click "Add" to send a request
6. **Accept Requests** - Check "Requests" tab to accept/reject
7. **Chat** - Select a friend from "Friends" tab to start chatting

### Admin Access

To create an admin user, manually update a user in MongoDB:

```javascript
db.users.updateOne({ codeName: "your_codename" }, { $set: { isAdmin: true } });
```

Then access admin panel at http://localhost:3000/admin

Admin features:

- View all users
- See user statistics
- View all messages
- Delete users

## Project Structure

```
ChatraX/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── server/                # Express backend
    ├── models/            # Mongoose models
    ├── routes/            # API routes
    ├── middleware/        # Auth middleware
    ├── socket/            # Socket.io handlers
    ├── server.js          # Entry point
    ├── package.json
    └── .env               # Environment variables
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/check-codename` - Check codename availability

### Users

- `GET /api/users/me` - Get current user
- `GET /api/users/search` - Search users by codename
- `GET /api/users/friends` - Get user's friends

### Friends

- `POST /api/friends/request` - Send friend request
- `GET /api/friends/requests` - Get pending requests
- `PUT /api/friends/request/:id` - Accept/reject request

### Chat

- `GET /api/chats/:friendId` - Get messages with a friend
- `POST /api/chats` - Send a message
- `GET /api/chats/unread/count` - Get unread message count

### Admin

- `GET /api/admin/users` - Get all users
- `GET /api/admin/messages` - Get all messages
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/stats` - Get statistics

## Socket Events

### Client to Server

- `authenticate` - Authenticate socket connection
- `typing` - Send typing indicator

### Server to Client

- `user-status` - User online/offline status
- `friend-request` - New friend request received
- `friend-request-response` - Friend request accepted/rejected
- `new-message` - New message received
- `user-typing` - Friend is typing
- `account-deleted` - User account deleted by admin

## Color Scheme

### Light Mode

- Primary: White
- Accent: Lavender (#a855f7)
- Text: Gray-900

### Dark Mode

- Primary: Gray-900
- Accent: Lavender (#a855f7)
- Text: White

## Security Features

- Password hashing with bcryptjs
- JWT token authentication (7-day expiration)
- HTTP-only cookies
- Protected routes with middleware
- Admin-only routes
- Friendship verification for chats

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- Session expires after 7 days
- Location access is required for registration
- Users can only chat with accepted friends
- Codenames are case-insensitive and must be unique
- Real-time features require active Socket.io connection

## License

MIT
