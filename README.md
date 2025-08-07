# 🚀 CodeConnect - Where Developers Connect & Code Together

<div align="center">

![CodeConnect](https://img.shields.io/badge/CodeConnect-Collaborative%20Coding%20Platform-00d4ff?style=for-the-badge&logo=code&logoColor=white)

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38b2ac?style=for-the-badge&logo=tailwind-css)

*A modern, collaborative platform where developers share code, learn together, and build amazing projects in real-time* ⚡

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Now-green?style=for-the-badge)](https://code-connect-vert.vercel.app/)

</div>

---

## 🌟 What is CodeConnect?

CodeConnect is the ultimate social coding platform that combines the power of collaborative development with modern social networking. Think of it as **GitHub meets Discord meets VS Code** - all in one beautiful, real-time experience.

### ✨ Why CodeConnect?

- 🎯 **Learn Together** - Share code snippets, get feedback, and learn from the community
- 🤝 **Collaborate in Real-time** - Live coding sessions, pair programming, and instant messaging
- 🚀 **Build Faster** - Interactive code playground with instant preview and sharing
- 🌍 **Global Community** - Connect with developers worldwide in multiple languages
- 🎨 **Beautiful Experience** - Modern UI with dark/light themes and smooth animations

---

## 🎮 Core Features

### 💻 **Interactive Code Playground**
- **Sandpack Integration** - Write, test, and share code in real-time
- **Multi-file Support** - Create complex projects with multiple files
- **Live Preview** - See your code changes instantly
- **Syntax Highlighting** - Support for 50+ programming languages
- **Code Sharing** - Save and share your coding sparks with the community

### 🎥 **Real-time Video Meetings**
- **LiveKit Powered** - High-quality video conferencing
- **Screen Sharing** - Share your screen for pair programming
- **Room Management** - Create private or public coding sessions
- **Recording** - Record your coding sessions for later review

### 💬 **Smart Chat System**
- **Real-time Messaging** - Instant communication with Socket.io
- **Code Snippets** - Share code directly in chat
- **File Sharing** - Upload and share files seamlessly
- **User Status** - See who's online and available

### 👥 **Social Coding Network**
- **Developer Profiles** - Showcase your skills and projects
- **Follow System** - Follow other developers and stay updated
- **Reactions & Comments** - Engage with emoji reactions and discussions
- **Search & Discovery** - Find posts, users, and trending topics

### 🌐 **Global Accessibility**
- **Multi-language Support** - English & Arabic with RTL support
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Accessibility First** - Built with accessibility in mind
- **Dark/Light Themes** - Beautiful themes with system detection

---

## 🛠️ Technology Stack

### **Frontend Framework**
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript)

### **Styling & UI**
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38b2ac?style=flat&logo=tailwind-css)
![Radix UI](https://img.shields.io/badge/Radix%20UI-Primitives-161618?style=flat)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055ff?style=flat&logo=framer)

### **Code Editing & Collaboration**
![Monaco](https://img.shields.io/badge/Monaco-Editor-494949?style=flat&logo=monaco)
![Sandpack](https://img.shields.io/badge/Sandpack-Playground-000000?style=flat&logo=codesandbox)
![Shiki](https://img.shields.io/badge/Shiki-Syntax%20Highlighting-854DFF?style=flat)
![LiveKit](https://img.shields.io/badge/LiveKit-Video%20Meetings-000000?style=flat)

### **State Management & Data**
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.8-764abc?style=flat&logo=redux)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=flat&logo=socket.io)
![Axios](https://img.shields.io/badge/Axios-HTTP%20Client-5A29E4?style=flat&logo=axios)

### **Authentication & Storage**
![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=flat)
![ImageKit](https://img.shields.io/badge/ImageKit-Media%20CDN-4F46E5?style=flat)
![JWT](https://img.shields.io/badge/JWT-Tokens-000000?style=flat&logo=json-web-tokens)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mvicsa/codeconnect.git
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
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:5000
   
   # Media Storage (ImageKit)
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   
   # Real-time Chat (Socket.io)
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
CodeConnect/
├── 📱 src/app/                    # Next.js App Router
│   ├── 🌐 [locale]/              # Internationalization
│   │   ├── 🔐 (auth)/            # Authentication pages
│   │   ├── 🏠 (mainlayout)/      # Main app layout
│   │   │   ├── 📰 (timeline)/    # Social feed & posts
│   │   │   ├── 🎮 playground/    # Code playground
│   │   │   ├── 💬 chat/          # Real-time chat
│   │   │   ├── 🎥 meeting/       # Video meetings
│   │   │   ├── 👤 profile/       # User profiles
│   │   │   └── 🔍 search/        # Search functionality
│   │   └── 🔌 api/               # API routes
│   ├── 🧩 components/            # Reusable components
│   │   ├── 🎨 ui/               # Base UI components
│   │   ├── 📝 post/             # Post components
│   │   ├── 💬 chat/             # Chat components
│   │   ├── 🎮 code/             # Code editor components
│   │   └── 🏗️ layout/           # Layout components
│   ├── 🗂️ store/                # Redux store & slices
│   ├── 🎣 hooks/                # Custom React hooks
│   ├── 🛠️ lib/                  # Utility functions
│   ├── 📝 types/                # TypeScript definitions
│   └── 🌍 messages/             # i18n files
├── 📦 public/                   # Static assets
└── 📄 package.json             # Dependencies & scripts
```

---

## 🎯 Key Features Deep Dive

### 🎮 **Interactive Code Playground**
```typescript
// Example: Creating a code snippet
const codeSnippet = {
  title: "React Hooks Example",
  language: "typescript",
  code: `
    import { useState, useEffect } from 'react';
    
    function Counter() {
      const [count, setCount] = useState(0);
      
      useEffect(() => {
        document.title = \`Count: \${count}\`;
      }, [count]);
      
      return (
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      );
    }
  `,
  tags: ["react", "hooks", "typescript"]
};
```

**Features:**
- ✅ **Real-time Preview** - See changes instantly
- ✅ **Multi-file Support** - Create complex projects
- ✅ **Syntax Highlighting** - 50+ languages supported
- ✅ **Code Sharing** - Share with one click
- ✅ **Rating System** - Community feedback
- ✅ **Version History** - Track code evolution

### 🎥 **Video Meetings & Collaboration**
- **High-quality Video** - Powered by LiveKit
- **Screen Sharing** - Perfect for pair programming
- **Room Permissions** - Public or private sessions
- **Recording** - Save sessions for later
- **Chat Integration** - Text chat during calls

### 💬 **Smart Chat System**
- **Real-time Messaging** - Instant communication
- **Code Snippets** - Share code in chat
- **File Attachments** - Upload and share files
- **User Status** - Online/offline indicators
- **Message History** - Persistent conversations

### 👥 **Social Features**
- **Developer Profiles** - Showcase your skills
- **Follow System** - Connect with developers
- **Reactions** - React with emojis
- **Comments & Replies** - Engage in discussions
- **Search & Discovery** - Find content easily

---

## 🎨 Customization & Theming

### Theme System
```typescript
// Automatic theme detection
const theme = useTheme(); // 'light' | 'dark' | 'system'

// Manual theme switching
const { setTheme } = useTheme();
setTheme('dark'); // Switch to dark mode
```

### Internationalization
Currently supports:
- 🇺🇸 **English** (en)
- 🇸🇦 **Arabic** (ar) with RTL support

To add more languages:
1. Create new message files in `src/messages/`
2. Update locale configuration
3. Add language switcher component

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
Make sure to set all required environment variables in your deployment platform.

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### 🐛 **Bug Reports**
- Use the [GitHub Issues](https://github.com/mvicsa/codeconnect/issues) page
- Include detailed steps to reproduce
- Add screenshots if applicable

### 💡 **Feature Requests**
- Open a [Feature Request](https://github.com/mvicsa/codeconnect/issues/new?template=feature_request.md)
- Describe the use case and benefits
- Include mockups if possible

### 🔧 **Code Contributions**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📋 **Development Guidelines**
- ✅ Follow TypeScript best practices
- ✅ Use ESLint for code linting
- ✅ Write meaningful commit messages
- ✅ Test your changes thoroughly
- ✅ Update documentation when needed
- ✅ Follow the existing code style

---

## 📊 Project Status

![GitHub stars](https://img.shields.io/github/stars/mvicsa/codeconnect?style=social)
![GitHub forks](https://img.shields.io/github/forks/mvicsa/codeconnect?style=social)
![GitHub issues](https://img.shields.io/github/issues/mvicsa/codeconnect)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mvicsa/codeconnect)
![GitHub license](https://img.shields.io/github/license/mvicsa/codeconnect)

**Current Version:** `0.1.0`  
**Last Updated:** `August 2025`  
**Status:** `Active Development` 🚀

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

<div align="center">

**Special thanks to these amazing projects that make CodeConnect possible:**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://reactjs.org/)
[![Sandpack](https://img.shields.io/badge/Sandpack-Playground-000000?style=flat&logo=codesandbox)](https://sandpack.codesandbox.io/)
[![LiveKit](https://img.shields.io/badge/LiveKit-Video-000000?style=flat)](https://livekit.io/)
[![Radix UI](https://img.shields.io/badge/Radix%20UI-Primitives-161618?style=flat)](https://www.radix-ui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38b2ac?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

<div align="center">

## 🌟 **Join the CodeConnect Community!**

**Connect, Code, and Create together** ⚡

[![GitHub](https://img.shields.io/badge/GitHub-Star%20Us-181717?style=for-the-badge&logo=github)](https://github.com/mvicsa/codeconnect)

**Made with ❤️ by the CodeConnect Team**

*Where developers connect, collaborate, and code together* 🚀

</div>
