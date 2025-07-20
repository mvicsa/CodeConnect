'use client'

import { ReactNode, useEffect, createContext, useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './store'
import { fetchProfile } from './slices/authSlice'
import { RootState, AppDispatch } from './store'
import io from 'socket.io-client'
import {
  setRooms, setMessages, addMessage, setTyping, setSeen, setError,
  setConnected, deleteMessage, removeRoom, setHasMore, setUserStatus
} from './slices/chatSlice'
import { useSelector as useReduxSelector } from 'react-redux'

let socket: any = null

export const SocketContext = createContext<any>(null)

function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>()
  const { initialized, token, user } = useSelector((state: RootState) => state.auth)
  useEffect(() => {
    // Only fetch profile if we have a token but no user and not initialized
    if (!initialized && token && !user) {
      dispatch(fetchProfile())
    }
  }, [initialized, token, user, dispatch])
  return null
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  const [socketInstance, setSocketInstance] = useState<any>(null);

  return (
    <Provider store={store}>
      <SocketContext.Provider value={socketInstance}>
        <AuthInitializer />
        <ChatSocketManagerWithSocket setSocket={setSocketInstance} />
        {children}
      </SocketContext.Provider>
    </Provider>
  )
}

function ChatSocketManagerWithSocket({ setSocket }: { setSocket: (socket: any) => void }) {
  const dispatch = useDispatch()
  const token = useReduxSelector((state: RootState) => state.auth.token)
  const activeRoomId = useReduxSelector((state: RootState) => state.chat.activeRoomId) || ''

  useEffect(() => {
    if (!token || typeof window === 'undefined') {
      console.log('No token or not in browser environment, skipping socket connection');
      dispatch(setConnected(false));
      setSocket(null);
      return;
    }

    console.log('Initializing socket connection with token:', token.substring(0, 10) + '...');

    // Initialize socket connection
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket.IO connected!', newSocket.id);
      dispatch(setConnected(true));
    });
  
    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected!');
      dispatch(setConnected(false));
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      dispatch(setError('Failed to connect to chat server'));
      dispatch(setConnected(false));
    });

    // Initial data
    newSocket.on('connected', ({ rooms }: { rooms: any[] }) => {
      console.log('[SOCKET] Connected event received with rooms:', rooms);
      dispatch(setRooms(rooms));

      // Join all room channels for real-time updates
      rooms.forEach(room => {
        console.log(`[SOCKET] Joining room channel: ${room._id}`);
        newSocket.emit('chat:join_room', { roomId: room._id }, (error: any) => {
          if (error) {
            console.error(`[SOCKET] Error joining room ${room._id}:`, error);
          } else {
            console.log(`[SOCKET] Successfully joined room ${room._id}`);
          }
        });
      });
    });

    // Listen for join_room event from server (when re-added to a room)
    newSocket.on('chat:join_room', ({ roomId }: { roomId: string }) => {
      console.log('[SOCKET] Received chat:join_room for room:', roomId);
      newSocket.emit('chat:join_room', { roomId }, (error: any) => {
        if (error) {
          console.error(`[SOCKET] Error joining room ${roomId}:`, error);
        } else {
          console.log(`[SOCKET] Successfully joined room ${roomId}`);
        }
      });
    });

    // Message events
    newSocket.on('chat:messages', ({ roomId, messages, hasMore }: { roomId: string; messages: any[]; hasMore: boolean }) => {
      console.log('[SOCKET] Received messages for room:', roomId, 'Count:', messages.length, 'Has more:', hasMore);
      
      // Get existing messages for this room
      const existingMessages = store.getState().chat.messages[roomId] || [];
      console.log('[SOCKET] Existing messages:', existingMessages.length);
      
      // Merge messages, avoiding duplicates
      const mergedMessages = [...existingMessages];
      messages.forEach(msg => {
        if (!mergedMessages.some(m => m._id === msg._id)) {
          mergedMessages.push(msg);
        }
      });
      
      // Sort messages by _id (which is a timestamp-based ObjectId)
      mergedMessages.sort((a, b) => {
        // Convert string _id to timestamp for comparison
        const aTime = parseInt(a._id.substring(0, 8), 16) * 1000;
        const bTime = parseInt(b._id.substring(0, 8), 16) * 1000;
        return aTime - bTime;
      });
      
      console.log('[SOCKET] Merged messages:', mergedMessages.length);
      dispatch(setMessages({ roomId, messages: mergedMessages }));
      dispatch(setHasMore({ roomId, hasMore }));
    });

    newSocket.on('chat:message_error', (error: any) => {
      console.error('Message error from server:', error);
      dispatch(setError(error.message || 'Failed to send message'));
    });

    newSocket.on('chat:message_sent', (msg: any) => {
      console.log('Message sent confirmation from server:', msg);
      // Add the message to the local state
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    newSocket.on('chat:new_message', (msg: any) => {
      console.log('Received new message:', {
        _id: msg._id,
        chatRoom: msg.chatRoom,
        sender: msg.sender,
        // Log the full message to see its structure
        fullMessage: msg
      });
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    newSocket.on('chat:typing', ({ roomId, userId, isTyping }: { roomId: string; userId: string; isTyping: boolean }) => {
      if (!roomId) {
        console.warn('Received chat:typing with undefined roomId', { roomId, userId, isTyping });
        return;
      }
      dispatch(setTyping({ roomId, typing: [{ userId, isTyping }] }));
    });

    newSocket.on('chat:seen', ({ roomId, messageIds, userId }: { roomId: string; messageIds: string[]; userId: string }) => {
      dispatch(setSeen({ roomId, seen: messageIds, userId }));
    });

    newSocket.on('chat:delete_message', ({ roomId, messageId, forAll, userId }: { roomId: string; messageId: string; forAll: boolean; userId: string }) => {
      dispatch(deleteMessage({ roomId, messageId, forAll, userId }));
    });

    // Listen for user:status events (online/offline)
    newSocket.on('user:status', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      dispatch(setUserStatus({ userId, status }));
    });

    // Listen for user:status:all events (all currently online users)
    newSocket.on('user:status:all', ({ online }: { online: string[] }) => {
      online.forEach(userId => {
        dispatch(setUserStatus({ userId, status: 'online' }));
      });
    });


    // Set the socket instance
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        // Leave all room channels
        newSocket.emit('chat:leave_all_rooms');
        
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('connected');
        newSocket.off('chat:messages');
        newSocket.off('chat:new_message');
        newSocket.off('chat:message_sent');
        newSocket.off('chat:message_error');
        newSocket.off('chat:typing');
        newSocket.off('chat:seen');
        newSocket.off('chat:delete_message');
        newSocket.off('user:status'); // Added this line to remove the listener
        newSocket.off('user:status:all'); // Added this line to remove the listener
        newSocket.off('chat:join_room'); // Added this line to remove the listener
        newSocket.disconnect();
        setSocket(null);
      }
    };
  }, [token, dispatch, setSocket]);

  return null;
}

export default ReduxProvider;
