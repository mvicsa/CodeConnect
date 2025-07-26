import React, { useContext, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import { ChatPreview, ChatRoomType, Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ArrowLeft, Search, Users, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { SocketContext } from '@/store/Provider'; 
import { setSeen } from '@/store/slices/chatSlice';
import { useBlock } from '@/hooks/useBlock';
import Link from "next/link";

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
  const socket = useContext(SocketContext);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const userStatuses = useSelector((state: RootState) => state.chat.userStatuses || {});
  const dispatch = useDispatch();
  const { checkBlockStatus } = useBlock();
  const checkBlockStatusRef = useRef(checkBlockStatus);

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus;
  }, [checkBlockStatus]);

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    
    // Mark messages as seen when selecting a chat
    if (socket && messages[chatId]) {
      const unseenMessages = messages[chatId].filter(msg => 
        !msg.seenBy.includes(myUserId as string)
      );
      
      if (unseenMessages.length > 0) {
        const messageIds = unseenMessages.map(msg => msg._id);
        socket.emit('chat:seen', { roomId: chatId, messageIds });
        // Optimistically update Redux so badge disappears instantly
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
  }, [chatPreviews, myUserId]);

  const renderLastMessagePreview = (lastMessage: Message | undefined | null) => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.deleted) return 'Message deleted';
    if (lastMessage.type === 'image') return <span className="inline-flex items-center gap-1"><ImageIcon className="inline w-4 h-4" /> Image</span>;
    if (lastMessage.type === 'file') return <span className="inline-flex items-center gap-1"><FileIcon className="inline w-4 h-4" /> File</span>;
    return lastMessage.content || 'No messages yet';
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
            {preview.lastMessage && (
              <p className="text-xs text-muted-foreground">
                {preview.lastMessage.createdAt ? formatTime(new Date(preview.lastMessage.createdAt)) : ""}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate">
              {renderLastMessagePreview(preview.lastMessage)}
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
            "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors border-x-4 border-x-transparent group relative",
            isActive 
              ? "bg-primary/10 border-s-primary" 
              : "hover:bg-accent dark:hover:bg-card"
          )}
        >
          <div 
            className="flex items-center space-x-3 flex-1 cursor-pointer"
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
              {preview.lastMessage && (
                <p className="text-xs text-muted-foreground">
                  {preview.lastMessage.createdAt ? formatTime(new Date(preview.lastMessage.createdAt)) : ""}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate">
                {(isBlocked || isBlockedBy) ? 'Messages blocked' : renderLastMessagePreview(preview.lastMessage)}
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
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex items-center space-x-3 p-3 rounded-lg"
                >
                  <div className="w-12 h-12 bg-accent rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-accent rounded animate-pulse" />
                    <div className="h-3 bg-accent rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
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
