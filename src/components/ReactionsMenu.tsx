'use client';

import { useState, useRef, useContext } from "react";
import { useReactions } from "../hooks/useReactions";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { UserReaction } from '@/types/post';
import type { User } from '@/types/chat';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { updateMessageReactions as updateChatMessageReactions } from '@/store/slices/chatSlice';
import { useNotifications } from '@/hooks/useNotifications';
import { removeNotificationsByCriteria } from '@/store/slices/notificationsSlice';
import { SocketContext } from '@/store/Provider';
import { useBlock } from '@/hooks/useBlock';
import Link from "next/link";

// Map your existing reaction images to the database structure
const reactionImageMap = {
  like: "/reactions/like.png",
  love: "/reactions/love.png",
  wow: "/reactions/wow.png",
  happy: "/reactions/happy.png",
  funny: "/reactions/funny.png",
  dislike: "/reactions/dislike.png",
};

interface ReactionsMenuProps {
  size?: "sm" | "md";
  postId?: string;
  commentId?: string;
  messageId?: string; // For chat messages
  roomId?: string; // For chat socket emission
  parentCommentId?: number | string; // For replies
  replyId?: number | string; // For replies
  reactions?: {
    like: number;
    love: number;
    wow: number;
    funny: number;
    dislike: number;
    happy: number;
  };
  userReactions?: UserReaction[];
  currentUserId?: string; // Should be the user's _id from backend
  roomMembers?: User[]; // For chat: enrich reaction users when userId is string
}

export default function ReactionsMenu({ 
  size = "md",
  postId,
  commentId,
  messageId,
  roomId,
  parentCommentId,
  replyId,
  reactions = { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
  userReactions = [],
  currentUserId,
  roomMembers = []
}: ReactionsMenuProps) {
  const { 
    handlePostReaction, 
    handleCommentReaction,
    handleReplyReaction
  } = useReactions();
  
  const [open, setOpen] = useState(false);
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const lastReactionRef = useRef<{ postId?: string; commentId?: string; messageId?: string; replyId?: string | number; reaction: string; timestamp: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const { handleDeleteReactionNotification } = useNotifications();
  const dispatch = useDispatch();
  const socket = useContext(SocketContext);
  const { isBlocked, loading: blockLoading } = useBlock();

  // Helpers to support both string and object userId forms
  const getReactionUserId = (ur: UserReaction) => {
    const possibleUserId = ur?.userId as User;
    if (!possibleUserId) return null;
    if (typeof possibleUserId === 'string') return possibleUserId;
    return possibleUserId._id ?? null;
  };

  // const safeGet = (obj: any, path: string[], fallback: any = undefined) => {
  //   try {
  //     return path.reduce((acc: any, key: string) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
  //   } catch {
  //     return fallback;
  //   }
  // };

  const effectiveCurrentUserId = currentUserId || user?._id || null;

  // Resolve reaction user meta (handles string userId using roomMembers)
  const resolveReactionUser = (reaction: UserReaction) => {
    const possibleUserId = reaction?.userId as User;
    if (!possibleUserId) {
      return { _id: '', firstName: '', lastName: '', username: '', avatar: '' };
    }
    if (typeof possibleUserId === 'string') {
      const member = roomMembers.find(m => m._id === possibleUserId);
      if (member) return member;
      return { _id: possibleUserId, firstName: '', lastName: '', username: '', avatar: '' };
    }
    return {
      _id: possibleUserId._id || '',
      firstName: possibleUserId.firstName || '',
      lastName: possibleUserId.lastName || '',
      username: possibleUserId.username || '',
      avatar: possibleUserId.avatar || ''
    } as User;
  };

  // Get current user's reaction
  const currentUserReaction = userReactions.find((ur) => {
    if (messageId) {
      return getReactionUserId(ur) === effectiveCurrentUserId;
    }
    return (ur as UserReaction)?.userId?._id === user?._id;
  });
  const currentUserReactionType = currentUserReaction?.reaction || null;
  const selectedReaction = currentUserReactionType ? reactionImageMap[currentUserReactionType as keyof typeof reactionImageMap] : null;

  // Only use reaction types that exist in the reactions object
  const reactionTypeList = Object.keys(reactions).filter(rt => rt in reactionImageMap) as (keyof typeof reactionImageMap)[];
  
  // Group users by reaction type - filter out blocked users
  const usersByReaction: Record<keyof typeof reactionImageMap, typeof userReactions> = {
    like: [], love: [], wow: [], funny: [], dislike: [], happy: []
  };
  
  // Filter out blocked users from reactions
  const filteredUserReactions = userReactions.filter(u => {
    // For chat messages: while block status is loading, don't hide users
    if (messageId && blockLoading) return true;
    if (messageId) {
      const uid = getReactionUserId(u);
      if (!uid) return false;
      return !isBlocked(uid);
    }
    // Posts/Comments: existing behavior
    if (blockLoading) return false;
    const objId = (u as UserReaction)?.userId?._id;
    if (!objId) return false;
    return !isBlocked(objId);
  });
  
  reactionTypeList.forEach((rt) => {
    usersByReaction[rt] = filteredUserReactions.filter(u => u.reaction === rt);
  });
  
  // All users (for All tab) - filter out blocked users
  const allUsers = filteredUserReactions;
  // Calculate total reactions (after filtering blocked users)
  const totalReactions = allUsers.length;

  const handleSelectReaction = async (reactionName: string) => {
    const actingUserId = messageId ? effectiveCurrentUserId : currentUserId;
    if (!actingUserId || isReactionLoading) return;

    // Debug: Check if user already has this reaction
    const currentReaction = userReactions.find(ur => {
      if (messageId) {
        return getReactionUserId(ur) === actingUserId;
      }
      return (ur as UserReaction)?.userId?._id === actingUserId;
    });
    const isRemoving = currentReaction?.reaction === reactionName;

    // Prevent duplicate rapid clicks
    const now = Date.now();
    const lastReaction = lastReactionRef.current;
    const isDuplicate = lastReaction && 
      lastReaction.postId === postId &&
      lastReaction.commentId === commentId &&
      lastReaction.messageId === messageId &&
      lastReaction.replyId === replyId &&
      lastReaction.reaction === reactionName &&
      (now - lastReaction.timestamp) < 1000; // 1 second debounce

    if (isDuplicate) {
      console.log('🚫 Duplicate reaction prevented:', { reactionName, postId, commentId, messageId, replyId });
      return;
    }

    // Store this reaction attempt
    lastReactionRef.current = {
      postId,
      commentId,
      messageId,
      replyId,
      reaction: reactionName,
      timestamp: now
    };

    setIsReactionLoading(true);
    try {
      let result;
      if (postId) {
        result = await handlePostReaction(postId, reactionName);
        if (isRemoving && result?.success) {
          dispatch(removeNotificationsByCriteria({
            type: 'POST_REACTION',
            postId: postId,
            fromUserId: actingUserId,
            reactionType: reactionName // Match comment logic
          }));
          
          // إرسال حدث لحذف الإشعار
          if (socket) {
            socket.emit('notification:delete', {
              type: 'POST_REACTION',
              postId: postId,
              fromUserId: actingUserId,
              reactionType: reactionName, // Match comment logic
              forceRefresh: true
            });
          }
          // استدعاء الدالة القديمة أيضًا للتوافق
          handleDeleteReactionNotification(postId, 'POST_REACTION', actingUserId, reactionName);
        }
      } else if (messageId) {
        console.log('🎯 Handling message reaction (socket-only):', { roomId, messageId, reactionName });
        // For chat messages, use WebSocket only to avoid double-toggle (add then remove)
        if (socket && roomId) {
          socket.emit('chat:react_message', { roomId, messageId, reaction: reactionName });
        }
        // Optimistic UI update to reflect reaction immediately
        try {
          if (roomId) {
            const currentCounts = { ...reactions };
            const existing = userReactions.find(ur => getReactionUserId(ur) === actingUserId);
            const nextUserReactions = [...userReactions];

            if (existing) {
              if (existing.reaction === reactionName) {
                currentCounts[reactionName as keyof typeof currentCounts] = Math.max(0, (currentCounts[reactionName as keyof typeof currentCounts] || 0) - 1);
                const idx = nextUserReactions.findIndex(ur => getReactionUserId(ur) === actingUserId);
                if (idx !== -1) nextUserReactions.splice(idx, 1);
              } else {
                currentCounts[existing.reaction as keyof typeof currentCounts] = Math.max(0, (currentCounts[existing.reaction as keyof typeof currentCounts] || 0) - 1);
                currentCounts[reactionName as keyof typeof currentCounts] = (currentCounts[reactionName as keyof typeof currentCounts] || 0) + 1;
                const idx = nextUserReactions.findIndex(ur => getReactionUserId(ur) === actingUserId);
                if (idx !== -1) nextUserReactions[idx] = { ...nextUserReactions[idx], userId: actingUserId as any, reaction: reactionName } as any;
              }
            } else {
              currentCounts[reactionName as keyof typeof currentCounts] = (currentCounts[reactionName as keyof typeof currentCounts] || 0) + 1;
              nextUserReactions.push({ userId: actingUserId as any, reaction: reactionName } as any);
            }

            dispatch(updateChatMessageReactions({ roomId, messageId, reactions: currentCounts as any, userReactions: nextUserReactions as any }));
          }
        } catch (e) {
          console.warn('Optimistic reaction update failed:', e);
        }
        // No REST call here; Provider listens to socket and updates Redux/state
        result = { success: true } as { success: boolean };
      } else if (commentId && !replyId) {
        result = await handleCommentReaction(commentId, reactionName);
        if (isRemoving && result?.success) {
          // تحديث حالة الإشعارات مباشرة في الفرونت إند
          dispatch(removeNotificationsByCriteria({
            type: 'COMMENT_REACTION',
            commentId: commentId,
            fromUserId: actingUserId,
            reactionType: reactionName
          }));
          
          // إرسال حدث لحذف الإشعار
          if (socket) {
            socket.emit('notification:delete', {
              type: 'COMMENT_REACTION',
              commentId: commentId,
              fromUserId: actingUserId,
              reactionType: reactionName,
              forceRefresh: true
            });
          }
          
          // استدعاء الدالة القديمة أيضًا للتوافق
          handleDeleteReactionNotification(commentId, 'COMMENT_REACTION', actingUserId, reactionName);
        }
      } else if (replyId && parentCommentId) {
        result = await handleReplyReaction(
          String(parentCommentId), 
          String(replyId), 
          reactionName
        );
        if (isRemoving && result?.success) {
          // تحديث حالة الإشعارات مباشرة في الفرونت إند
          dispatch(removeNotificationsByCriteria({
            type: 'COMMENT_REACTION',
            commentId: String(replyId),
            fromUserId: actingUserId,
            reactionType: reactionName
          }));
          
          // إرسال حدث لحذف الإشعار
          if (socket) {
            socket.emit('notification:delete', {
              type: 'COMMENT_REACTION',
              commentId: String(replyId),
              fromUserId: actingUserId,
              reactionType: reactionName,
              forceRefresh: true
            });
          }
          
          // استدعاء الدالة القديمة أيضًا للتوافق
          handleDeleteReactionNotification(String(replyId), 'COMMENT_REACTION', actingUserId, reactionName);
        }
      }

      console.log('📊 Reaction result:', result);

      if (result?.success) {
        console.log('✅ Reaction successful, closing popover');
        setOpen(false);
      } else {
        console.log('❌ Reaction failed:', result);
      }
    } catch (error) {
      console.error('💥 Failed to add reaction:', error);
    } finally {
      setIsReactionLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Reaction Button */}
      { user ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className={`w-${size === "sm" ? "4" : "5"} h-${size === "sm" ? "4" : "5"} cursor-pointer flex items-center justify-center ${isReactionLoading ? 'opacity-50' : ''}`}>
              {/* if user is logged in and has a reaction, show the reaction button */}
              {selectedReaction ? (
                <Image
                  src={selectedReaction}
                  alt={currentUserReactionType || "reaction"}
                  width={30}
                  height={30}
                />
              ) : (
                <Heart className={`size-${size === "sm" ? "4" : "5"} text-muted-foreground hover:text-foreground transition-colors`} />
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border p-2 flex items-center gap-2 rounded-full"
            align="start"
            side="top"
          >
            {Object.entries(reactionImageMap).map(([reactionName, imageSrc]) => (
              <button
                key={reactionName}
                onClick={() => handleSelectReaction(reactionName)}
                disabled={isReactionLoading}
                className={`cursor-pointer hover:scale-95 transition-all duration-300 outline-none ${size === "sm" ? "w-5 h-5" : "w-6 h-6"} ${isReactionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={reactionName}
              >
                <Image
                  src={imageSrc}
                  alt={reactionName}
                  width={30}
                  height={30}
                />
              </button>
            ))}
          </PopoverContent>
        </Popover>
      ) : (
        <Heart className={`size-${size === "sm" ? "4" : "5"} text-muted-foreground hover:text-foreground transition-colors`} />
      )}
      

      {/* Reaction Count Badge & Dialog */}
      {totalReactions > 0 && user && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer select-none" onClick={() => setDialogOpen(true)}>
              <span className={`inline-flex items-center hover:underline text-muted-foreground hover:text-foreground transition-all duration-300 text-sm ${size === "sm" ? "text-xs" : "text-sm"}`}>
                {totalReactions}
              </span>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reactions</DialogTitle>
            </DialogHeader>
            {/* Tabs */}
            <Tabs defaultValue={allUsers.length > 0 ? "all" : reactionTypeList.find(rt => reactions[rt] > 0) || "all"} className="w-full">
              <TabsList className="mb-2">
                {allUsers.length > 0 && <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>}
                {reactionTypeList.filter(rt => usersByReaction[rt].length > 0).map((rt) => (
                  <TabsTrigger key={rt} value={rt}>
                    <span className="flex items-center gap-1">
                      <Image src={reactionImageMap[rt]} alt={rt} width={18} height={18} />
                      {usersByReaction[rt].length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* All Tab */}
              {allUsers.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto">
                  <TabsContent value="all">
                    <div className="flex flex-col gap-2">
                      {allUsers.map((u, idx) => {
                        const userMeta = resolveReactionUser(u);
                        const uid = userMeta._id;
                        const username = userMeta.username || '';
                        const avatar = userMeta.avatar || '';
                        const firstName = userMeta.firstName || '';
                        const lastName = userMeta.lastName || '';
                        const nameText = `${firstName} ${lastName}`.trim() || 'User';
                        const profileHref = username ? `/profile/${username}` : '#';
                        return (
                          <div key={`${uid || 'unknown'}-${u.reaction}-${idx}`} className="flex items-center gap-2">
                            {username ? (
                              <Link href={profileHref}>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={avatar} alt={uid || ''} />
                                  <AvatarFallback className="text-xs">{firstName?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={avatar} alt={uid || ''} />
                                <AvatarFallback className="text-xs">{firstName?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                              </Avatar>
                            )}
                            <Image src={reactionImageMap[u.reaction as keyof typeof reactionImageMap]} alt={u.reaction} width={20} height={20} />
                            {username ? (
                              <Link href={profileHref}>
                                <span className="text-sm">{nameText}</span>
                              </Link>
                            ) : (
                              <span className="text-sm">{nameText}</span>
                            )}
                            <span className="text-xs text-muted-foreground">({u.reaction})</span>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </div>
              )}

              {/* Individual Reaction Type Tabs */}
              <div className="max-h-[300px] overflow-y-auto -mt-2">
                {reactionTypeList.filter(rt => usersByReaction[rt].length > 0).map((reactionType) => (
                  <TabsContent key={reactionType} value={reactionType}>
                    <div className="flex flex-col gap-2">
                      {usersByReaction[reactionType].map((u, idx) => {
                        const userMeta = resolveReactionUser(u);
                        const uid = userMeta._id;
                        const username = userMeta.username || '';
                        const avatar = userMeta.avatar || '';
                        const firstName = userMeta.firstName || '';
                        const lastName = userMeta.lastName || '';
                        const nameText = `${firstName} ${lastName}`.trim() || 'User';
                        const profileHref = username ? `/profile/${username}` : '#';
                        return (
                          <div key={`${uid || 'unknown'}-${u.reaction}-${idx}`} className="flex items-center gap-2">
                            {username ? (
                              <Link href={profileHref}>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={avatar} alt={uid || ''} />
                                  <AvatarFallback className="text-xs">{firstName?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                                </Avatar>
                              </Link>
                            ) : (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={avatar} alt={uid || ''} />
                                <AvatarFallback className="text-xs">{firstName?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                              </Avatar>
                            )}
                            <Image src={reactionImageMap[u.reaction as keyof typeof reactionImageMap]} alt={u.reaction} width={20} height={20} />
                            {username ? (
                              <Link href={profileHref}>
                                <span className="text-sm">{nameText}</span>
                              </Link>
                            ) : (
                              <span className="text-sm">{nameText}</span>
                            )}
                            <span className="text-xs text-muted-foreground">({u.reaction})</span>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      { totalReactions > 0 && !user && (
        <span className="text-sm text-muted-foreground">
          {totalReactions}
        </span>
      )}

    </div>
  );
}
