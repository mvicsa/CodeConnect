"use client";
import React, { useState, useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveRoom, removeRoom } from '@/store/slices/chatSlice';
import { ChatPreview, Message } from "@/types/chat";
import { createSelector } from 'reselect';
import { User } from "@/types/user";

// Memoized selector for chatRooms
const selectChatRoomsForUser = createSelector(
  [
    (state: RootState) => state.chat.rooms,
    (state: RootState) => state.auth.user?._id || 'current-user'
  ],
  (rooms, myUserId) =>
    Array.isArray(rooms)
      ? rooms.filter(room =>
          Array.isArray(room.members)
            ? room.members.some((m: User) => (typeof m === 'string' ? m === myUserId : m._id === myUserId))
            : false
        )
      : []
);

const ChatInterface: React.FC = () => {
  const [isMobileView, setIsMobileView] = useState(false);
  const dispatch = useDispatch();

  // Redux selectors for chat state
  const myUserId = useSelector((state: RootState) => state.auth.user?._id) || 'current-user';
  // Only show rooms where the current user is a member, with defensive checks
  const chatRooms = useSelector(selectChatRoomsForUser);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const isConnected = useSelector((state: RootState) => state.chat.connected);
  const error = useSelector((state: RootState) => state.chat.error);
  const isLoading = useSelector((state: RootState) => state.chat.loading);

  // Transform chat rooms into previews
  const chatPreviews: ChatPreview[] = chatRooms.map(room => {
    const roomMessages = messages[room._id] || [];
    const unreadCount = roomMessages.filter((m: Message) => !m.seenBy.includes(myUserId as string)).length;
    return {
      _id: room._id,
      type: room.type,
      members: room.members,
      createdBy: room.createdBy,
      groupTitle: room.groupTitle,
      groupAvatar: room.groupAvatar,
      lastMessage: room.lastMessage,
      unreadCount,
    };
  });

  const activeChatId = useSelector((state: RootState) => state.chat.activeRoomId);
  const activeChat = chatRooms.find(r => r._id === activeChatId) || null;
  const [searchQuery, setSearchQuery] = useState("");

  const handleChatSelect = (chatId: string) => {
    dispatch(setActiveRoom(chatId));
    setIsMobileView(true);
  };

  const handleChatDelete = (chatId: string) => {
    // Remove the chat from Redux store
    dispatch(removeRoom(chatId));
    
    // If the deleted chat was active, clear the active chat
    if (activeChatId === chatId) {
      dispatch(setActiveRoom(null));
      setIsMobileView(false);
    }
  };

  const handleBackToList = () => {
    setIsMobileView(false);
    dispatch(setActiveRoom(null));
  };

  // Handle window resize for mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileView(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const t = useTranslations("chat");

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center">
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center">
          {error}
        </div>
      )}

      {/* Sidebar - Hidden on mobile when chat is open */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 md:block",
          isMobileView && activeChat ? "hidden" : "block"
        )}
      >
        <ChatSidebar
          onChatSelect={handleChatSelect}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeChatId={activeChat?._id}
          className="h-full"
          chatPreviews={chatPreviews}
          onChatDelete={handleChatDelete}
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
            onBackToList={handleBackToList}
            isMobileView={isMobileView}
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
