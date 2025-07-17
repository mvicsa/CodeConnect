# CodeConnect

![CodeConnect Logo](public/logo-dark.svg)

A modern social platform for developers to connect, share code, and collaborate. Built with Next.js, TypeScript, Redux, and Tailwind CSS.

## 🚀 Features

### Social Platform
- **Posts Feed**: Share updates, code snippets, images, and videos
- **Comments & Replies**: Engage with other developers through comments
- **Reactions**: Express yourself with a variety of reaction emojis
- **User Profiles**: Showcase your work and connect with others

### Code Sharing
- **Syntax Highlighting**: Beautiful code highlighting with Shiki
- **Multiple Languages**: Support for all major programming languages
- **Code Editor**: Built-in code editor for creating and editing code snippets
- **Copy Code**: Easily copy code to clipboard

### Media Sharing
- **Image Upload**: Share images in your posts
- **Video Support**: Embed and play videos
- **Responsive Media**: Optimized for all device sizes

### Chat System
- **Real-Time Chat**: Connect with other developers instantly
- **Private Messaging**: One-on-one conversations
- **Chat Interface**: Modern, intuitive chat experience

### User Experience
- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Internationalization**: Full Arabic and English language support with next-intl
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **RTL Support**: Full right-to-left language support
- **Accessibility**: Designed with accessibility in mind

### Authentication
- **Social Login**: Sign in with GitHub
- **Email Authentication**: Traditional email and password authentication
- **Password Recovery**: Secure password reset functionality

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) with [React Redux](https://react-redux.js.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Code Highlighting**: [Shiki](https://shiki.matsu.io/)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Media Player**: [Plyr React](https://github.com/chintan9/plyr-react)

## 📁 Project Structure

```
CodeConnect/
├── api/                        # Mock API data
├── public/                     # Static assets
│   ├── logo-dark.svg           # Dark mode logo
│   ├── logo-light.svg          # Light mode logo
│   ├── reactions/              # Reaction emoji images
│   └── themes/                 # Code editor themes
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── [locale]/           # Internationalization routes
│   │       ├── (auth)/         # Authentication pages
│   │       ├── (mainlayout)/   # Main application pages
│   │       ├── auth/           # Auth callback routes
│   │       └── chat/           # Chat interface
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── code/               # Code editor components
│   │   ├── comment/            # Comment system components
│   │   ├── layout/             # Layout components
│   │   ├── post/               # Post components
│   │   └── ui/                 # UI components
│   ├── config/                 # Configuration files
│   ├── constants/              # Constants and enums
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Internationalization setup
│   ├── lib/                    # Utility functions
│   ├── messages/               # Translation files
│   ├── store/                  # Redux store
│   │   └── slices/             # Redux slices
│   ├── styles/                 # Global styles
│   └── types/                  # TypeScript types
```

## 🔑 Key Components

### Post System
- **Post.tsx**: Displays individual posts with reactions, comments, and media
- **PostForm.tsx**: Create and edit posts with support for code, images, and videos
- **PostsList.tsx**: Renders the feed of posts with infinite scrolling

### Code Components
- **CodeBlock.tsx**: Displays code with syntax highlighting and copy functionality
- **CodeEditor.tsx**: Interactive code editor with language selection

### Comment System
- **CommentSection.tsx**: Displays and manages comments on posts
- **CommentItem.tsx**: Individual comment with replies and actions
- **ReplyForm.tsx**: Interface for replying to comments

### Authentication
- **LoginForm.tsx**: Email/password login form
- **RegisterForm.tsx**: New user registration
- **ForgotPasswordForm.tsx**: Password recovery

### Layout
- **MainNavBar.tsx**: Main navigation with user menu and search
- **AppSidebar.tsx**: Application sidebar with navigation links
- **RtlProvider.tsx**: Handles right-to-left layout switching

## 🔧 Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/codeconnect.git
   cd codeconnect
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to `http://localhost:3000`

## 🌐 Internationalization

The app supports both English and Arabic languages with automatic locale detection:

- **English**: `/en`
- **Arabic**: `/ar`

Language switching is available through the language switcher component in the navigation bar.

## 🎨 Theming

The application supports both dark and light themes with automatic system preference detection. Theme switching is available through the theme toggle component.

## 📱 Responsive Design

The interface is fully responsive:
- **Desktop**: Full-featured experience with sidebar
- **Tablet**: Adapted layout with collapsible sidebar
- **Mobile**: Mobile-optimized interface with bottom navigation

## 🔒 Authentication

### Local Authentication
- Email/password registration and login
- Password recovery via email

### Social Authentication
- GitHub OAuth integration
- More providers can be added through NextAuth.js

## 💾 Data Management

The application uses Redux for state management:
- **authSlice**: User authentication state
- **postsSlice**: Posts data and operations
- **commentsSlice**: Comments and replies
- **reactionsSlice**: Post reactions
- **programmingLanguagesSlice**: Available programming languages

## 🧩 UI Components

Built with shadcn/ui and Radix UI primitives:
- **Button**: Various button styles and variants
- **Dialog**: Modal dialogs and popups
- **Dropdown**: Dropdown menus
- **Tabs**: Tabbed interfaces
- **Card**: Content containers
- **Avatar**: User avatars
- **Form Controls**: Inputs, textareas, selects, etc.

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

```
# API URLs
NEXT_PUBLIC_API_URL=your_api_url
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## 🧪 Future Enhancements

- **Real-time Notifications**: Push notifications for interactions
- **Advanced Code Collaboration**: Real-time collaborative code editing
- **User Groups**: Create and join developer groups
- **Video Calls**: Integrated video calling for pair programming
- **AI Code Assistant**: AI-powered code suggestions and reviews
- **Analytics Dashboard**: Insights on post engagement and profile visits
- **Custom Themes**: User-defined theme customization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Your Name](https://github.com/mvicsa) - Lead Developer
- [Team Member 1](https://github.com/teammember1) - Frontend Developer
- [Team Member 2](https://github.com/teammember2) - UI/UX Designer

## 🙏 Acknowledgements

- [Next.js Team](https://nextjs.org/) for the amazing framework
- [Vercel](https://vercel.com/) for hosting and deployment
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- All open-source contributors whose libraries made this project possible
