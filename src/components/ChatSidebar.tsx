import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import { ChatPreview } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Search, Users, User } from "lucide-react";

interface ChatSidebarProps {
  chatPreviews: ChatPreview[];
  onChatSelect: (chatId: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeChatId?: string;
  className?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatPreviews,
  onChatSelect,
  isLoading,
  searchQuery,
  onSearchChange,
  activeChatId,
  className,
}) => {
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
    if (preview.isGroup && preview.group) {
      const isActive = activeChatId === preview.group.id;
      return (
        <div
          key={preview.group.id}
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            isActive 
              ? "bg-primary/10 border-l-4 border-l-primary" 
              : "hover:bg-secondary"
          )}
          onClick={() => onChatSelect(preview.group!.id)}
        >
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={preview.group.avatar}
                alt={preview.group.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Users className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0 -right-0 w-3.5 h-3.5 rounded-full border-2 border-background bg-green-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-accent-foreground truncate">
                  {preview.group.name}
                </p>
                <span className="text-xs text-muted-foreground">
                  {preview.group.participants.length} members
                </span>
              </div>
              {preview.lastMessage && (
                <p className="text-xs text-muted-foreground">
                  {formatTime(preview.lastMessage.timestamp)}
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
    } else if (preview.user) {
      const isActive = activeChatId === `chat-${preview.user.id}`;
      return (
        <div
          key={preview.user.id}
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
            isActive 
              ? "bg-primary/10 border-l-4 border-l-primary" 
              : "hover:bg-secondary"
          )}
          onClick={() => onChatSelect(preview.user!.id)}
        >
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={preview.user.avatar}
                alt={preview.user.name}
              />
              <AvatarFallback>
                {getInitials(preview.user.name)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-0 -right-0 w-3.5 h-3.5 rounded-full border-2 border-background",
                getStatusColor(preview.user.status)
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-accent-foreground truncate">
                {preview.user.name}
              </p>
              {preview.lastMessage && (
                <p className="text-xs text-muted-foreground">
                  {formatTime(preview.lastMessage.timestamp)}
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
                  key={i}
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
              {chatPreviews.map(renderChatItem)}
            </div>
          )}
        </div>
      </ChatScrollArea>
    </div>
  );
};

export default ChatSidebar;
