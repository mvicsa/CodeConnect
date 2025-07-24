import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatRoom, Message, TypingIndicator, ChatRoomType, User } from '@/types/chat';

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: { [roomId: string]: Message[] };
  typing: { [roomId: string]: TypingIndicator[] };
  seen: { [roomId: string]: string[] };
  error: string | null;
  loading: boolean;
  connected: boolean;
  hasMore: { [roomId: string]: boolean };
  userStatuses?: { [userId: string]: 'online' | 'offline' };
}

const initialState: ChatState = {
  rooms: [],
  activeRoomId: null,
  messages: {},
  typing: {},
  seen: {},
  error: null,
  loading: false,
  connected: false,
  hasMore: {},
  userStatuses: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setRooms(state, action: PayloadAction<ChatRoom[]>) {
      state.rooms = action.payload.map(room => ({
        ...room,
        unreadCount: 0, // Will be updated when messages are loaded
      }));

      // Initialize messages for each room
      action.payload.forEach(room => {
        if (room.messages && room.messages.length > 0) {
          state.messages[room._id] = room.messages;
        }
      });
    },
    setActiveRoom(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload;
    },
    setMessages(state, action: PayloadAction<{ roomId: string; messages: Message[] }>) {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages.map(msg => {
        let chatRoomId: string;
        if (typeof msg.chatRoom === 'string') {
          chatRoomId = msg.chatRoom;
        } else if (msg.chatRoom && typeof (msg.chatRoom as unknown as { _id: string })._id === 'string') {
          chatRoomId = (msg.chatRoom as unknown as { _id: string })._id;
        } else if (msg.chatRoom && typeof (msg.chatRoom as unknown as { toString: () => string }).toString === 'function') {
          chatRoomId = (msg.chatRoom as unknown as { toString: () => string }).toString();
        } else {
          chatRoomId = '';
        }
        return {
          ...msg,
          chatRoom: chatRoomId
        };
      });
      
      // Update room's last message and unread count
      const room = state.rooms.find(r => r._id === roomId);
      if (room) {
        room.lastMessage = messages[messages.length - 1];
        // Use the logged-in user for unreadCount
        const currentUserId = (typeof window !== 'undefined' && window.localStorage.getItem('userId')) || 'current-user';
        room.unreadCount = state.messages[roomId].filter(m => !m.seenBy.includes(currentUserId)).length;
      }
    },
    addMessage(state, action: PayloadAction<{ roomId: string; message: Message }>) {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      let chatRoomId: string;
      if (typeof message.chatRoom === 'string') {
        chatRoomId = message.chatRoom;
      } else if (message.chatRoom && typeof (message.chatRoom as unknown as { _id: string })._id === 'string') {
        chatRoomId = (message.chatRoom as unknown as { _id: string })._id;
      } else if (message.chatRoom && typeof (message.chatRoom as unknown as { toString: () => string }).toString === 'function') {
        chatRoomId = (message.chatRoom as unknown as { toString: () => string }).toString();
      } else {
        chatRoomId = '';
      }
      const normalizedMessage = {
        ...message,
        chatRoom: chatRoomId
      };

      state.messages[roomId].push(normalizedMessage);
      
      // Update room's last message and unread count
      const room = state.rooms.find(r => r._id === roomId);
      if (room) {
        room.lastMessage = normalizedMessage;
        const currentUserId = (typeof window !== 'undefined' && window.localStorage.getItem('userId')) || 'current-user';
        room.unreadCount = state.messages[roomId].filter(m => !m.seenBy.includes(currentUserId)).length;
      }
    },
    setTyping(state, action: PayloadAction<{ roomId: string; typing: TypingIndicator[] }>) {
      const { roomId, typing } = action.payload;
      if (!state.typing[roomId]) state.typing[roomId] = [];

      typing.forEach(indicator => {
        // Remove the user if isTyping is false
        if (!indicator.isTyping) {
          state.typing[roomId] = state.typing[roomId].filter(t => t.userId !== indicator.userId);
        } else {
          // Add or update the user if isTyping is true
          const existing = state.typing[roomId].find(t => t.userId === indicator.userId);
          if (existing) {
            existing.isTyping = true;
          } else {
            state.typing[roomId].push(indicator);
          }
        }
      });
    },
    setSeen(state, action: PayloadAction<{ roomId: string; seen: string[]; userId?: string }>) {
      const { roomId, seen, userId } = action.payload;
      const messages = state.messages[roomId];
      if (messages) {
        messages.forEach(msg => {
          if (seen.includes(msg._id)) {
            // Add userId to seenBy if not already present
            if (userId && !msg.seenBy.includes(userId)) {
              msg.seenBy.push(userId);
            }
          }
        });
        // Update room's unread count for the current user
        const currentUserId = userId || (typeof window !== 'undefined' && window.localStorage.getItem('userId')) || 'current-user';
        const room = state.rooms.find(r => r._id === roomId);
        if (room) {
          room.unreadCount = messages.filter(m => !m.seenBy.includes(currentUserId)).length;
        }
      }
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    addGroupRoom(state, action: PayloadAction<{ name: string; avatar?: string; members: User[] }>) {
      const newRoom: ChatRoom = {
        _id: Date.now().toString(), // Temporary ID, will be replaced by server
        type: ChatRoomType.GROUP,
        groupTitle: action.payload.name,
        groupAvatar: action.payload.avatar || null,
        members: action.payload.members,
        unreadCount: 0,
        lastMessage: null,
        admins: [],
        pinnedMessages: [],
        createdBy: action.payload.members[0],
        messages: [],
      };
      state.rooms.push(newRoom);
    },
    addRoom(state, action: PayloadAction<ChatRoom>) {
      // Check if room already exists
      const existingRoomIndex = state.rooms.findIndex(r => r._id === action.payload._id);
      if (existingRoomIndex === -1) {
        state.rooms.push({
          ...action.payload,
          unreadCount: 0,
          lastMessage: null,
        });
      }
    },
    removeRoom(state, action: PayloadAction<string>) {
      state.rooms = state.rooms.filter(r => r._id !== action.payload);
      delete state.messages[action.payload];
      delete state.typing[action.payload];
      delete state.seen[action.payload];
    },
    addRoomMember(state, action: PayloadAction<{ roomId: string; user: User }>) {
      const room = state.rooms.find(r => r._id === action.payload.roomId);
      if (room) {
        room.members.push(action.payload.user);
      }
    },
    removeRoomMember(state, action: PayloadAction<{ roomId: string; userId: string }>) {
      const room = state.rooms.find(r => r._id === action.payload.roomId);
      if (room) {
        room.members = room.members.filter(member => member._id !== action.payload.userId);
      }
    },
    deleteMessage(state, action: PayloadAction<{ roomId: string; messageId: string; forAll: boolean; userId?: string }>) {
      const { roomId, messageId, forAll, userId } = action.payload;
      
      const messages = state.messages[roomId];
      if (messages) {
        if (forAll) {
          // For all users: Update the message to show as deleted
          const messageIndex = messages.findIndex(m => m._id === messageId);
          if (messageIndex !== -1) {
            messages[messageIndex] = {
              ...messages[messageIndex],
              content: '',
              fileUrl: '',
              deleted: true,
              deletedAt: new Date().toISOString(),
              deletedBy: userId
            };

            // Update room's lastMessage if this was the last message
            const room = state.rooms.find(r => r._id === roomId);
            if (room && room.lastMessage?._id === messageId) {
              // Find the previous non-deleted message
              const previousMessage = messages
                .slice(0, messageIndex)
                .reverse()
                .find(m => !m.deleted && (!m.deletedFor || !m.deletedFor.includes(userId || '')));
              
              room.lastMessage = previousMessage || {
                ...messages[messageIndex],
                content: 'Message deleted'
              };
            }
          }
        } else {
          // For specific user: Add to deletedFor array
          const messageIndex = messages.findIndex(m => m._id === messageId);
          if (messageIndex !== -1 && userId) {
            if (!messages[messageIndex].deletedFor) {
              messages[messageIndex].deletedFor = [];
            }
            if (!messages[messageIndex].deletedFor.includes(userId)) {
              messages[messageIndex].deletedFor.push(userId);

              // Update room's lastMessage if this was the last message
              const room = state.rooms.find(r => r._id === roomId);
              if (room && room.lastMessage?._id === messageId) {
                // Find the previous non-deleted message for this user
                const previousMessage = messages
                  .slice(0, messageIndex)
                  .reverse()
                  .find(m => !m.deleted && (!m.deletedFor || !m.deletedFor.includes(userId)));
                
                room.lastMessage = previousMessage || {
                  ...messages[messageIndex],
                  content: 'Message deleted'
                };
              }
            }
          }
        }
      }
    },
    setHasMore(state, action: PayloadAction<{ roomId: string; hasMore: boolean }>) {
      const { roomId, hasMore } = action.payload;
      state.hasMore[roomId] = hasMore;
    },
    setUserStatus(state, action: PayloadAction<{ userId: string; status: 'online' | 'offline' }>) {
      if (!state.userStatuses) state.userStatuses = {};
      state.userStatuses[action.payload.userId] = action.payload.status;
    },
  },
});

export const {
  setRooms,
  setActiveRoom,
  setMessages,
  addMessage,
  setTyping,
  setSeen,
  setError,
  setLoading,
  setConnected,
  addGroupRoom,
  addRoom,
  removeRoom,
  addRoomMember,
  removeRoomMember,
  deleteMessage,
  setHasMore,
  setUserStatus,
} = chatSlice.actions;

export default chatSlice.reducer; 