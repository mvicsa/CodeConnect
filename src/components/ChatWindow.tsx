import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatButton } from "@/components/ui/chat-button";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatScrollArea } from "@/components/ui/chat-scroll-area";
import {Message, TypingIndicator, MessageType, ChatRoomType, User } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Paperclip, Check, CheckCheck, MoreVertical, X, File, Camera, Users, ImageIcon, UserX, Code } from "lucide-react";
import { useTranslations } from "next-intl";
import MessageActions from "./MessageActions";
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { SocketContext } from '@/store/Provider';
import { setError, setSeen } from '@/store/slices/chatSlice';
import { useBlock } from '@/hooks/useBlock';
import { blockUser, unblockUser } from '@/store/slices/blockSlice';
import EmojiMenu from '@/components/ui/emoji-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Img from "next/image";
import MarkdownWithCode from "./MarkdownWithCode";
import { useTheme } from 'next-themes';
import { formatDate, isToday } from "date-fns";
import { uploadToImageKit } from '@/lib/imagekitUpload';
import CodeInputModal from "./chat/CodeInputModal";
import CodeMessage from "./chat/CodeMessage";
import ReactionsMenu from "./ReactionsMenu";
import EditMessageModal from "./chat/EditMessageModal";

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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; name?: string } | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ src: string; name?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageBubbleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const prevActiveRoomId = useRef<string | null>(null);
  const prevMessagesLength = useRef<number>(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserActive, setIsUserActive] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeModalData, setCodeModalData] = useState<{
    code: string;
    language: string;
    originalMessage: Message | null;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  // Handle code message
  const handleCodeMessage = (text: string, code: string, language: string) => {
    if (!activeRoom || !socket) return;
    
    // Check if this is an edit scenario
    if (codeModalData?.originalMessage) {
      const isCurrentUserEditing = codeModalData.originalMessage.sender._id === myUserId;
      
      if (isCurrentUserEditing) {
        // Current user editing their own message - use edit functionality
        const updates: { codeData?: { code: string; language: string }; content?: string } = {
          codeData: {
            code,
            language
          },
          // Include content even if empty to allow clearing message text
          content: (text || '').trim()
        };
        socket.emit('chat:edit_message', {
          roomId: activeRoom._id,
          messageId: codeModalData.originalMessage._id,
          updates
        });
      } else {
        // Other user editing and sending back - create new message
        const messageData = {
          roomId: activeRoom._id,
          type: MessageType.CODE,
          content: text,
          codeData: {
            code,
            language
          },
          replyTo: codeModalData.originalMessage._id
        };

        socket.emit('chat:send_message', messageData);
      }
      
      // Reset modal data
      setCodeModalData(null);
    } else {
      // Regular new code message
      const messageData: { roomId: string; type: MessageType; codeData?: { code: string; language: string }; content?: string; replyTo?: string } = {
        roomId: activeRoom._id,
        type: MessageType.CODE,
        codeData: {
          code,
          language
        },
        replyTo: replyTo?._id || undefined
      };

      // Only include content when non-empty, so backend accepts code-only messages
      if (text && text.trim().length > 0) {
        messageData.content = text.trim();
      }

      socket.emit('chat:send_message', messageData);
    }

    setReplyTo(null);
  };


  // Handle opening code modal for editing and sending back
  const handleOpenCodeModal = (code: string, language: string, originalMessage: Message) => {
    setCodeModalData({
      code,
      language,
      originalMessage
    });
    setIsCodeModalOpen(true);
  };

  // Handle edit message
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setIsEditModalOpen(true);
  };

  // Handle save edit from modal
  const handleSaveEdit = (updates: { content?: string; codeData?: { code: string; language: string } | null; type?: MessageType }) => {
    if (!editingMessage || !socket || !activeRoom) return;

    socket.emit('chat:edit_message', {
      roomId: activeRoom._id,
      messageId: editingMessage._id,
      updates
    });

    setEditingMessage(null);
    setIsEditModalOpen(false);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditingMessage(null);
    setIsEditModalOpen(false);
  };

  // Access chat state
  const myUserId = useSelector((state: RootState) => state.auth.user?._id) || 'current-user';
  const activeRoomId = useSelector((state: RootState) => state.chat.activeRoomId);
  const chatRooms = useSelector((state: RootState) => state.chat.rooms);
  const activeRoom = chatRooms.find(r => r._id === activeRoomId);
  const messages = useSelector(
    (state: RootState) => state.chat.messages[activeRoomId || ''] || [],
    shallowEqual
  );
  const typing = useSelector(
    (state: RootState) => state.chat.typing[activeRoomId || ''] || [],
    shallowEqual
  );
  const userStatuses = useSelector(
    (state: RootState) => state.chat.userStatuses || {},
    shallowEqual
  );

  // Get socket from context
  const socket = useContext(SocketContext);
  const t = useTranslations("chat");
  const dispatch = useDispatch<AppDispatch>();
  const { checkBlockStatus, isBlocked, isBlockedBy } = useBlock();
  const checkBlockStatusRef = useRef(checkBlockStatus);
  const { theme } = useTheme();

  // Block functionality
  const handleBlockUser = async () => {
    if (!activeRoom) return;
    
    const otherMember = activeRoom.members.find((m: User) => m._id !== myUserId);
    if (!otherMember) return;

    setIsBlocking(true);
    try {
      await dispatch(blockUser({ 
        blockedId: otherMember._id, 
        reason: blockReason 
      })).unwrap();
      
      toast.success(`Successfully blocked ${otherMember.firstName}`);
      setBlockDialogOpen(false);
      setBlockReason('');
      setDropdownOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to block user');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!activeRoom) return;
    
    const otherMember = activeRoom.members.find((m: User) => m._id !== myUserId);
    if (!otherMember) return;

    setIsBlocking(true);
    try {
      await dispatch(unblockUser(otherMember._id)).unwrap();
      
      toast.success(`Successfully unblocked ${otherMember.firstName}`);
      setDropdownOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unblock user');
    } finally {
      setIsBlocking(false);
    }
  };

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus;
  }, [checkBlockStatus]);

  // Load initial messages and check block status
  useEffect(() => {
    if (activeRoom?._id && socket) {
      socket.emit('chat:get_messages', { roomId: activeRoom._id, limit: 50 });
      
      // Check block status for other members in private chats
      if (activeRoom.type === ChatRoomType.PRIVATE) {
        const otherMember = activeRoom.members.find((m: User) => m._id !== myUserId);
        if (otherMember) {
          checkBlockStatusRef.current(otherMember._id);
        }
      }
    }
  }, [activeRoom?._id, socket, myUserId, activeRoom?.members, activeRoom?.type]);

  // Update oldest message ID when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const oldestMessage = messages[0]; // Assuming messages are sorted newest to oldest
      setOldestMessageId(oldestMessage._id);
    }
  }, [messages]);

  // Track user activity (mouse movement, clicks, keyboard input)
  useEffect(() => {
    let activityTimeout: NodeJS.Timeout;

    const handleUserActivity = () => {
      setIsUserActive(true);
      
      // Clear previous timeout
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Set user as inactive after 5 minutes of no activity
      activityTimeout = setTimeout(() => {
        setIsUserActive(false);
      }, 5 * 60 * 1000); // 5 minutes
    };

    const handleVisibilityChange = () => {
      setIsUserActive(!document.hidden);
    };

    // Listen for user activity
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, []);

  // Auto-mark messages as seen when user is actively viewing the chat
  useEffect(() => {
    if (!activeRoomId || !socket || !myUserId || !isUserActive) return;

    // Add a small delay to make it more realistic (user needs time to see messages)
    const timeoutId = setTimeout(() => {
      // Get unseen messages for the current user
      const unseenMessages = messages.filter(msg => 
        !msg.seenBy.includes(myUserId) && msg.sender._id !== myUserId
      );

      if (unseenMessages.length > 0) {
        const messageIds = unseenMessages.map(msg => msg._id);
        
        // Emit seen event to server
        socket.emit('chat:seen', { 
          roomId: activeRoomId, 
          messageIds 
        });
        
        // Optimistically update Redux state
        dispatch(setSeen({ 
          roomId: activeRoomId, 
          seen: messageIds, 
          userId: myUserId,
          currentUserId: myUserId 
        }));
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [activeRoomId, messages, socket, myUserId, dispatch, isUserActive]);

  // Message reaction events are now handled in the Provider

  // Track scroll position to update shouldAutoScroll
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    setShouldAutoScroll(element.scrollHeight - (element.scrollTop + element.clientHeight) < 100);
    
    const isNearTop = element.scrollTop < 100;
    const shouldLoadMore = !isLoadingMore && isNearTop;

    if (shouldLoadMore && socket && activeRoom) {
      setIsLoadingMore(true);
      socket.emit('chat:get_messages', {
        roomId: activeRoom._id,
        limit: 50,
        before: oldestMessageId
      });
    }

    // Update scroll to bottom button visibility
    const isAtBottom = element.scrollHeight - (element.scrollTop + element.clientHeight) < 100;
    setShowScrollToBottom(!isAtBottom);

    // Mark messages as seen when user scrolls to bottom
    if (isAtBottom && socket && activeRoomId && myUserId) {
      const unseenMessages = messages.filter(msg => 
        !msg.seenBy.includes(myUserId) && msg.sender._id !== myUserId
      );

      if (unseenMessages.length > 0) {
        const messageIds = unseenMessages.map(msg => msg._id);
        
        // Emit seen event to server
        socket.emit('chat:seen', { 
          roomId: activeRoomId, 
          messageIds 
        });
        
        // Optimistically update Redux state
        dispatch(setSeen({ 
          roomId: activeRoomId, 
          seen: messageIds, 
          userId: myUserId,
          currentUserId: myUserId 
        }));
      }
    }
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

  // Smoothly scroll to a message by id and highlight its bubble briefly
  const scrollToMessageById = (messageId: string) => {
    const containerEl = messageRefs.current[messageId];
    const bubbleEl = messageBubbleRefs.current[messageId];
    if (containerEl) {
      containerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (bubbleEl) {
      bubbleEl.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'bg-primary/10');
      setTimeout(() => {
        bubbleEl.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'bg-primary/10');
      }, 1400);
    }
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
          type: MessageType.TEXT,
          replyTo: replyTo?._id,
        };
        try {
          setMessage("");
          setReplyTo(null);
          handleTypingStatus(false);

          socket.emit('chat:send_message', msg);
        } catch (error) {
          dispatch(setError('Failed to send message'));
          console.log(error)
        }
      }
    }
  };

  const handleTypingStatus = (isTyping: boolean) => {
    if (!activeRoom || !activeRoom._id) {
      return;
    }
    if (socket) {
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
    // Validate file size (max 50MB like WhatsApp)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 50MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images and videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
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

  const sendFile = async () => {
    if (!activeRoom || !selectedFile || !socket) return;
    
    try {
      // Show uploading state
      setIsUploading(true);
      toast.info('Uploading file...');
      
      let messageType = MessageType.FILE;
      let content = `📎 ${selectedFile.name}`;
      
      if (selectedFile.type.startsWith('image/')) {
        messageType = MessageType.IMAGE;
        content = `📷 ${selectedFile.name}`;
      } else if (selectedFile.type.startsWith('video/')) {
        messageType = MessageType.VIDEO;
        content = `🎥 ${selectedFile.name}`;
      } else if (selectedFile.type.startsWith('audio/')) {
        messageType = MessageType.AUDIO;
        content = `🎵 ${selectedFile.name}`;
      }
      
             // Upload file to ImageKit first
       const fileUrl = await uploadToImageKit(selectedFile, '/chat', (percent: number) => {
         setUploadProgress(percent);
       });
      
      const fileData = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: fileUrl,
      };
      
      const msg = {
        roomId: activeRoom._id,
        content,
        type: messageType,
        fileUrl: fileUrl, // Use the real uploaded file URL
        replyTo: replyTo?._id,
        fileData,
      };
      
      socket.emit('chat:send_message', msg);
      removeSelectedFile();
      setReplyTo(null);
      toast.success('File sent successfully!');
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file. Please try again.');
         } finally {
       setIsUploading(false);
       setUploadProgress(0);
     }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Image modal functions
  const openImageModal = (src: string, alt: string, name?: string) => {
    setSelectedImage({ src, alt, name });
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

     const downloadImage = useCallback(async () => {
     if (!selectedImage) return;
     
     try {
       const response = await fetch(selectedImage.src);
       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = selectedImage.name || 'image.jpg';
       document.body.appendChild(a);
       a.click();
       window.URL.revokeObjectURL(url);
       document.body.removeChild(a);
       toast.success('Image downloaded successfully!');
     } catch {
       toast.error('Failed to download image');
     }
   }, [selectedImage]);

   // Video modal functions
   const openVideoModal = (src: string, name?: string) => {
     setSelectedVideo({ src, name });
     setVideoModalOpen(true);
   };

   const closeVideoModal = () => {
     setVideoModalOpen(false);
     setSelectedVideo(null);
   };

   const downloadVideo = useCallback(async () => {
     if (!selectedVideo) return;
     
     try {
       const response = await fetch(selectedVideo.src);
       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = selectedVideo.name || 'video.mp4';
       document.body.appendChild(a);
       a.click();
       window.URL.revokeObjectURL(url);
       document.body.removeChild(a);
       toast.success('Video downloaded successfully!');
     } catch {
       toast.error('Failed to download video');
     }
   }, [selectedVideo]);

   // Keyboard shortcuts for image and video modals
   useEffect(() => {
     const handleKeyDown = (event: KeyboardEvent) => {
       if (imageModalOpen) {
         if (event.key === 'Escape') {
           closeImageModal();
         } else if (event.key === 'd' || event.key === 'D') {
           downloadImage();
         }
       } else if (videoModalOpen) {
         if (event.key === 'Escape') {
           closeVideoModal();
         } else if (event.key === 'd' || event.key === 'D') {
           downloadVideo();
         }
       }
     };

     document.addEventListener('keydown', handleKeyDown);
     return () => {
       document.removeEventListener('keydown', handleKeyDown);
     };
   }, [imageModalOpen, videoModalOpen, downloadImage, downloadVideo]);

  // const formatTime = (date: Date) => {
  //   return new Intl.DateTimeFormat("en-US", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   }).format(date);
  // };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

  const handleDeleteMessage = (messageId: string) => {
    if (socket && activeRoom) {
      socket.emit('chat:delete_message', { roomId: activeRoom._id, messageId, forAll: false });
    }
  };

  const renderMessage = (msg: Message) => {
    if (!activeRoom) return null;
    const isCurrentUser = msg.sender._id === myUserId;
    const senderName = `${msg.sender.firstName} ${msg.sender.lastName}`;
    // Real-time seen logic: show double check if any user other than sender has seen the message
    const isSeenByOther = msg.seenBy.some(uid => uid !== myUserId);
    
    // Check if sender is blocked
    const senderIsBlocked = isBlocked(msg.sender._id);
    const senderIsBlockedBy = isBlockedBy(msg.sender._id);
    
    // Don't show messages from blocked users
    if (senderIsBlocked || senderIsBlockedBy) {
      return null;
    }
    
    // Handle deleted messages
    if (msg.deleted || (msg.deletedFor && msg.deletedFor.includes(myUserId as string))) {
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
              "rounded-lg relative group p-3",
              "bg-accent text-muted-foreground italic"
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
        ref={(el) => { messageRefs.current[msg._id] = el; }}
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
        
        <div className={`flex flex-col max-w-xs ${msg.type === MessageType.IMAGE || msg.type === MessageType.VIDEO || msg.type === MessageType.CODE ? 'lg:min-w-[320px]' : 'lg:max-w-md'} relative`}>
          {activeRoom.type === ChatRoomType.GROUP && !isCurrentUser && (
            <p className="text-xs text-muted-foreground mb-1 px-1">
              {senderName}
            </p>
          )}
          
          <div
            className={cn(
              "rounded-lg rounded-ee-none relative group mb-1",
              isCurrentUser
                ? "bg-primary/70 text-white"
                : "bg-accent dark:bg-card text-accent-foreground rounded-ee-lg rounded-es-none"
            )}
            ref={(el) => { messageBubbleRefs.current[msg._id] = el; }}
          >
            {msg.replyTo && (
              <div
                className={cn(
                  "text-xs p-3.5 bg-accent rounded-t-md cursor-pointer hover:bg-accent/80 transition-colors"
                )}
                onClick={() => msg.replyTo && scrollToMessageById(msg.replyTo._id)}
                title="Go to original message"
                role="button"
              >
                <p className="font-medium text-accent-foreground">
                  Replying to <span className="text-primary">
                    {msg.replyTo.sender._id === myUserId ? "you" : `${msg.replyTo.sender.firstName} ${msg.replyTo.sender.lastName}`}
                  </span>
                </p>
                <div className={cn(
                  "opacity-70 truncate mt-2",
                  isCurrentUser ? "text-secondary-foreground mt-1" : "text-gray-400"
                )}>
                  <MarkdownWithCode 
                    content={msg.replyTo.content || msg.replyTo.codeData?.code || ''} 
                    maxLength={10000}
                    theme={theme === 'dark' ? 'dark' : 'light'} 
                  />
                </div>
              </div>
            )}
            
            <div className={`${msg.type === MessageType.VIDEO ? 'px-1 py-1' : 'p-3.5 pb-4.5'} relative`}>
              <div className={`absolute ${msg.type === MessageType.VIDEO ? 'top-2 right-2' : 'top-1 right-1'} z-10`}>
                <MessageActions
                  message={msg}
                  onReply={(message) => setReplyTo(message)}
                  onCopy={() => {}}
                  onDelete={isCurrentUser ? handleDeleteMessage : undefined}
                  onEdit={isCurrentUser ? handleEditMessage : undefined}
                  isCurrentUser={isCurrentUser}
                />
              </div>
              
              {/* File/Image Content */}
              {msg.type === MessageType.IMAGE && msg.fileUrl && (
                <div className="">
                  <Img 
                    alt="Image"
                    src={msg.fileUrl || 'image'} 
                    width={400}
                    height={300}
                    className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (msg.fileUrl) {
                        openImageModal(msg.fileUrl, 'Image', msg.fileData?.name);
                      }
                    }}
                  />
                </div>
              )}
              
                {/* Video Content - Fixed and Simplified */}
                {msg.type === MessageType.VIDEO && msg.fileUrl && (
                  <div className="mb-2 mt-6">
                    <div className="relative max-w-full max-h-64 rounded-lg overflow-hidden bg-black cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300">
                     <video 
                       src={msg.fileUrl} 
                       className="w-full h-64 object-cover custom-video-controls group-hover:scale-[1.02] transition-transform duration-300"
                       preload="metadata"
                       muted
                       controls
                       style={{ minHeight: '256px' }}
                       onError={(e) => {
                         console.error('Video error:', e);
                         // Show fallback content if video fails to load
                         const videoElement = e.currentTarget;
                         videoElement.style.display = 'none';
                         const fallback = videoElement.parentElement?.querySelector('.video-fallback');
                         if (fallback) {
                           (fallback as HTMLElement).style.display = 'flex';
                         }
                       }}
                     />
                    
                    {/* Fallback content if video fails to load */}
                    <div className="video-fallback hidden absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                        <p className="text-sm">Video failed to load</p>
                        <p className="text-xs text-gray-300 mt-1">Click to open in modal</p>
                      </div>
                    </div>
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    {/* Click to open modal */}
                    <div 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => openVideoModal(msg.fileUrl!, msg.fileData?.name)}
                    />
                  </div>
                </div>
              )}

               {/* Audio Content */}
               {msg.type === MessageType.AUDIO && msg.fileUrl && (
                 <div className="mb-2 p-3 bg-muted/50 rounded-lg border">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                       <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                       </svg>
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium truncate">Audio Message</p>
                       <p className="text-xs text-muted-foreground">
                         {msg.fileData?.name || 'Audio file'}
                       </p>
                     </div>
                     <audio 
                       src={msg.fileUrl} 
                       controls 
                       className="h-8"
                       preload="metadata"
                     />
                   </div>
                 </div>
               )}
               
               {/* File Content */}
               {msg.type === MessageType.FILE && msg.fileUrl && (
                 <div className="mb-2 p-3 bg-muted/50 rounded-lg border">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                       <File className="h-6 w-6 text-green-600" />
                     </div>
                     <div className="flex-1 min-w-0">
                                               <p className="text-sm font-medium truncate">
                          {msg.fileData?.name || msg.content || 'File Attachment'}
                        </p>
                       {msg.fileData?.size && (
                         <p className="text-xs text-muted-foreground">
                           {formatFileSize(msg.fileData.size)}
                         </p>
                       )}
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
               {msg.type === MessageType.TEXT && (
                 <div className="text-sm">
                   <MarkdownWithCode 
                     content={msg.content} 
                     maxLength={10000}
                     theme={theme === 'dark' ? 'dark' : 'light'} 
                   />
                 </div>
               )}

               {/* Code Content */}
               {msg.type === MessageType.CODE && (
                 <div className="text-sm">
                   <CodeMessage
                     message={msg}
                     isCurrentUser={isCurrentUser}
                     onOpenCodeModal={handleOpenCodeModal}
                   />
                 </div>
               )}
               
              {/* Message Reactions (ReactionsMenu) */}
              <div className={`flex items-center gap-2 mt-2 px-1 group absolute -bottom-3 start-2 bg-accent rounded-lg ${msg.userReactions?.length === 0 && "p-1"}`}>
                <ReactionsMenu
                  size="sm"
                  messageId={msg._id}
                  roomId={activeRoom?._id || ''}
                  roomMembers={activeRoom?.members || []}
                  reactions={{
                    like: msg.reactions?.like || 0,
                    love: msg.reactions?.love || 0,
                    wow: msg.reactions?.wow || 0,
                    funny: msg.reactions?.funny || 0,
                    dislike: msg.reactions?.dislike || 0,
                    happy: msg.reactions?.happy || 0,
                  }}
                  userReactions={msg.userReactions || []}
                  currentUserId={myUserId}
                />
              </div>
               
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <p
                    className={cn(
                      "text-xs",
                      isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {isToday(msg.createdAt) ? formatDate(new Date(msg.createdAt), 'hh:mm a') : formatDate(new Date(msg.createdAt), 'E, MMM d, yyyy - hh:mm a')}  { msg.edited && '- Edited'}
                  </p>
                </div>
                {isCurrentUser && (
                  <div className="flex items-center space-x-1 ms-2">
                    {isSeenByOther ? (
                      <CheckCheck className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Check className="h-4 w-4 text-primary-foreground" />
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
        <div className="bg-accent rounded-lg p-3">
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

  // Helper to scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Auto-scroll when messages or typing indicators change, if user is near bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
    // eslint-disable-next-line
  }, [messages, typing]);

  return (
    <div className="flex flex-col h-full bg-card border">
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
          <p className="text-sm">
            {activeRoom?.type === ChatRoomType.GROUP 
              ? `${activeRoom.members.length} members` 
              : (() => {
                  const otherMember = activeRoom?.members?.find((m: User) => m._id !== myUserId);
                  const status = otherMember ? userStatuses[otherMember._id] || 'offline' : 'offline';
                  const otherMemberIsBlocked = otherMember ? isBlocked(otherMember._id) : false;
                  const otherMemberIsBlockedBy = otherMember ? isBlockedBy(otherMember._id) : false;
                  
                  // Don't show status for blocked users
                  if (otherMemberIsBlocked || otherMemberIsBlockedBy) {
                    return null;
                  }
                  
                  return (
                    <span
                      className={
                        'inline-block px-2 py-0.5 rounded-full text-xs font-semibold ' +
                        (status === 'online'
                          ? 'bg-primary text-white'
                          : 'bg-red-500 text-white')
                      }
                    >
                      {status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  );
                })()}
          </p>
        </div>
        {activeRoom?.type === ChatRoomType.PRIVATE && (() => {
          const otherMember = activeRoom?.members?.find((m: User) => m._id !== myUserId);
          if (!otherMember) {
            return (
              <ChatButton variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </ChatButton>
            );
          }

          const isOtherMemberBlocked = isBlocked(otherMember._id);
          // const isOtherMemberBlockedBy = isBlockedBy(otherMember._id);

          return (
            <>
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <ChatButton variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </ChatButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOtherMemberBlocked ? (
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={handleUnblockUser}
                      disabled={isBlocking}
                    >
                      {isBlocking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      Unblock User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        setDropdownOpen(false);
                        setBlockDialogOpen(true);
                      }}
                    >
                      <UserX className="h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Block Dialog */}
              <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Block User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to block {otherMember.firstName} {otherMember.lastName}? 
                      You won&apos;t see their posts or receive messages from them.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="block-reason" className="text-sm font-medium mb-2">
                        Reason (optional)
                      </Label>
                      <Textarea
                        id="block-reason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Why are you blocking this user?"
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      onClick={() => {
                        setBlockDialogOpen(false);
                        setBlockReason('');
                      }}
                      disabled={isBlocking}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleBlockUser} 
                      disabled={isBlocking}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isBlocking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Blocking...
                        </>
                      ) : (
                        'Block User'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          );
        })()}
      </div>

      {/* Messages */}
      <ChatScrollArea 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 p-4 pb-5 bg-background"
        style={{ 
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
        <div className="p-3 bg-card border-t">
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

             {/* File Preview - WhatsApp Style */}
       {selectedFile && (
         <div className="p-4 bg-muted/50 border-t">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               {filePreview ? (
                 <div className="relative">
                   {selectedFile.type.startsWith('video/') ? (
                     <div className="w-16 h-16 bg-black rounded-lg border overflow-hidden relative">
                       <video 
                         src={filePreview} 
                         className="w-full h-full object-cover"
                         muted
                         preload="metadata"
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                           <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M8 5v14l11-7z"/>
                           </svg>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <Img 
                       src={filePreview} 
                       alt="Preview" 
                       className="w-16 h-16 object-cover rounded-lg border"
                       width={64}
                       height={64}
                     />
                   )}
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
                     {selectedFile.type.startsWith('video/') ? (
                       <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                       </svg>
                     ) : selectedFile.type.startsWith('audio/') ? (
                       <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                       </svg>
                     ) : (
                       <File className="h-8 w-8 text-primary" />
                     )}
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
                  <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedFile.type.split('/')[0]} file
                  </p>
                    {isUploading && (
                     <div className="mt-2">
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1">
                         Uploading... {uploadProgress}%
                       </p>
                     </div>
                   )}
                </div>
             </div>
           </div>
         </div>
       )}

      {/* Message Input */}
      {(() => {
        // Check if current user is blocked in this chat
        const isChatBlocked = activeRoom?.type === ChatRoomType.PRIVATE && (() => {
          const otherMember = activeRoom?.members?.find((m: User) => m._id !== myUserId);
          if (otherMember) {
            const otherMemberIsBlocked = isBlocked(otherMember._id);
            const otherMemberIsBlockedBy = isBlockedBy(otherMember._id);
            return otherMemberIsBlocked || otherMemberIsBlockedBy;
          }
          return false;
        })();

        if (isChatBlocked) {
          const otherMember = activeRoom?.members?.find((m: User) => m._id !== myUserId);
          const otherMemberIsBlocked = otherMember ? isBlocked(otherMember._id) : false;
          // const otherMemberIsBlockedBy = otherMember ? isBlockedBy(otherMember._id) : false;
          const message = otherMemberIsBlocked 
            ? `You have blocked ${otherMember?.firstName || 'this user'}. Messages are disabled.`
            : `${otherMember?.firstName || 'This user'} has blocked you. Messages are disabled.`;

          return (
            <div className="p-4 border-t bg-muted/50">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">{message}</p>
              </div>
            </div>
          );
        }

        return (
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
            
            {/* File Upload Menu - WhatsApp Style */}
             {isFileMenuOpen && (
               <div data-file-menu className="absolute bottom-full left-0 mb-2 bg-background border rounded-xl shadow-xl p-3 z-50 min-w-[220px]">
                 <div className="space-y-2">
                   {/* Photo & Video */}
                   <button
                     onClick={() => {
                       fileInputRef.current?.click();
                       setIsFileMenuOpen(false);
                     }}
                     className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                   >
                     <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                       <ImageIcon className="h-5 w-5 text-blue-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium">Photo & Video</p>
                       <p className="text-xs text-muted-foreground">Share photos and videos</p>
                     </div>
                   </button>

                   {/* Document */}
                   <button
                     onClick={() => {
                       fileInputRef.current?.click();
                       setIsFileMenuOpen(false);
                     }}
                     className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                   >
                     <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                       <File className="h-5 w-5 text-green-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium">Document</p>
                       <p className="text-xs text-muted-foreground">Share files and documents</p>
                     </div>
                   </button>

                   {/* Camera */}
                   <button
                     onClick={() => {
                       cameraInputRef.current?.click();
                       setIsFileMenuOpen(false);
                     }}
                     className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                   >
                     <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                       <Camera className="h-5 w-5 text-purple-600" />
                     </div>
                     <div>
                       <p className="text-sm font-medium">Camera</p>
                       <p className="text-xs text-muted-foreground">Take a photo</p>
                     </div>
                   </button>
                 </div>
               </div>
             )}
          </div>

          {/* Hidden File Inputs */}
                     <input
             ref={fileInputRef}
             type="file"
             accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp3,.mp4,.avi,.mov,.wav,.ogg"
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
          
          <EmojiMenu
            onEmojiSelect={handleEmojiSelect}
            position="top"
            align="end"
          />

          {/* Code Button */}
          <ChatButton
            variant="ghost"
            size="icon"
            onClick={() => setIsCodeModalOpen(true)}
            className="h-8 w-8 hover:bg-accent"
            title="Send Code"
          >
            <Code className="h-4 w-4" />
          </ChatButton>

          <ChatButton
             onClick={handleSendMessage}
             disabled={(!message.trim() && !selectedFile) || isUploading}
             className="bg-primary hover:bg-primary/90 cursor-pointer"
           >
             {isUploading ? (
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
             ) : (
               <Send className="h-4 w-4" />
             )}
           </ChatButton>
        </div>
      </div>
                 );
       })()}

             {/* Image Modal - WhatsApp Style */}
       <AlertDialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
         <AlertDialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
           {/* Hidden title for accessibility */}
           <AlertDialogTitle className="sr-only">
             {selectedImage?.name || 'Image Viewer'}
           </AlertDialogTitle>
           
           <div className="relative">
             {/* Header with close button and download */}
             <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
               <ChatButton
                 variant="outline"
                 size="icon"
                 onClick={downloadImage}
                 className="h-10 w-10 bg-black/20 hover:bg-black/40 text-white border-white/20 cursor-pointer text-primary"
                 title="Download Image"
                 aria-label="Download image"
               >
                 <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
               </ChatButton>
               <ChatButton
                 variant="outline"
                 size="icon"
                 onClick={closeImageModal}
                 className="h-10 w-10 bg-black/20 hover:bg-black/40 text-white border-white/20 cursor-pointer text-red-500"
                 title="Close"
                 aria-label="Close image viewer"
               >
                 <X className="h-5 w-5" />
               </ChatButton>
             </div>

             {/* Image */}
             {selectedImage && (
               <div className="relative w-full h-full min-h-[60vh] bg-black">
                 <Img
                   src={selectedImage.src}
                   alt={selectedImage.alt}
                   className="w-full h-full object-contain"
                   width={1200}
                   height={800}
                   priority
                 />
               </div>
             )}
           </div>
         </AlertDialogContent>
       </AlertDialog>

       {/* Video Modal - WhatsApp Style */}
       <AlertDialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
         <AlertDialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
           {/* Hidden title for accessibility */}
           <AlertDialogTitle className="sr-only">
             {selectedVideo?.name || 'Video Viewer'}
           </AlertDialogTitle>
           
           <div className="relative">
             {/* Header with close button and download */}
             <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
               <ChatButton
                 variant="outline"
                 size="icon"
                 onClick={downloadVideo}
                 className="h-10 w-10 bg-black/20 hover:bg-black/40 text-white border-white/20 cursor-pointer text-primary"
                 title="Download Video"
                 aria-label="Download video"
               >
                 <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
               </ChatButton>
               <ChatButton
                 variant="outline"
                 size="icon"
                 onClick={closeVideoModal}
                 className="h-10 w-10 bg-black/20 hover:bg-black/40 text-white border-white/20 cursor-pointer text-red-500"
                 title="Close"
                 aria-label="Close video viewer"
               >
                 <X className="h-5 w-5" />
               </ChatButton>
             </div>

             {/* Video */}
             {selectedVideo && (
               <div className="relative w-full h-full min-h-[60vh] bg-black">
                 <video
                   src={selectedVideo.src}
                   className="w-full h-full object-contain custom-video-controls rounded-lg shadow-2xl"
                   controls
                   autoPlay
                   preload="metadata"
                   controlsList="nodownload"
                 />
                 
              
               </div>
             )}
           </div>
         </AlertDialogContent>
       </AlertDialog>

       {/* Code Input Modal */}
       <CodeInputModal
         isOpen={isCodeModalOpen}
         onClose={() => {
           setIsCodeModalOpen(false)
           setCodeModalData(null)
         }}
         onSend={handleCodeMessage}
         replyTo={replyTo || undefined}
         initialCode={codeModalData?.code}
         initialLanguage={codeModalData?.language}
         initialText={codeModalData?.originalMessage?.content || ''}
       />

       {/* Edit Message Modal */}
       <EditMessageModal
         isOpen={isEditModalOpen}
         onClose={handleCloseEditModal}
         onSave={handleSaveEdit}
         message={editingMessage}
       />
     </div>
   );
 };

export default ChatWindow;
