import React, { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import { ChatPreview, ChatRoomType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Search, Users } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { SocketContext } from '@/store/Provider';
import { setSeen } from '@/store/slices/chatSlice';

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeChatId?: string;
  className?: string;
  chatPreviews: ChatPreview[];
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onChatSelect,
  isLoading,
  searchQuery,
  onSearchChange,
  activeChatId,
  className,
  chatPreviews,
}) => {
  const myUserId = useSelector((state: RootState) => state.auth.user?._id);
  const socket = useContext(SocketContext);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const dispatch = useDispatch();

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    
    // Mark messages as seen when selecting a chat
    if (socket && messages[chatId]) {
      const unseenMessages = messages[chatId].filter(msg => 
        !msg.seenBy.includes(myUserId || '')
      );
      
      if (unseenMessages.length > 0) {
        const messageIds = unseenMessages.map(msg => msg._id);
        socket.emit('chat:seen', { roomId: chatId, messageIds });
        // Optimistically update Redux so badge disappears instantly
        dispatch(setSeen({ roomId: chatId, seen: messageIds, userId: myUserId }));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-primary";
      case "away":
        return "bg-warning";
      default:
        return "bg-gray-400";
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

  const renderChatItem = (preview: ChatPreview) => {
    const isActive = activeChatId === preview._id;
    const otherMember = preview.type === ChatRoomType.PRIVATE 
      ? preview.members.find(m => m._id !== myUserId)
      : null;

    if (preview.type === ChatRoomType.GROUP) {
      return (
        <div
          key={preview._id}
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            isActive 
              ? "bg-primary/10 border-l-4 border-l-primary" 
              : "hover:bg-secondary"
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
                  {formatTime(new Date())}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate">
                {preview.lastMessage?.content || "No messages yet"}
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
    } else if (otherMember) {
      return (
        <div
          key={preview._id}
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            isActive 
              ? "bg-primary/10 border-l-4 border-l-primary" 
              : "hover:bg-secondary"
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
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-accent-foreground truncate">
                {`${otherMember.firstName} ${otherMember.lastName}`}
              </p>
              {preview.lastMessage && (
                <p className="text-xs text-muted-foreground">
                  {formatTime(new Date())}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate">
                {preview.lastMessage?.content || "No messages yet"}
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
    }
    return null;
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("chat")}</h2>
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
        <div className="p-2">
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
          ) : chatPreviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No chats found" : "No chats available"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatPreviews.map((preview) => renderChatItem(preview))}
            </div>
          )}
        </div>
      </ChatScrollArea>
    </div>
  );
};

export default ChatSidebar;
