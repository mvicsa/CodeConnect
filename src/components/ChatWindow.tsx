import React, { useState, useRef, useEffect, useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatButton } from "@/components/ui/chat-button";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import { ChatRoom, Message, TypingIndicator, MessageType, ChatRoomType, User } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Smile, Paperclip, Reply, Check, CheckCheck, MoreVertical, X, Image, File, Camera, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import MessageActions from "./MessageActions";
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { RootState } from '@/store/store';
import { SocketContext } from '@/store/Provider';
import { setError } from '@/store/slices/chatSlice';

interface ChatWindowProps {
  onBackToList: () => void;
  isMobileView: boolean;
}

const MemoChatInput = React.memo(ChatInput);

const ChatWindow: React.FC<ChatWindowProps> = ({
  onBackToList,
  isMobileView,
}) => {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const prevActiveRoomId = useRef<string | null>(null);
  const prevMessagesLength = useRef<number>(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Access chat state
  const myUserId = useSelector((state: RootState) => state.auth.user?._id) || 'current-user';
  const activeRoomId = useSelector((state: RootState) => state.chat.activeRoomId);
  const chatRooms = useSelector((state: RootState) => state.chat.rooms);
  const activeRoom = chatRooms.find(r => r._id === activeRoomId);
  const messages = useSelector(
    (state: RootState) => state.chat.messages[activeRoomId || ''] || [],
    shallowEqual
  );
  const typing = useSelector((state: RootState) => state.chat.typing[activeRoomId || ''] || []);
  const seen = useSelector((state: RootState) => state.chat.seen[activeRoomId || ''] || []);

  // Get socket from context
  const socket = useContext(SocketContext);
  const t = useTranslations("chat");
  const dispatch = useDispatch();

  // Load initial messages
  useEffect(() => {
    if (activeRoom?._id && socket) {
      socket.emit('chat:get_messages', { roomId: activeRoom._id, limit: 50 });
    }
  }, [activeRoom?._id, socket]);

  // Update oldest message ID when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const oldestMessage = messages[0]; // Assuming messages are sorted newest to oldest
      setOldestMessageId(oldestMessage._id);
    }
  }, [messages]);

  // Detect if user is at (or near) the bottom
  const isUserAtBottom = () => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 100;
  };

  // Track scroll position to update shouldAutoScroll
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    setShouldAutoScroll(element.scrollHeight - (element.scrollTop + element.clientHeight) < 100);
    
    const isNearTop = element.scrollTop < 100;
    const shouldLoadMore = !isLoadingMore && hasMore && isNearTop;

    if (shouldLoadMore && socket && activeRoom) {
      setIsLoadingMore(true);
      socket.emit('chat:get_messages', {
        roomId: activeRoom._id,
        limit: 50,
        before: oldestMessageId
      }, (error: any) => {
        if (error) {
          setHasMore(false);
        }
        setIsLoadingMore(false);
      });
    }

    // Update scroll to bottom button visibility
    const isAtBottom = element.scrollHeight - (element.scrollTop + element.clientHeight) < 100;
    setShowScrollToBottom(!isAtBottom);
  };

  // Scroll to bottom when:
  // - activeRoomId changes (user switches chat)
  // - messages length increases and shouldAutoScroll is true
  useEffect(() => {
    // If user switched chat, always scroll to bottom after messages load
    if (activeRoomId !== prevActiveRoomId.current) {
      prevActiveRoomId.current = activeRoomId;
      setTimeout(() => forceScrollToBottom(), 100);
      prevMessagesLength.current = messages.length;
      return;
    }
    // If new messages arrived (from anyone) and user was at bottom, scroll
    if (messages.length > prevMessagesLength.current && shouldAutoScroll) {
      setTimeout(() => forceScrollToBottom(), 100);
    }
    prevMessagesLength.current = messages.length;
  }, [activeRoomId, messages.length, shouldAutoScroll]);

  // Force scroll to bottom with smooth behavior
  const forceScrollToBottom = () => {
    if (!scrollRef.current) return;
    const scrollElement = scrollRef.current;
    const { scrollHeight, clientHeight } = scrollElement;
    const maxScroll = scrollHeight - clientHeight;
    scrollElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
  };

  // Close file menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFileMenuOpen) {
        const target = event.target as Node;
        const fileMenu = document.querySelector('[data-file-menu]');
        if (fileMenu && !fileMenu.contains(target)) {
          setIsFileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFileMenuOpen]);

  const handleSendMessage = () => {
    if (!activeRoom || !socket) return;

    if (message.trim() || selectedFile) {
      if (selectedFile) {
        sendFile();
      } else {
        const msg = {
          roomId: activeRoom._id,
          content: message.trim(),
          type: 'text',
          replyTo: replyTo?._id,
        };
        try {
          const currentMessage = message;
          setMessage("");
          setReplyTo(null);
          handleTypingStatus(false);

          socket.emit('chat:send_message', msg, (error: any) => {
            if (error) {
              setMessage(currentMessage);
              dispatch(setError('Failed to send message'));
            }
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          });
        } catch (error) {
          dispatch(setError('Failed to send message'));
        }
      }
    }
  };

  const handleTypingStatus = (isTyping: boolean) => {
    if (socket && activeRoom) {
      socket.emit('chat:typing', { roomId: activeRoom._id, isTyping });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (e.target.value.length > 0) {
      handleTypingStatus(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStatus(false);
      }, 2000);
    } else {
      handleTypingStatus(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // File handling functions
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const sendFile = () => {
    if (!activeRoom || !selectedFile || !socket) return;
    const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
    const fileData = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      url: filePreview || null,
    };
    const msg = {
      roomId: activeRoom._id,
      content: messageType === 'image' ? `📷 ${selectedFile.name}` : `📎 ${selectedFile.name}`,
      type: messageType,
      fileUrl: filePreview,
      replyTo: replyTo?._id,
      fileData,
    };
    socket.emit('chat:send_message', msg);
    removeSelectedFile();
    setReplyTo(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getSenderName = (sender: User) => {
    if (!activeRoom) return "";
    if (activeRoom.type === ChatRoomType.GROUP) {
      return sender.firstName + ' ' + sender.lastName;
    } else {
      if (sender._id !== myUserId) {
        return sender.firstName + ' ' + sender.lastName;
      }
      return "";
    }
  };

  const getChatTitle = () => {
    if (!activeRoom) return "";
    if (activeRoom.type === ChatRoomType.GROUP) {
      return activeRoom.groupTitle || "";
    }
    const otherUser = activeRoom.members.find(m => m._id !== myUserId);
    return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "";
  };

  const getChatAvatar = () => {
    if (!activeRoom) return "";
    if (activeRoom.type === ChatRoomType.GROUP) {
      return activeRoom.groupAvatar || "";
    }
    const otherUser = activeRoom.members.find(m => m._id !== myUserId);
    return otherUser?.avatar || "";
  };

  const getChatSubtitle = () => {
    if (!activeRoom) return "";
    if (activeRoom.type === ChatRoomType.GROUP) {
      return `${activeRoom.members.length} members`;
    }
    return "Online"; // Default status for private chats
  };

  const handleDeleteMessage = (messageId: string) => {
    if (socket && activeRoom) {
      socket.emit('chat:delete_message', { roomId: activeRoom._id, messageId, forAll: false }, (error: any) => {
        if (error) {
          dispatch(setError('Failed to delete message'));
        }
      });
    }
  };

  const renderMessage = (msg: Message) => {
    if (!activeRoom) return null;
    const isCurrentUser = msg.sender._id === myUserId;
    const senderName = `${msg.sender.firstName} ${msg.sender.lastName}`;
    // Real-time seen logic: show double check if any user other than sender has seen the message
    const isSeenByOther = msg.seenBy.some(uid => uid !== myUserId);
    
    // Handle deleted messages
    if (msg.deleted || (msg.deletedFor && msg.deletedFor.includes(myUserId))) {
      return (
        <div
          key={msg._id}
          className={cn(
            "flex items-start space-x-2 group relative",
            isCurrentUser ? "justify-end" : "justify-start"
          )}
        >
          {!isCurrentUser && activeRoom.type === ChatRoomType.GROUP && (
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={msg.sender.avatar}
                alt={senderName}
              />
              <AvatarFallback className="text-xs">
                {getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col max-w-xs lg:max-w-md relative">
            {activeRoom.type === ChatRoomType.GROUP && !isCurrentUser && (
              <p className="text-xs text-muted-foreground mb-1 px-1">
                {senderName}
              </p>
            )}
            <div className={cn(
              "rounded-lg relative group px-4 py-2",
              "bg-muted text-muted-foreground italic"
            )}>
              <p className="text-sm">Message deleted</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={msg._id}
        className={cn(
          "flex items-start space-x-2 group relative",
          isCurrentUser ? "justify-end" : "justify-start"
        )}
      >
        {!isCurrentUser && activeRoom.type === ChatRoomType.GROUP && (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={msg.sender.avatar}
              alt={senderName}
            />
            <AvatarFallback className="text-xs">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col max-w-xs lg:max-w-md relative">
          {activeRoom.type === ChatRoomType.GROUP && !isCurrentUser && (
            <p className="text-xs text-muted-foreground mb-1 px-1">
              {senderName}
            </p>
          )}
          
          <div
            className={cn(
              "rounded-lg relative group",
              isCurrentUser
                ? "bg-primary text-white border border-primary"
                : "bg-border text-accent-foreground"
            )}
          >
            {msg.replyTo && (
              <div className={cn(
                "text-xs p-3 border-b bg-muted rounded-t-lg",
                isCurrentUser ? "border-white" : "border-gray-300"
              )}>
                <p className="font-medium opacity-80 text-muted-foreground">
                  Replying to <span className="text-primary">
                    {msg.replyTo.sender._id === myUserId ? "you" : `${msg.replyTo.sender.firstName} ${msg.replyTo.sender.lastName}`}
                  </span>
                </p>
                <p className={cn(
                  "opacity-70 truncate",
                  isCurrentUser ? "text-secondary-foreground mt-1" : "text-gray-400"
                )}>
                  {msg.replyTo.content}
                </p>
              </div>
            )}
            
            <div className="px-4 py-2 relative">
              <div className="absolute top-2 right-2">
                <MessageActions
                  message={msg}
                  onReply={(message) => setReplyTo(message)}
                  onCopy={(content) => {
                    // Handle copy notification
                  }}
                  onDelete={isCurrentUser ? handleDeleteMessage : undefined}
                  isCurrentUser={isCurrentUser}
                />
              </div>
              
              {/* File/Image Content */}
              {msg.type === MessageType.IMAGE && msg.fileUrl && (
                <div className="mb-2">
                  <img 
                    src={msg.fileUrl} 
                    alt="Image"
                    className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (msg.fileUrl) {
                        window.open(msg.fileUrl, '_blank');
                      }
                    }}
                  />
                </div>
              )}
              
              {/* File Content */}
              {msg.type === MessageType.FILE && msg.fileUrl && (
                <div className="mb-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">File Attachment</p>
                    </div>
                    <ChatButton
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (msg.fileUrl) {
                          window.open(msg.fileUrl, '_blank');
                        }
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </ChatButton>
                  </div>
                </div>
              )}
              
              {/* Text Content */}
              <p className="text-sm">{msg.content}</p>
              <div className="flex items-center justify-between mt-1">
                <p
                  className={cn(
                    "text-xs",
                    isCurrentUser ? "text-blue-100" : "text-gray-500"
                  )}
                >
                  {formatTime(new Date())}
                </p>
                {isCurrentUser && (
                  <div className="flex items-center space-x-1">
                    {isSeenByOther ? (
                      <CheckCheck className="h-3 w-3 text-blue-200" />
                    ) : (
                      <Check className="h-3 w-3 text-blue-200" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = (typingUser: TypingIndicator) => {
    if (!activeRoom) return null;
    const member = activeRoom.members.find(m => m._id === typingUser.userId);
    if (!member) return null;

    return (
      <div key={typingUser.userId} className="flex items-center space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={member.avatar}
            alt={`${member.firstName} ${member.lastName}`}
          />
          <AvatarFallback className="text-xs">
            {getInitials(`${member.firstName} ${member.lastName}`)}
          </AvatarFallback>
        </Avatar>
        <div className="bg-gray-100 rounded-lg px-4 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-accent border">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b">
        {isMobileView && (
          <ChatButton
            variant="ghost"
            size="icon"
            onClick={onBackToList}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </ChatButton>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={getChatAvatar()}
            alt={getChatTitle()}
          />
          <AvatarFallback>
            {activeRoom?.type === ChatRoomType.GROUP ? (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Users className="h-5 w-5" />
              </div>
            ) : (
              getInitials(getChatTitle())
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-secondary-foreground">
            {getChatTitle()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeRoom?.type === ChatRoomType.GROUP 
              ? `${activeRoom.members.length} members` 
              : "Online"}
          </p>
        </div>
        <ChatButton variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </ChatButton>
      </div>

      {/* Messages */}
      <ChatScrollArea 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 p-4"
        style={{ 
          height: 'calc(100vh - 200px)',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }}
      >
        <div className="space-y-4 min-h-full">
          {messages.map(renderMessage)}
          
          {typing.map(renderTypingIndicator)}
        </div>
      </ChatScrollArea>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-20 right-4 z-10">
          <ChatButton
            variant="outline"
            size="icon"
            onClick={forceScrollToBottom}
            className="h-10 w-10 rounded-full shadow-lg"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </ChatButton>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="p-3 bg-muted border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Replying to</p>
              <p className="text-sm truncate">{replyTo.content}</p>
            </div>
            <ChatButton
              variant="ghost"
              size="icon"
              onClick={() => setReplyTo(null)}
              className="h-6 w-6"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </ChatButton>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="p-4 bg-muted border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <div className="relative">
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <ChatButton
                    variant="ghost"
                    size="icon"
                    onClick={removeSelectedFile}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-background border rounded-full hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </ChatButton>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <File className="h-8 w-8 text-primary" />
                  </div>
                  <ChatButton
                    variant="ghost"
                    size="icon"
                    onClick={removeSelectedFile}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-background border rounded-full hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </ChatButton>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          {/* File Upload Button */}
          <div className="relative">
            <ChatButton
              variant="ghost"
              size="icon"
              className="cursor-pointer hover:bg-muted"
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            >
              <Paperclip className="h-5 w-5" />
            </ChatButton>
            
            {/* File Upload Menu */}
            {isFileMenuOpen && (
              <div data-file-menu className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsFileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Image className="h-5 w-5 text-blue-500" />
                    <span className="text-sm">Photo & Video</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsFileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <File className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Document</span>
                  </button>
                  <button
                    onClick={() => {
                      cameraInputRef.current?.click();
                      setIsFileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Camera className="h-5 w-5 text-purple-500" />
                    <span className="text-sm">Camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />

          <MemoChatInput
            placeholder={t("write")}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          
          <ChatButton
            variant="ghost"
            size="icon"
            className="cursor-pointer hover:bg-muted"
          >
            <Smile className="h-5 w-5" />
          </ChatButton>

          <ChatButton
            onClick={handleSendMessage}
            disabled={!message.trim() && !selectedFile}
            className="bg-primary hover:bg-sidebar-primary cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </ChatButton>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
