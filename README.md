# CodeConnect ⚡

A modern, collaborative platform for developers to share code, learn together, and build amazing projects. CodeConnect combines social networking with powerful coding tools to create the ultimate developer community experience.

![CodeConnect Banner](https://img.shields.io/badge/CodeConnect-Collaborative%20Coding%20Platform-blue?style=for-the-badge&logo=code)

## ✨ Features

### 🚀 Core Features
- **Social Coding Platform** - Share code snippets, projects, and learn from other developers
- **Real-time Chat** - Connect with fellow developers through instant messaging
- **Video Meetings** - Host and join coding sessions with LiveKit integration
- **Code Playground** - Interactive code editor with Sandpack for live coding
- **Multi-language Support** - Full internationalization (English & Arabic) with RTL support
- **Dark/Light Themes** - Beautiful UI with theme switching capabilities

### 💻 Development Tools
- **Interactive Code Editor** - Write, test, and share code in real-time
- **Syntax Highlighting** - Support for multiple programming languages
- **Code Sharing** - Save and share your coding sparks with the community
- **Rating System** - Rate and discover quality code snippets
- **File Management** - Create and manage multiple files in your projects

### 👥 Social Features
- **User Profiles** - Customizable profiles with avatar support
- **Follow System** - Follow other developers and stay updated
- **Reactions** - React to posts with emojis (like, love, funny, etc.)
- **Comments & Replies** - Engage in meaningful discussions
- **Search & Discovery** - Find posts, users, and tags easily
- **Blocking System** - Manage your community experience

### 📱 Modern UI/UX
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Infinite Scroll** - Smooth browsing experience
- **Real-time Notifications** - Stay updated with instant notifications
- **Accessibility** - Built with accessibility in mind
- **Modern Components** - Beautiful UI components using Radix UI

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **Next-intl** - Internationalization

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations
- **Sonner** - Toast notifications

### Code Editing & Collaboration
- **Sandpack** - Interactive code playground
- **Shiki** - Syntax highlighting
- **LiveKit** - Real-time video meetings
- **Socket.io** - Real-time chat functionality

### Authentication & Storage
- **Clerk** - Authentication and user management
- **ImageKit** - Image upload and management
- **JWT** - Token-based authentication

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vite** - Fast development server

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/codeconnect.git
   cd codeconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:5000
   
   # LiveKit (Video Meetings)
   NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   
   # ImageKit (Image Upload)
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   
   # Socket.io (Real-time Chat)
   NEXT_PUBLIC_SOCKET_URL=your_socket_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
CodeConnect/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalization routes
│   │   │   ├── (auth)/        # Authentication pages
│   │   │   ├── (mainlayout)/  # Main application layout
│   │   │   │   ├── (timeline)/ # Social feed
│   │   │   │   ├── playground/ # Code playground
│   │   │   │   ├── chat/      # Real-time chat
│   │   │   │   ├── meeting/   # Video meetings
│   │   │   │   └── profile/   # User profiles
│   │   │   └── api/           # API routes
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── post/             # Post-related components
│   │   ├── chat/             # Chat components
│   │   └── layout/           # Layout components
│   ├── store/                # Redux store and slices
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   ├── types/                # TypeScript type definitions
│   └── messages/             # Internationalization files
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

## 🌟 Key Features in Detail

### Code Playground
- Interactive code editor powered by Sandpack
- Support for multiple file types (JS, TS, CSS)
- Real-time preview
- Save and share code snippets
- Rating system for community feedback

### Real-time Chat
- Instant messaging between users
- Socket.io integration for real-time communication
- Message history and notifications
- User status indicators

### Video Meetings
- LiveKit-powered video conferencing
- Create and join meeting rooms
- Screen sharing capabilities
- Room management and permissions

### Social Feed
- Infinite scroll timeline
- Post reactions and comments
- User following system
- Search and filtering capabilities

## 🎨 Customization

### Themes
The application supports both light and dark themes with automatic system detection. Users can manually switch between themes using the theme toggle.

### Internationalization
Currently supports:
- English (en)
- Arabic (ar) with RTL support

To add more languages, create new message files in `src/messages/` and update the locale configuration.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint for code linting
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation when needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Sandpack](https://sandpack.codesandbox.io/) - Code playground
- [LiveKit](https://livekit.io/) - Real-time video
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

<div align="center">
  <p>Made with ❤️ by the CodeConnect Team</p>
  <p>Join our community and start coding together! ⚡</p>
</div>
