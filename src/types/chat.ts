export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  readBy?: string[]; // Array of user IDs who have read the message
  messageType?: "text" | "image" | "file" | "emoji";
  replyTo?: Message; // For reply functionality
  fileData?: {
    name: string;
    size: number;
    type: string;
    url?: string | null;
  };
}

export interface ChatPreview {
  user?: User; // For private chats
  group?: Group; // For group chats
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: Date;
  isGroup: boolean;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  participants: User[];
  adminId: string;
  createdAt: Date;
  description?: string;
}

export interface ChatRoom {
  id: string;
  participants: User[];
  messages: Message[];
  isTyping?: boolean;
  typingUsers?: User[]; // Multiple users can be typing
  isGroup: boolean;
  group?: Group;
  unreadCount: number;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatNotification {
  id: string;
  type: "message" | "typing" | "read" | "online" | "offline";
  data: any;
  timestamp: Date;
}
