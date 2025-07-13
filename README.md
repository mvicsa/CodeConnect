# CodeConnect - Real-Time Chat System

A modern, feature-rich real-time chat application built with Next.js, TypeScript, and Tailwind CSS. Supports both private and group chats with real-time features like typing indicators, read receipts, and message actions.

## 🚀 Features

### Real-Time Chat
- **Private Chats**: One-on-one conversations with friends
- **Group Chats**: Multi-participant conversations with member management
- **Real-Time Messaging**: Instant message delivery and synchronization
- **Typing Indicators**: See when others are typing in real-time
- **Read Receipts**: Know when your messages have been read
- **Message Actions**: Reply, copy, and delete messages

### User Experience
- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Internationalization**: Full Arabic and English language support
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Search Functionality**: Find chats and messages quickly
- **Emoji Support**: Rich emoji picker integration
- **Message Status**: Visual indicators for sent, delivered, and read messages

### Advanced Features
- **Message Replies**: Reply to specific messages in conversations
- **Copy Messages**: Easy message copying to clipboard
- **Delete Messages**: Remove your own messages
- **Group Management**: View group members and details
- **Online Status**: Real-time user status indicators
- **Unread Counts**: Track unread messages per chat

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks with custom state management
- **Internationalization**: next-intl
- **Emoji**: emoji-button library
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/
│   └── [locale]/
│       └── chat/
│           └── page.tsx          # Chat page
├── components/
│   ├── ChatInterface.tsx         # Main chat interface
│   ├── ChatSidebar.tsx          # Chat list sidebar
│   ├── ChatWindow.tsx           # Chat window component
│   ├── MessageActions.tsx       # Message action buttons
│   └── notification.tsx         # Notification system
├── hooks/
│   └── useChat.ts              # Chat logic and state management
├── types/
│   └── chat.ts                 # TypeScript interfaces
├── messages/
│   ├── en.json                 # English translations
│   └── ar.json                 # Arabic translations
└── lib/
    └── utils.ts                # Utility functions
```

## 🎯 Key Components

### ChatInterface
The main container component that orchestrates the chat experience, handling mobile responsiveness and chat selection.

### ChatSidebar
Displays the list of chats (both private and group) with search functionality, unread counts, and user status indicators.

### ChatWindow
The main chat area showing messages, typing indicators, and message input with emoji support.

### useChat Hook
Manages all chat-related state including:
- Chat previews and active chat
- Message sending and receiving
- Typing indicators
- Search functionality
- Real-time updates

## 🔧 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## 🌐 Internationalization

The app supports both English and Arabic languages with automatic locale detection:

- **English**: `/en/chat`
- **Arabic**: `/ar/chat`

## 🎨 Theming

The application supports both dark and light themes with automatic system preference detection. Theme switching is available through the theme toggle component.

## 📱 Responsive Design

The chat interface is fully responsive:
- **Desktop**: Side-by-side chat list and window
- **Mobile**: Stacked layout with navigation between chat list and active chat

## 🔮 Future Enhancements

- **WebSocket Integration**: Real-time backend connectivity
- **File Sharing**: Image and document sharing
- **Voice Messages**: Audio message support
- **Video Calls**: Integrated video calling
- **Message Encryption**: End-to-end encryption
- **Push Notifications**: Browser notifications
- **Message Reactions**: Emoji reactions to messages
- **Message Threading**: Nested conversation threads

## 🚀 Backend Integration

The frontend is designed to easily integrate with backend services:

### API Endpoints (to be implemented)
- `GET /api/chats` - Fetch chat list
- `GET /api/chats/:id/messages` - Fetch chat messages
- `POST /api/chats/:id/messages` - Send message
- `POST /api/chats/:id/typing` - Update typing status
- `PUT /api/messages/:id/read` - Mark message as read
- `POST /api/groups` - Create group chat
- `PUT /api/groups/:id/members` - Manage group members

### WebSocket Events (to be implemented)
- `message:send` - Send new message
- `message:receive` - Receive new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `status:update` - User status change
- `read:update` - Message read status

## 📄 License

This project is part of a graduation project and is licensed under the MIT License.

## 👥 Contributing

This is a graduation project showcasing modern web development practices with a focus on real-time communication features.
