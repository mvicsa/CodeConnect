import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatButton } from "@/components/ui/chat-button";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import { ChatRoom, Message, TypingIndicator } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Smile, Paperclip, Reply, Check, CheckCheck, MoreVertical, X, Image, File, Camera } from "lucide-react";
import EmojiButtonModule from "emoji-button";
import { useTranslations } from "next-intl";
import MessageActions from "./MessageActions";

const EmojiButton = EmojiButtonModule.default;

interface ChatWindowProps {
  chatRoom: ChatRoom;
  onSendMessage: (content: string, replyTo?: Message, messageType?: "text" | "image" | "file" | "emoji", fileData?: any) => void;
  onDeleteMessage: (messageId: string) => void;
  onBack?: () => void;
  typingUsers: TypingIndicator[];
  onStartTyping: () => void;
  onStopTyping: () => void;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatRoom,
  onSendMessage,
  onDeleteMessage,
  onBack,
  typingUsers,
  onStartTyping,
  onStopTyping,
}) => {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<any>(null);
  const emojiPickerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const scrollElement = scrollRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };

    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [chatRoom.messages, typingUsers]);

  // Force scroll to bottom with multiple attempts for reliability
  const forceScrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      
      // Immediate scroll
      scrollElement.scrollTop = scrollElement.scrollHeight;
      
      // Additional attempts with delays to ensure it works
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
      
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  // Cleanup emoji picker on unmount or chat change
  useEffect(() => {
    return () => {
      if (pickerRef.current) {
        try {
          // Remove document click event listener
          if (pickerRef.current._documentClickHandler) {
            document.removeEventListener('click', pickerRef.current._documentClickHandler);
          }
          
          // Hide picker before destroying
          pickerRef.current.hidePicker();
          
          // Destroy the picker
          pickerRef.current.destroy();
        } catch (error) {
          // Ignore errors during cleanup
        }
        pickerRef.current = null;
        setIsEmojiPickerOpen(false);
      }
    };
  }, [chatRoom.id]); // Re-run when chat change

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

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      const isAtBottom = scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 10;
      setShowScrollToBottom(!isAtBottom);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() || selectedFile) {
      if (selectedFile) {
        sendFile();
      } else {
        onSendMessage(message.trim(), replyTo || undefined);
        setMessage("");
        setReplyTo(null);
        onStopTyping();
      }
      
      // Force scroll to bottom after sending message with multiple attempts
      const scrollToBottom = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };
      
      // Immediate scroll
      scrollToBottom();
      
      // Additional attempts to ensure it works
      requestAnimationFrame(scrollToBottom);
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (e.target.value.length > 0) {
      onStartTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 2000);
    } else {
      onStopTyping();
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
    if (selectedFile) {
      // Create a file message with proper type and data
      const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      const fileData = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: filePreview || null, // For images, use the preview URL
      };
      
      // Create the message content based on type
      const content = messageType === 'image' 
        ? `📷 ${selectedFile.name}` 
        : `📎 ${selectedFile.name}`;
      
      // Send the message with file data
      onSendMessage(content, replyTo || undefined, messageType, fileData);
      removeSelectedFile();
      setReplyTo(null);
      
      // Force scroll to bottom after sending file
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
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

  const getSenderName = (senderId: string) => {
    if (chatRoom.isGroup) {
      const participant = chatRoom.participants.find(p => p.id === senderId);
      return participant?.name || "Unknown";
    } else {
      // For private chats, if it's not the current user, it's the other participant
      if (senderId !== "current-user") {
        return chatRoom.participants[0]?.name || "Unknown";
      }
      return "";
    }
  };

  const t = useTranslations("chat");

  const renderMessage = (msg: Message) => {
    const isCurrentUser = msg.senderId === "current-user";
    const senderName = chatRoom.isGroup ? getSenderName(msg.senderId) : "";
    
    return (
      <div
        key={msg.id}
        className={cn(
          "flex items-start space-x-2 group relative",
          isCurrentUser ? "justify-end" : "justify-start"
        )}
      >
        {!isCurrentUser && chatRoom.isGroup && (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={chatRoom.participants.find(p => p.id === msg.senderId)?.avatar}
              alt={senderName}
            />
            <AvatarFallback className="text-xs">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col max-w-xs lg:max-w-md relative">
          {chatRoom.isGroup && !isCurrentUser && (
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
                    Replying to <span className="text-primary">{msg.replyTo.senderId === "current-user" ? "you" : getSenderName(msg.replyTo.senderId)}</span>
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
                      console.log("Message copied:", content);
                    }}
                    onDelete={isCurrentUser ? onDeleteMessage : undefined}
                    isCurrentUser={isCurrentUser}
                  />
                </div>
                
                {/* File/Image Content */}
                {msg.messageType === 'image' && msg.fileData?.url && (
                  <div className="mb-2">
                    <img 
                      src={msg.fileData.url} 
                      alt={msg.fileData.name}
                      className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // Open image in full screen (you can implement a modal here)
                        if (msg.fileData?.url) {
                          window.open(msg.fileData.url, '_blank');
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* File Content */}
                {msg.messageType === 'file' && msg.fileData && (
                  <div className="mb-2 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <File className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{msg.fileData.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(msg.fileData.size)}</p>
                      </div>
                      <ChatButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // Download file (you can implement actual download logic here)
                          console.log('Download file:', msg.fileData?.name);
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
                    {formatTime(msg.timestamp)}
                  </p>
                  {isCurrentUser && (
                    <div className="flex items-center space-x-1">
                      {msg.isRead ? (
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
    const participant = chatRoom.participants.find(p => p.id === typingUser.userId);
    if (!participant) return null;

    return (
      <div key={typingUser.userId} className="flex items-center space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={participant.avatar}
            alt={participant.name}
          />
          <AvatarFallback className="text-xs">
            {getInitials(participant.name)}
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

  const getChatTitle = () => {
    if (chatRoom.isGroup && chatRoom.group) {
      return chatRoom.group.name;
    }
    return chatRoom.participants[0]?.name || "";
  };

  const getChatSubtitle = () => {
    if (chatRoom.isGroup && chatRoom.group) {
      return `${chatRoom.group.participants.length} members`;
    }
    const participant = chatRoom.participants[0];
    if (participant) {
      return (participant.status === "online" && t("online")) ||
             (participant.status === "away" && t("away")) ||
             (participant.status === "offline" && t("offline"));
    }
    return "";
  };

  return (
    <div className="flex flex-col h-full bg-accent border">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b">
        {onBack && (
          <ChatButton
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-border md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </ChatButton>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={chatRoom.isGroup ? chatRoom.group?.avatar : chatRoom.participants[0]?.avatar}
            alt={getChatTitle()}
          />
          <AvatarFallback>
            {chatRoom.isGroup ? (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
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
            {getChatSubtitle()}
          </p>
        </div>
        <ChatButton variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </ChatButton>
      </div>

      {/* Messages */}
      <ChatScrollArea className="flex-1 p-4" ref={scrollRef} onScroll={handleScroll}>
        <div className="space-y-4">
          {chatRoom.messages.map(renderMessage)}
          
          {typingUsers.map(renderTypingIndicator)}
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

          <ChatInput
            placeholder={t("write")}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          
          <ChatButton
            ref={emojiPickerRef}
            variant="ghost"
            size="icon"
            className="cursor-pointer hover:bg-muted"
            onClick={async () => {
              try {
                // If picker is already open, close it
                if (isEmojiPickerOpen && pickerRef.current) {
                  pickerRef.current.hidePicker();
                  setIsEmojiPickerOpen(false);
                  return;
                }

                const module = await import("emoji-button");
                const EmojiButton = module.default;

                if (!pickerRef.current) {
                  pickerRef.current = new EmojiButton({
                    position: "top-end",
                    autoHide: false,
                    theme: "light",
                  });

                  pickerRef.current.on("emoji", (emoji: any) => {
                    setMessage((prev) => prev + emoji);
                    // Keep picker open for multiple emoji selection
                  });

                  // Add event listener for document clicks to hide picker
                  const handleDocumentClick = (event: MouseEvent) => {
                    if (pickerRef.current && emojiPickerRef.current && isEmojiPickerOpen) {
                      const target = event.target as Node;
                      if (!emojiPickerRef.current.contains(target)) {
                        pickerRef.current.hidePicker();
                        setIsEmojiPickerOpen(false);
                      }
                    }
                  };

                  document.addEventListener('click', handleDocumentClick);
                  pickerRef.current._documentClickHandler = handleDocumentClick;
                }

                if (pickerRef.current && emojiPickerRef.current) {
                  pickerRef.current.showPicker(emojiPickerRef.current);
                  setIsEmojiPickerOpen(true);
                }
              } catch (error) {
                console.error('Error initializing emoji picker:', error);
                setIsEmojiPickerOpen(false);
              }
            }}
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
