import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatRoom, Message, TypingIndicator, ChatRoomType, User, UserReaction } from '@/types/chat';
import { Reactions } from '@/types/post';

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
    setMessages(state, action: PayloadAction<{ roomId: string; messages: Message[]; currentUserId?: string }>) {
      const { roomId, messages, currentUserId } = action.payload;
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
      if (room && currentUserId) {
        if (messages.length > 0) {
          room.lastMessage = messages[messages.length - 1];
          room.lastMessageTime = new Date(messages[messages.length - 1].createdAt).getTime();
        } else {
          room.lastMessage = null;
          room.lastMessageTime = undefined;
        }
        room.unreadCount = state.messages[roomId].filter(m => !m.seenBy.includes(currentUserId)).length;
      }
    },
    addMessage(state, action: PayloadAction<{ roomId: string; message: Message; currentUserId?: string }>) {
      const { roomId, message, currentUserId } = action.payload;
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
      
      // Update room's unread count only
      const room = state.rooms.find(r => r._id === roomId);
      if (room && currentUserId) {
        // Don't update lastMessage here - it's handled by lastActivity
        room.unreadCount = state.messages[roomId].filter(m => !m.seenBy.includes(currentUserId)).length;
        
        // Note: lastActivity is handled by updateRoomLastActivity from backend
        // Only update if no lastActivity exists (fallback for old backend versions)
        if (!room.lastActivity) {
          room.lastActivity = {
            type: 'message',
            time: normalizedMessage.createdAt,
            messageId: normalizedMessage._id,
            userId: normalizedMessage.sender._id,
            message: normalizedMessage
          };
        }
        
        // Move this room to the top of the rooms array (most recent message first)
        const roomIndex = state.rooms.findIndex(r => r._id === roomId);
        if (roomIndex > 0) {
          const [movedRoom] = state.rooms.splice(roomIndex, 1);
          state.rooms.unshift(movedRoom);
        }
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
    setSeen(state, action: PayloadAction<{ roomId: string; seen: string[]; userId?: string; currentUserId?: string }>) {
      const { roomId, seen, userId, currentUserId } = action.payload;
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
        // Update room's unread count for the current user (but don't update lastMessageTime)
        const actualUserId = currentUserId || userId;
        const room = state.rooms.find(r => r._id === roomId);
        if (room && actualUserId) {
          room.unreadCount = messages.filter(m => !m.seenBy.includes(actualUserId)).length;
          // Don't update lastMessageTime here - it should only change when there's a new message
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
      const { userId, status } = action.payload;
      
      // Only update if status actually changed to prevent unnecessary re-renders
      if (state.userStatuses[userId] !== status) {
        state.userStatuses[userId] = status;
      } else {
        // Don't update Redux state if status hasn't changed
        return;
      }
    },
    updateMessage(state, action: PayloadAction<{ roomId: string; messageId: string; updates: Message }>) {
      const { roomId, messageId, updates } = action.payload;
      const messages = state.messages[roomId];
      
      if (messages) {
        const messageIndex = messages.findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          // Update the message with new data
          messages[messageIndex] = {
            ...messages[messageIndex],
            ...updates
          };
          
          // Update room's lastMessage if this was the last message
          const room = state.rooms.find(r => r._id === roomId);
          if (room && room.lastMessage?._id === messageId) {
            room.lastMessage = messages[messageIndex];
          }
        }
      }
    },
    updateMessageReactions(state, action: PayloadAction<{ roomId: string; messageId: string; reactions: Reactions; userReactions: UserReaction[] }>) {
      const { roomId, messageId, reactions, userReactions } = action.payload;
      const messages = state.messages[roomId];
      const room = state.rooms.find(r => r._id === roomId);
      
      if (messages) {
        const messageIndex = messages.findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          // Create a new message object to trigger re-render
          const updatedMessage = {
            ...messages[messageIndex],
            reactions,
            userReactions
          };
          messages[messageIndex] = updatedMessage;

          // Update room's lastMessage if this message has the most recent activity
          if (room) {
            // Check if this message now has the most recent activity
            const currentLastTime = room.lastMessageTime || 0;
            const messageTime = new Date(updatedMessage.createdAt).getTime();
            
            // Find the most recent reaction time on this message
            let newestReactionTime = 0;
            if (Array.isArray(updatedMessage.userReactions)) {
              for (const ur of updatedMessage.userReactions) {
                const reactionTime = new Date(ur.createdAt).getTime();
                if (reactionTime > newestReactionTime) {
                  newestReactionTime = reactionTime;
                }
              }
            }
            
            // Get the latest time (either message or newest reaction)
            const latestActivityTime = Math.max(messageTime, newestReactionTime);
            
            // Update if this activity is newer than current last time
            if (latestActivityTime > currentLastTime) {
              room.lastMessage = updatedMessage;
              room.lastMessageTime = latestActivityTime;
            }
          }
        }
      } else if (room && room.lastMessage && room.lastMessage._id === messageId) {
        // If messages not loaded but this is the room's lastMessage, update it
        const updatedMessage = {
          ...room.lastMessage,
          reactions,
          userReactions
        };
        room.lastMessage = updatedMessage;
        
        // Find the most recent reaction time
        let newestReactionTime = 0;
        if (Array.isArray(updatedMessage.userReactions)) {
          for (const ur of updatedMessage.userReactions) {
            const reactionTime = new Date(ur.createdAt).getTime();
            if (reactionTime > newestReactionTime) {
              newestReactionTime = reactionTime;
            }
          }
        }
        
        const messageTime = new Date(updatedMessage.createdAt).getTime();
        const latestActivityTime = Math.max(messageTime, newestReactionTime);
        room.lastMessageTime = latestActivityTime;
      }
    },
    // 🎯 NEW: Update room's lastActivity from backend
    updateRoomLastActivity(state, action: PayloadAction<{ 
      roomId: string; 
      lastActivity: { 
        type: 'message' | 'reaction' | 'deletion'; 
        time: string; 
        messageId: string; 
        reaction?: string; 
        userId?: string; 
      } 
    }>) {
      const { roomId, lastActivity } = action.payload;
      const room = state.rooms.find(r => r._id === roomId);
      
      if (room) {
        room.lastActivity = {
          ...lastActivity,
          time: lastActivity.time // Keep as string, don't convert to Date
        };
      }
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
  updateMessage,
  updateMessageReactions,
  updateRoomLastActivity,
} = chatSlice.actions;

export default chatSlice.reducer; 