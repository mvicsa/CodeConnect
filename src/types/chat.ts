export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  CODE = 'code',
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

export interface UserReaction {
  userId: { _id: string; firstName: string; lastName: string; avatar: string; role?: string };
  username: string;
  reaction: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  chatRoom: string;
  sender: User;
  type: MessageType;
  content: string;
  fileUrl: string | null;
  fileData?: {
    name: string;
    size: number;
    type: string;
    url?: string | null;
  };
  codeData?: {
    code: string;
    language: string;
  };
  replyTo: Message | null;
  userReactions: UserReaction[];
  reactions: {
    like: number;
    love: number;
    wow: number;
    funny: number;
    dislike: number;
    happy: number;
  };
  seenBy: string[];
  deleted: boolean;
  deletedFor: string[];
  deletedAt?: string;
  deletedBy?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatRoom {
  _id: string;
  type: ChatRoomType;
  members: User[];
  createdBy: User;
  groupTitle: string | null;
  groupAvatar: string | null;
  lastMessage?: Message | null;
  lastMessageTime?: number; // Timestamp for sorting
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
  data: unknown;
  timestamp: Date;
}
