import React, { useEffect, useRef, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import { ChatPreview, ChatRoomType, LastActivity, Message, User } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ArrowLeft, Search, Users, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setSeen } from '@/store/slices/chatSlice';
import { useBlock } from '@/hooks/useBlock';
import Link from "next/link";
import ChatSkeleton from "./chat/ChatSkeleton";

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeChatId?: string;
  className?: string;
  chatPreviews: ChatPreview[];
  onChatDelete?: (chatId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onChatSelect,
  isLoading,
  searchQuery,
  onSearchChange,
  activeChatId,
  className,
  chatPreviews
}) => {
  const myUserId = useSelector((state: RootState) => state.auth.user?._id);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const chatRooms = useSelector((state: RootState) => state.chat.rooms);
  const userStatusesRaw = useSelector((state: RootState) => state.chat.userStatuses || {});
  const dispatch = useDispatch();
  
  // Stabilize userStatuses to prevent unnecessary re-renders
  const userStatuses = useMemo(() => userStatusesRaw, [userStatusesRaw]);
  const { checkBlockStatus } = useBlock();
  const checkBlockStatusRef = useRef(checkBlockStatus);

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus;
  }, [checkBlockStatus]);

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    
    // Mark messages as seen when selecting a chat (but don't emit to backend to avoid status changes)
    if (messages[chatId]) {
      const unseenMessages = messages[chatId].filter(msg => 
        !msg.seenBy.includes(myUserId as string)
      );
      
      if (unseenMessages.length > 0) {
        const messageIds = unseenMessages.map(msg => msg._id);
        // Only update Redux locally, don't emit to backend
        dispatch(setSeen({ roomId: chatId, seen: messageIds, userId: myUserId as string, currentUserId: myUserId as string }));
      }
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const t = useTranslations("chat");

  // Check block status for all chat members when chatPreviews change
  useEffect(() => {
    if (chatPreviews.length > 0) {
      chatPreviews.forEach(preview => {
        if (preview.type === ChatRoomType.PRIVATE) {
          const otherMember = preview.members.find(m => m._id !== myUserId);
          if (otherMember) {
            checkBlockStatusRef.current(otherMember._id);
          }
        }
      });
    }
  }, [chatPreviews, myUserId, messages, chatRooms]); // Added chatRooms dependency

  // Reaction preview support (use same images as ReactionsMenu)
  const reactionImageMap: Record<string, string> = {
    like: "/reactions/like.png",
    love: "/reactions/love.png",
    wow: "/reactions/wow.png",
    happy: "/reactions/happy.png",
    funny: "/reactions/funny.png",
    dislike: "/reactions/dislike.png",
  };

  // const resolveReactionUserMeta = (userId: User, members: ChatPreview['members']) => {
  //   if (!userId) return { firstName: '', lastName: '', _id: '' } as User;
  //   if (typeof userId === 'string') return members.find(m => m._id === userId) || { firstName: '', lastName: '', _id: userId, username: '', avatar: '' } as User;
  //   return userId;
  // };

  const getLastActivity = (roomId: string): LastActivity => {
    const room = chatRooms.find(r => r._id === roomId);
    
    // 🎯 PRIORITY 1: Use backend's lastActivity if available
    if (room?.lastActivity) {
      const lastActivity = room.lastActivity;
      const activityTime = new Date(lastActivity.time).getTime();
      
      // Find the message for this activity
      let latestMessage: Message | null = null;
      
      // Check if lastActivity contains the full message object (from backend)
      if ((lastActivity as LastActivity).message) {
        latestMessage = (lastActivity as LastActivity).message || null;
      } else if (lastActivity.messageId && room.lastMessage?._id === lastActivity.messageId) {
        latestMessage = room.lastMessage;
      }
      
      // If it's a reaction, create reaction info
      let latestReaction: { userName: string; reaction: string; userId?: string; firstName?: string } | null = null;
      if (lastActivity.type === 'reaction' && lastActivity.reaction && lastActivity.userId) {
        // Handle userId as object from backend
        const userId = typeof lastActivity.userId === 'string' ? lastActivity.userId : (lastActivity.userId as User)._id;
        const userFirstName = typeof lastActivity.userId === 'string' ? '' : (lastActivity.userId as User).firstName;
        // const userLastName = typeof lastActivity.userId === 'string' ? '' : (lastActivity.userId as User).lastName;
        
        // Check if it's the current user
        if (userId === myUserId) {
          latestReaction = {
            userName: 'You',
            reaction: lastActivity.reaction,
            userId: userId,
            firstName: 'You'
          };
        } else {
          // Use the user info from lastActivity.userId object
          const fullName = `${userFirstName || ''}`.trim() || 'Someone';
          latestReaction = {
            userName: fullName,
            reaction: lastActivity.reaction,
            userId: userId,
            firstName: userFirstName
          };
        }
      }
      
      // If it's a message, set latestMessage from lastActivity.message
      if (lastActivity.type === 'message' && (lastActivity as LastActivity).message) {
        latestMessage = (lastActivity as LastActivity).message || null;
      }
      
      // If it's a deletion, handle accordingly
      if (lastActivity.type === 'deletion') {
        // For deletion, we don't need to set latestMessage since the message is deleted
        latestMessage = null;
      }
      
      return {
        latestType: lastActivity.type,
        latestTime: activityTime,
        latestMessage,
        latestReaction
      };
    }
    
    // If no lastActivity, return null (don't use fallback to avoid instability)
    return { latestType: null, latestTime: 0, latestMessage: null, latestReaction: null };
  };

  const renderLastPreview = (preview: ChatPreview) => {
    const activity = getLastActivity(preview._id);
    const { latestType, latestMessage, latestReaction } = activity;
    if (!latestType) return 'No messages yet';
    
    // Handle deletion type FIRST - before checking latestMessage
    if (latestType === 'deletion') return 'Message deleted'; // Handle deletion type from backend
    
    if (latestType === 'reaction' && latestReaction) {
      const imageSrc = reactionImageMap[latestReaction.reaction] || "/reactions/like.png";
      const isMe = latestReaction.userId === myUserId;
      const displayName = latestReaction.userName || 'Someone';
      return (
        <span className="inline-flex items-center gap-1">
          {isMe ? 'You reacted' : `${displayName} reacted`}
          <Image src={imageSrc} alt={latestReaction.reaction} width={16} height={16} className="ms-1" />
        </span>
      );
    }
    const m = latestMessage;
    if (!m) return 'No messages yet';
    if (m.deleted) return 'Message deleted';
    if (m.type === 'image') return <span className="inline-flex items-center gap-1"><ImageIcon className="inline w-4 h-4" /> Image</span>;
    if (m.type === 'file') return <span className="inline-flex items-center gap-1"><FileIcon className="inline w-4 h-4" /> File</span>;
    return m.content || m.codeData?.code || 'No messages yet';
  };

  const renderChatItem = (preview: ChatPreview) => {
    const isActive = activeChatId === preview._id;
    const otherMember = preview.type === ChatRoomType.PRIVATE 
      ? preview.members.find(m => m._id !== myUserId)
      : null;
    
    // Check if user is blocked
    const isBlocked = otherMember ? blockStatuses[otherMember._id]?.isBlocked : false;
    const isBlockedBy = otherMember ? blockStatuses[otherMember._id]?.isBlockedBy : false;

    const renderChatContent = () => (
      <div
        className={cn(
          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors border-s-4 border-s-transparent group relative",
          isActive 
            ? "bg-primary/10 border-s-primary" 
            : "hover:bg-card"
        )}
        onClick={() => handleChatSelect(preview._id)}
      >
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={preview.groupAvatar || ''}
              alt={preview.groupTitle || ''}
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Users className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-accent-foreground truncate">
                {preview.groupTitle}
              </p>
              <span className="text-xs text-muted-foreground">
                {preview.members.length} members
              </span>
            </div>
            {(() => {
              const activity = getLastActivity(preview._id);
              return activity.latestTime ? (
                <p className="text-xs text-muted-foreground">{formatTime(new Date(activity.latestTime))}</p>
              ) : null;
            })()}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate">
              {renderLastPreview(preview)}
            </p>
            {preview.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                {preview.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );

    if (preview.type === ChatRoomType.GROUP) {
      return (
        <div key={preview._id}>
          {renderChatContent()}
        </div>
      );
    } else if (otherMember) {
      const status = userStatuses[otherMember._id] || 'offline';
      return (
        <div
          key={preview._id}
          className={cn(
            "flex items-center space-x-3 rounded-lg cursor-pointer transition-colors group relative"
          )}
        >
          <div 
            className={cn(
              "flex items-center space-x-3 flex-1 cursor-pointer rounded-lg p-3 border-x-3 border-x-transparent overflow-hidden",
              isActive 
              ? "bg-primary/10 border-s-primary" 
              : "hover:bg-accent dark:hover:bg-card"
            )}
            onClick={() => handleChatSelect(preview._id)}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={otherMember.avatar}
                  alt={`${otherMember.firstName} ${otherMember.lastName}`}
                />
                <AvatarFallback>
                  {getInitials(`${otherMember.firstName} ${otherMember.lastName}`)}
                </AvatarFallback>
              </Avatar>
              {/* Online/offline dot - hidden for blocked users */}
              {!isBlocked && !isBlockedBy && (
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    status === 'online' ? 'bg-primary' : 'bg-gray-400'
                  )}
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-accent-foreground truncate">
                {`${otherMember.firstName} ${otherMember.lastName}`}
                {(isBlocked || isBlockedBy) && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {isBlocked ? '(Blocked)' : '(Blocked by)'}
                  </span>
                )}
              </p>
              {(() => {
                const activity = getLastActivity(preview._id);
                return activity.latestTime ? (
                  <p className="text-xs text-muted-foreground">{formatTime(new Date(activity.latestTime))}</p>
                ) : null;
              })()}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate">
                {(isBlocked || isBlockedBy) ? 'Messages blocked' : renderLastPreview(preview)}
              </p>
              {preview.unreadCount > 0 && !isBlocked && !isBlockedBy && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                  {preview.unreadCount}
                </span>
              )}
            </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get block statuses from Redux
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses);
  
  // Filter chatPreviews based on searchQuery
  const filteredPreviews = chatPreviews.filter(preview => {
    if (!searchQuery) return true;
    if (preview.type === ChatRoomType.GROUP) {
      return preview.groupTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (preview.type === ChatRoomType.PRIVATE) {
      const otherMember = preview.members.find(m => m._id !== myUserId);
      const fullName = `${otherMember?.firstName || ''} ${otherMember?.lastName || ''}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    }
    return false;
  });

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="cursor-pointer hover:bg-secondary rounded-full p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-semibold">{t("chat")}</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <ChatInput 
            placeholder={t("search")} 
            className="w-full pl-10" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <ChatScrollArea className="flex-1">
        <div className="p-4">
          {isLoading || (filteredPreviews.length === 0 && !searchQuery && chatPreviews.length === 0) ? (
            <ChatSkeleton />
          ) : filteredPreviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No chats found" : "No chats available"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPreviews.map((preview) => renderChatItem(preview))}
            </div>
          )}
        </div>
      </ChatScrollArea>
    </div>
  );
};

export default ChatSidebar;
