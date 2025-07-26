import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

/**
 * Hook to get the count of chat rooms that have unread messages
 * @returns number of rooms with unread messages
 */
export const useUnreadRoomsCount = () => {
  const rooms = useSelector((state: RootState) => state.chat.rooms);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const myUserId = useSelector((state: RootState) => state.auth.user?._id);
  
  if (!myUserId) return 0;
  
  const roomsWithUnreadMessages = rooms.filter(room => {
    const roomMessages = messages[room._id] || [];
    const hasUnreadMessages = roomMessages.some(message => !message.seenBy.includes(myUserId));
    return hasUnreadMessages;
  });
  
  return roomsWithUnreadMessages.length;
};

/**
 * Hook to get the total count of unread messages across all rooms
 * @returns total number of unread messages
 */
export const useUnreadMessagesCount = () => {
  const rooms = useSelector((state: RootState) => state.chat.rooms);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const myUserId = useSelector((state: RootState) => state.auth.user?._id);
  
  if (!myUserId) return 0;
  
  const totalUnreadCount = rooms.reduce((total, room) => {
    const roomMessages = messages[room._id] || [];
    const unreadCount = roomMessages.filter(message => !message.seenBy.includes(myUserId)).length;
    return total + unreadCount;
  }, 0);
  
  return totalUnreadCount;
};
