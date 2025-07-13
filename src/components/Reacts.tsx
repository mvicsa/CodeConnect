'use client';

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { addPostReaction, addCommentReaction, fetchReactionTypes } from "../store/slices/reactionsSlice";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart } from "lucide-react";
import { Badge } from "./ui/badge";

// Map your existing reaction images to the database structure
const reactionImageMap = {
  like: "/reactions/like.png",
  love: "/reactions/love.png",
  wow: "/reactions/wow.png",
  funny: "/reactions/funny.png",
  happy: "/reactions/happy.png", // Note: this maps to "happy" in your images but "funny" in DB
  dislike: "/reactions/dislike.png",
};

interface ReactionMenuProps {
  size?: "sm" | "md";
  postId?: string;
  commentId?: string;
  reactions?: {
    like: number;
    love: number;
    wow: number;
    funny: number;
    dislike: number;
  };
  userReactions?: Array<{
    userId: string;
    username: string;
    reaction: string;
    createdAt: string;
  }>;
  currentUserId?: string;
  currentUsername?: string;
  showCounts?: boolean;
}

export default function ReactionMenu({ 
  size = "md",
  postId,
  commentId,
  reactions = { like: 0, love: 0, wow: 0, funny: 0, dislike: 0 },
  userReactions = [],
  currentUserId = "user1",
  currentUsername = "you",
  showCounts = true
}: ReactionMenuProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { reactionTypes, loading } = useSelector((state: RootState) => state.reactions);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Fetch reaction types on mount
  useEffect(() => {
    if (reactionTypes.length === 0) {
      dispatch(fetchReactionTypes());
    }
  }, [dispatch, reactionTypes.length]);

  // Get current user's reaction
  const currentUserReaction = userReactions.find(ur => ur.userId === currentUserId);
  const selectedReaction = currentUserReaction ? reactionImageMap[currentUserReaction.reaction as keyof typeof reactionImageMap] : null;

  const handleSelectReaction = async (reactionName: string) => {
    if (!currentUserId) return;

    try {
      if (postId) {
        await dispatch(addPostReaction({
          postId,
          userId: currentUserId,
          username: currentUsername,
          reaction: reactionName
        })).unwrap();
      } else if (commentId) {
        await dispatch(addCommentReaction({
          commentId,
          userId: currentUserId,
          username: currentUsername,
          reaction: reactionName
        })).unwrap();
      }

      // Update local state for immediate UI feedback
      if (reactionName === currentUserReaction?.reaction) {
        setSelected(null);
      } else {
        setSelected(reactionName);
      }
      setOpen(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Get total reactions count
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className={`w-${size === "sm" ? "5" : "6"} h-${size === "sm" ? "5" : "6"} cursor-pointer flex items-center justify-center`}>
            {selectedReaction ? (
              <Image
                src={selectedReaction}
                alt={currentUserReaction?.reaction || "reaction"}
                width={30}
                height={30}
              />
            ) : (
              <Heart className={`size-${size === "sm" ? "4" : "5"} text-muted-foreground`} />
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
              className={`cursor-pointer hover:scale-95 transition-all duration-300 outline-none ${size === "sm" ? "w-5 h-5" : "w-6 h-6"}`}
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

      {/* Show reaction counts if enabled */}
      {showCounts && totalReactions > 0 && (
        <div className="flex items-center gap-1">
          {Object.entries(reactions).map(([reactionType, count]) => {
            if (count === 0) return null;
            const imageSrc = reactionImageMap[reactionType as keyof typeof reactionImageMap];
            
            return (
              <Badge
                key={reactionType}
                variant="secondary"
                className="text-xs px-1.5 py-0.5 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSelectReaction(reactionType)}
                title={`${count} ${reactionType}${count > 1 ? 's' : ''}`}
              >
                <Image
                  src={imageSrc}
                  alt={reactionType}
                  width={16}
                  height={16}
                  className="mr-1"
                />
                {count}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
