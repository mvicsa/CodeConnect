import { useState, useEffect, useCallback } from "react";
import { ChatPreview, ChatRoom, User, Message, Group, TypingIndicator } from "@/types/chat";

// Mock data - replace with API calls
const mockUsers: User[] = [
  {
    id: "1",
    name: "Jontray Arnold",
    avatar: "/user.png",
    status: "online",
  },
  {
    id: "2",
    name: "Kate Johnson",
    avatar: "/user.png",
    status: "online",
  },
  {
    id: "3",
    name: "Evan Scott",
    avatar: "/user.png",
    status: "away",
  },
  {
    id: "4",
    name: "Tamara Shevchenko",
    avatar: "/user.png",
    status: "offline",
  },
  {
    id: "5",
    name: "Joshua Clarkson",
    avatar: "/user.png",
    status: "offline",
  },
];

const mockGroups: Group[] = [
  {
    id: "group-1",
    name: "Project Team",
    avatar: "/user.png",
    participants: [mockUsers[0], mockUsers[1], mockUsers[2]],
    adminId: "1",
    createdAt: new Date("2024-01-01"),
    description: "Team collaboration for the main project",
  },
  {
    id: "group-2",
    name: "Design Team",
    avatar: "/user.png",
    participants: [mockUsers[1], mockUsers[3], mockUsers[4]],
    adminId: "2",
    createdAt: new Date("2024-01-15"),
    description: "Design and UI/UX discussions",
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "2",
    receiverId: "current-user",
    content: "hi everyone, let's start the call soon 😊",
    timestamp: new Date("2024-01-01T11:34:00"),
    isRead: true,
    readBy: ["current-user"],
  },
  {
    id: "2",
    senderId: "3",
    receiverId: "current-user",
    content:
      "Recently I saw properties in a great location that I did not pay attention to before 😊",
    timestamp: new Date("2024-01-01T11:25:00"),
    isRead: true,
    readBy: ["current-user"],
  },
  {
    id: "3",
    senderId: "3",
    receiverId: "current-user",
    content: "Ooo, why don't you say something more",
    timestamp: new Date("2024-01-01T11:26:00"),
    isRead: true,
    readBy: ["current-user"],
  },
  {
    id: "4",
    senderId: "2",
    receiverId: "current-user",
    content: "@Robert ? 😊",
    timestamp: new Date("2024-01-01T11:27:00"),
    isRead: true,
    readBy: ["current-user"],
  },
  {
    id: "5",
    senderId: "current-user",
    receiverId: "2",
    content: "He creates an atmosphere of mystery 😊",
    timestamp: new Date("2024-01-01T11:28:00"),
    isRead: true,
    readBy: ["2"],
  },
  {
    id: "6",
    senderId: "3",
    receiverId: "current-user",
    content: "Robert, don't be like that and say something more :) 😊",
    timestamp: new Date("2024-01-01T11:34:00"),
    isRead: true,
    readBy: ["current-user"],
  },
  // Group messages
  {
    id: "7",
    senderId: "1",
    receiverId: "group-1",
    content: "Welcome to the project team! 🚀",
    timestamp: new Date("2024-01-01T10:00:00"),
    isRead: true,
    readBy: ["current-user", "2", "3"],
  },
  {
    id: "8",
    senderId: "2",
    receiverId: "group-1",
    content: "Thanks! Looking forward to working together",
    timestamp: new Date("2024-01-01T10:05:00"),
    isRead: true,
    readBy: ["current-user", "1", "3"],
  },
];

export const useChat = () => {
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulate real-time typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate typing indicators
      if (Math.random() > 0.7 && activeChat) {
        const randomUser = activeChat.participants[Math.floor(Math.random() * activeChat.participants.length)];
        if (randomUser.id !== "current-user") {
          setTypingUsers(prev => {
            const existing = prev.find(t => t.userId === randomUser.id);
            if (!existing) {
              return [...prev, { userId: randomUser.id, userName: randomUser.name, isTyping: true }];
            }
            return prev;
          });

          // Stop typing after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(t => t.userId !== randomUser.id));
          }, 3000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    // Simulate API call to fetch chat previews
    const fetchChatPreviews = async () => {
      setIsLoading(true);

      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Private chat previews
      const privatePreviews: ChatPreview[] = mockUsers.map((user) => ({
        user,
        lastMessage: mockMessages.find(
          (msg) => (msg.senderId === user.id || msg.receiverId === user.id) && !msg.receiverId.startsWith('group-')
        ),
        unreadCount: Math.floor(Math.random() * 3),
        lastActivity: new Date(),
        isGroup: false,
      }));

      // Group chat previews
      const groupPreviews: ChatPreview[] = mockGroups.map((group) => ({
        group,
        lastMessage: mockMessages.find(
          (msg) => msg.receiverId === group.id
        ),
        unreadCount: Math.floor(Math.random() * 5),
        lastActivity: new Date(),
        isGroup: true,
      }));

      setChatPreviews([...privatePreviews, ...groupPreviews]);
      setIsLoading(false);
    };

    fetchChatPreviews();
  }, []);

  const openChat = async (chatId: string) => {
    setIsLoading(true);

    // Mock API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Check if it's a group chat
    const group = mockGroups.find(g => g.id === chatId);
    if (group) {
      const chatMessages = mockMessages.filter(msg => msg.receiverId === group.id);
      
      const chatRoom: ChatRoom = {
        id: group.id,
        participants: group.participants,
        messages: chatMessages,
        isTyping: false,
        isGroup: true,
        group,
        unreadCount: 0,
      };

      // Update chat previews to reset unread count for this group
      setChatPreviews(prev => 
        prev.map(preview => 
          preview.isGroup && preview.group?.id === chatId
            ? { ...preview, unreadCount: 0 }
            : preview
        )
      );

      setActiveChat(chatRoom);
      setIsLoading(false);
      return;
    }

    // Private chat
    const user = mockUsers.find((u) => u.id === chatId);
    if (!user) return;

    const chatMessages = mockMessages.filter(
      (msg) => (msg.senderId === chatId || msg.receiverId === chatId) && !msg.receiverId.startsWith('group-')
    );

    const chatRoom: ChatRoom = {
      id: `chat-${chatId}`,
      participants: [user],
      messages: chatMessages,
      isTyping: false,
      isGroup: false,
      unreadCount: 0,
    };

    // Update chat previews to reset unread count for this user
    setChatPreviews(prev => 
      prev.map(preview => 
        !preview.isGroup && preview.user?.id === chatId
          ? { ...preview, unreadCount: 0 }
          : preview
      )
    );

    setActiveChat(chatRoom);
    setIsLoading(false);
  };

  const sendMessage = async (content: string, replyTo?: Message, messageType?: "text" | "image" | "file" | "emoji", fileData?: any) => {
    if (!activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "current-user",
      receiverId: activeChat.isGroup ? activeChat.group!.id : activeChat.participants[0].id,
      content,
      timestamp: new Date(),
      isRead: false,
      messageType: messageType || "text",
      replyTo,
      ...(fileData && { fileData }), // Add file data if provided
    };

    // Optimistically update UI
    setActiveChat((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
          }
        : null
    );

    // Update chat previews
    setChatPreviews(prev => 
      prev.map(preview => {
        if (activeChat.isGroup && preview.group?.id === activeChat.group?.id) {
          return {
            ...preview,
            lastMessage: newMessage,
            lastActivity: new Date(),
          };
        } else if (!activeChat.isGroup && preview.user?.id === activeChat.participants[0].id) {
          return {
            ...preview,
            lastMessage: newMessage,
            lastActivity: new Date(),
          };
        }
        return preview;
      })
    );

    // Mock API call
    // await api.sendMessage(newMessage);
  };

  const markAsRead = useCallback((messageId: string) => {
    setActiveChat(prev => 
      prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, readBy: [...(msg.readBy || []), "current-user"] }
            : msg
        )
      } : null
    );
  }, []);

  const startTyping = useCallback(() => {
    // Mock API call to notify other users
    // await api.notifyTyping({ chatId: activeChat?.id, isTyping: true });
  }, [activeChat]);

  const stopTyping = useCallback(() => {
    // Mock API call to notify other users
    // await api.notifyTyping({ chatId: activeChat?.id, isTyping: false });
  }, [activeChat]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!activeChat) return;

    // Remove message from active chat
    setActiveChat(prev => 
      prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId)
      } : null
    );

    // Update chat previews if the deleted message was the last message
    setChatPreviews(prev => 
      prev.map(preview => {
        if (activeChat.isGroup && preview.group?.id === activeChat.group?.id) {
          const remainingMessages = mockMessages.filter(msg => 
            msg.receiverId === activeChat.group!.id && msg.id !== messageId
          );
          const newLastMessage = remainingMessages[remainingMessages.length - 1];
          return {
            ...preview,
            lastMessage: newLastMessage,
            lastActivity: new Date(),
          };
        } else if (!activeChat.isGroup && preview.user?.id === activeChat.participants[0].id) {
          const remainingMessages = mockMessages.filter(msg => 
            (msg.senderId === activeChat.participants[0].id || msg.receiverId === activeChat.participants[0].id) && 
            !msg.receiverId.startsWith('group-') && 
            msg.id !== messageId
          );
          const newLastMessage = remainingMessages[remainingMessages.length - 1];
          return {
            ...preview,
            lastMessage: newLastMessage,
            lastActivity: new Date(),
          };
        }
        return preview;
      })
    );

    // Mock API call
    // await api.deleteMessage(messageId);
  }, [activeChat]);

  const filteredChatPreviews = chatPreviews.filter(preview => {
    if (!searchQuery) return true;
    
    if (preview.isGroup && preview.group) {
      return preview.group.name.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (preview.user) {
      return preview.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return false;
  });

  return {
    chatPreviews: filteredChatPreviews,
    activeChat,
    isLoading,
    typingUsers,
    searchQuery,
    setSearchQuery,
    openChat,
    sendMessage,
    deleteMessage,
    markAsRead,
    startTyping,
    stopTyping,
    setActiveChat,
  };
};
