"use client";
import React, { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const ChatInterface: React.FC = () => {
  const {
    chatPreviews,
    activeChat,
    isLoading,
    typingUsers,
    searchQuery,
    setSearchQuery,
    openChat,
    sendMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    setActiveChat,
  } = useChat();
  const [isMobileView, setIsMobileView] = useState(false);

  const handleChatSelect = (chatId: string) => {
    openChat(chatId);
    setIsMobileView(true);
  };

  const handleBackToList = () => {
    setIsMobileView(false);
    setActiveChat(null);
  };

  const t = useTranslations("chat");

  return (
    <div className="flex h-screen w-full rounded-3xl bg-background overflow-hidden">
      {/* Sidebar - Hidden on mobile when chat is open */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 md:block",
          isMobileView && activeChat ? "hidden" : "block"
        )}
      >
        <ChatSidebar
          chatPreviews={chatPreviews}
          onChatSelect={handleChatSelect}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeChatId={activeChat?.id}
          className="h-full"
        />
      </div>

      {/* Chat Window - Hidden on mobile when no chat is selected */}
      <div
        className={cn(
          "flex-1 md:block",
          !isMobileView || !activeChat ? "hidden md:block" : "block"
        )}
      >
        {activeChat ? (
          <ChatWindow
            chatRoom={activeChat}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            onBack={handleBackToList}
            typingUsers={typingUsers}
            onStartTyping={startTyping}
            onStopTyping={stopTyping}
            className="h-full"
          />
        ) : (
          <div className="hidden md:flex items-center justify-center h-full bg-sidebar border">
            <div className="text-center">
              <div className="w-24 h-24 bg-background rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-accent-foreground mb-2">
                {t("select")}
              </h3>
              <p className="text-muted-foreground">{t("choose")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
