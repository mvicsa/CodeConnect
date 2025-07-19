export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

export enum ChatRoomType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  email?: string;
}

export interface Message {
  _id: string;
  chatRoom: string;
  sender: User;
  type: string;
  content: string;
  fileUrl: string | null;
  replyTo: Message | null;
  seenBy: string[];
  reactions: any[];
  deleted: boolean;
  deletedFor: string[];
  deletedAt?: string;
  deletedBy?: string;
  pinned: boolean;
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  type: ChatRoomType;
  members: User[];
  createdBy: User;
  groupTitle: string | null;
  groupAvatar: string | null;
  lastMessage?: Message | null;
  messages: Message[];
  unreadCount: number;
  admins: string[];
  pinnedMessages: Message[];
}

export interface ChatPreview {
  _id: string;
  type: ChatRoomType;
  members: User[];
  createdBy: User;
  groupTitle: string | null;
  groupAvatar: string | null;
  lastMessage?: Message | null;
  unreadCount: number;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  userName?: string;
}

export interface ChatNotification {
  id: string;
  type: "message" | "typing" | "read" | "online" | "offline";
  data: any;
  timestamp: Date;
}
