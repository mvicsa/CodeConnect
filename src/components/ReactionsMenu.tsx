'use client';

import { useState, useRef } from "react";
import { useReactions } from "../hooks/useReactions";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { UserReaction } from '@/types/post';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

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
  currentUsername?: string;
}

export default function ReactionsMenu({ 
  size = "md",
  postId,
  commentId,
  parentCommentId,
  replyId,
  reactions = { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
  userReactions = [],
  currentUserId,
  currentUsername
}: ReactionsMenuProps) {
  const { 
    handlePostReaction, 
    handleCommentReaction,
    handleReplyReaction,
    getCurrentUserReaction 
  } = useReactions();
  
  const [open, setOpen] = useState(false);
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const lastReactionRef = useRef<{ postId?: string; commentId?: string; replyId?: string | number; reaction: string; timestamp: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);

  // Get current user's reaction
  const currentUserReaction = userReactions.find(
    ur => ur.userId._id === user?._id
  );
  const currentUserReactionType = currentUserReaction?.reaction || null;
  const selectedReaction = currentUserReactionType ? reactionImageMap[currentUserReactionType as keyof typeof reactionImageMap] : null;

  // Helper function to check if user has reacted
  const hasUserReacted = (userId: string, reactionType?: string) => {
    if (!userId) return false; // No user logged in
    const userReaction = userReactions.find(ur => ur.userId._id === userId);
    if (!reactionType) return !!userReaction; // Check if user has any reaction
    return userReaction?.reaction === reactionType; // Check specific reaction type
  };

  // Check if current user has reacted
  const isCurrentUserReacted = hasUserReacted(currentUserId || '');

  // Calculate total reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  // Only use reaction types that exist in the reactions object
  const reactionTypeList = Object.keys(reactions).filter(rt => rt in reactionImageMap) as (keyof typeof reactionImageMap)[];
  // Group users by reaction type
  const usersByReaction: Record<keyof typeof reactionImageMap, typeof userReactions> = {
    like: [], love: [], wow: [], funny: [], dislike: [], happy: []
  };
  reactionTypeList.forEach((rt) => {
    usersByReaction[rt] = userReactions.filter(u => u.reaction === rt);
  });
  // All users (for All tab)
  const allUsers = userReactions;

  const handleSelectReaction = async (reactionName: string) => {
    if (!currentUserId || isReactionLoading) return;

    // Debug: Check if user already has this reaction
    const currentReaction = userReactions.find(ur => ur.userId._id === currentUserId);
    console.log('🎯 Reaction Toggle Debug:', {
      reactionName,
      currentUserId,
      currentReaction: currentReaction?.reaction,
      willToggle: currentReaction?.reaction === reactionName,
      userReactions: userReactions.map(ur => ({ userId: ur.userId._id, reaction: ur.reaction }))
    });

    // Prevent duplicate rapid clicks
    const now = Date.now();
    const lastReaction = lastReactionRef.current;
    const isDuplicate = lastReaction && 
      lastReaction.postId === postId &&
      lastReaction.commentId === commentId &&
      lastReaction.replyId === replyId &&
      lastReaction.reaction === reactionName &&
      (now - lastReaction.timestamp) < 1000; // 1 second debounce

    if (isDuplicate) {
      console.log('🚫 Duplicate reaction prevented:', { reactionName, postId, commentId, replyId });
      return;
    }

    // Store this reaction attempt
    lastReactionRef.current = {
      postId,
      commentId,
      replyId,
      reaction: reactionName,
      timestamp: now
    };

    setIsReactionLoading(true);
    try {
      let result;
      
      if (postId) {
        result = await handlePostReaction(postId, reactionName);
      } else if (commentId && !replyId) {
        result = await handleCommentReaction(commentId, reactionName);
      } else if (replyId && parentCommentId) {
        result = await handleReplyReaction(
          String(parentCommentId), 
          String(replyId), 
          reactionName
        );
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

  // Remove the loading check for initialLoading and reactionTypes

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
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>Reactions</DialogTitle>
            </DialogHeader>
            {/* Tabs */}
            <Tabs defaultValue={allUsers.length > 0 ? "all" : reactionTypeList.find(rt => reactions[rt] > 0) || "all"} className="w-full">
              <TabsList className="mb-2">
                {allUsers.length > 0 && <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>}
                {reactionTypeList.filter(rt => reactions[rt] > 0).map((rt) => (
                  <TabsTrigger key={rt} value={rt}>
                    <span className="flex items-center gap-1">
                      <Image src={reactionImageMap[rt]} alt={rt} width={18} height={18} />
                      {reactions[rt]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* All Tab */}
              {allUsers.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto">
                  <TabsContent value="all">
                    <div className="flex flex-col gap-2">
                      {allUsers.map((u, idx) => (
                        <div key={u.userId._id + u.reaction + idx} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={u.userId.avatar} alt={u.userId._id} />
                            <AvatarFallback className="text-xs">{u.userId.firstName?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                          </Avatar>
                          <Image src={reactionImageMap[u.reaction as keyof typeof reactionImageMap]} alt={u.reaction} width={20} height={20} />
                          <span className="text-sm">{u.userId?.firstName || ''} {u.userId?.lastName || ''}</span>
                          <span className="text-xs text-muted-foreground">({u.reaction})</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              )}

              {/* Individual Reaction Type Tabs */}
              <div className="max-h-[300px] overflow-y-auto -mt-2">
                {reactionTypeList.filter(rt => reactions[rt] > 0).map((reactionType) => (
                  <TabsContent key={reactionType} value={reactionType}>
                    <div className="flex flex-col gap-2">
                      {usersByReaction[reactionType].map((u, idx) => (
                        <div key={u.userId._id + u.reaction + idx} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={u.userId.avatar} alt={u.userId._id} />
                            <AvatarFallback className="text-xs">{u.userId.firstName?.charAt(0).toUpperCase() || ''}</AvatarFallback>
                          </Avatar>
                          <Image src={reactionImageMap[u.reaction as keyof typeof reactionImageMap]} alt={u.reaction} width={20} height={20} />
                          <span className="text-sm">{u.userId?.firstName || ''} {u.userId?.lastName || ''}</span>
                          <span className="text-xs text-muted-foreground">({u.reaction})</span>
                        </div>
                      ))}
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
