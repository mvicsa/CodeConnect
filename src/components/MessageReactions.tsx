'use client';

import React, { useState, useRef, useContext } from 'react';
import { useReactions } from '@/hooks/useReactions';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { SocketContext } from '@/store/Provider';
import { cn } from '@/lib/utils';
import { Heart, ThumbsUp, Laugh, Eye, Frown, Angry, Star, Hand, Flame } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// Professional reaction types with unique icons and colors
const REACTION_TYPES = [
  { id: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-500', bgColor: 'bg-blue-50', emoji: '👍' },
  { id: 'love', icon: Heart, label: 'Love', color: 'text-red-500', bgColor: 'bg-red-50', emoji: '❤️' },
  { id: 'laugh', icon: Laugh, label: 'Laugh', color: 'text-yellow-500', bgColor: 'bg-yellow-50', emoji: '😂' },
  { id: 'wow', icon: Eye, label: 'Wow', color: 'text-purple-500', bgColor: 'bg-purple-50', emoji: '😮' },
  { id: 'sad', icon: Frown, label: 'Sad', color: 'text-gray-500', bgColor: 'bg-gray-50', emoji: '😢' },
  { id: 'angry', icon: Angry, label: 'Angry', color: 'text-orange-500', bgColor: 'bg-orange-50', emoji: '😠' },
  { id: 'clap', icon: Hand, label: 'Clap', color: 'text-green-500', bgColor: 'bg-green-50', emoji: '👏' },
  { id: 'fire', icon: Flame, label: 'Fire', color: 'text-red-600', bgColor: 'bg-red-100', emoji: '🔥' },
  { id: 'star', icon: Star, label: 'Star', color: 'text-yellow-600', bgColor: 'bg-yellow-100', emoji: '⭐' },
];

interface MessageReactionsProps {
  messageId: string;
  roomId: string;
  reactions?: {
    like: number;
    love: number;
    laugh: number;
    wow: number;
    sad: number;
    angry: number;
    clap: number;
    fire: number;
    star: number;
  };
  userReactions?: Array<{
    userId: { _id: string; firstName: string; lastName: string; avatar: string };
    username: string;
    reaction: string;
    createdAt: string;
  }>;
  currentUserId?: string;
  isCurrentUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function MessageReactions({
  messageId,
  roomId,
  reactions = { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0, clap: 0, fire: 0, star: 0 },
  userReactions = [],
  currentUserId,
  isCurrentUser = false,
  size = 'md'
}: MessageReactionsProps) {
  const { handleMessageReaction } = useReactions();
  const { user } = useSelector((state: RootState) => state.auth);
  const socket = useContext(SocketContext);
  const [showReactions, setShowReactions] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);

  // Get current user's reaction
  const currentUserReaction = userReactions.find(ur => ur.userId._id === currentUserId);
  const currentReactionType = currentUserReaction?.reaction;

  // Calculate total reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  // Debug logging
  console.log('🎯 MessageReactions render:', {
    messageId,
    reactions,
    userReactions,
    currentUserId,
    currentReactionType,
    totalReactions,
    roomId
  });

  // Get reactions with counts
  const reactionsWithCounts = REACTION_TYPES.map(type => ({
    ...type,
    count: reactions[type.id as keyof typeof reactions] || 0
  })).filter(r => r.count > 0);

  const handleReactionClick = async (reactionType: string) => {
    if (!currentUserId || isReacting) return;

    console.log('🎯 MessageReactions: Handling reaction click', { messageId, reactionType, currentUserId });
    setIsReacting(true);
    try {
      // First emit WebSocket event for real-time updates
      if (socket) {
        console.log('🎯 MessageReactions: Emitting WebSocket event');
        socket.emit('chat:react_message', {
          roomId,
          messageId,
          reaction: reactionType
        });
      }

      // Then make REST API call
      const result = await handleMessageReaction(messageId, reactionType);
      console.log('🎯 MessageReactions: API call result', result);
      if (result?.success) {
        setShowReactions(false);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleLongPress = () => {
    if (!isCurrentUser) {
      setShowReactions(true);
    }
  };

  const handleQuickReaction = () => {
    if (!isCurrentUser && currentUserId) {
      // Quick reaction with like
      handleReactionClick('like');
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="relative">
      {/* Reaction Button */}
      <div
        ref={reactionRef}
        className={cn(
          "flex items-center gap-1 cursor-pointer select-none transition-all duration-200",
          sizeClasses[size],
          isCurrentUser ? "opacity-60" : "hover:scale-105"
        )}
        onClick={handleQuickReaction}
        onMouseDown={handleLongPress}
        onTouchStart={handleLongPress}
        onMouseUp={() => setShowReactions(false)}
        onTouchEnd={() => setShowReactions(false)}
      >
        {currentReactionType ? (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200",
              REACTION_TYPES.find(r => r.id === currentReactionType)?.bgColor || 'bg-gray-100'
            )}
          >
            <span className="text-lg">
              {REACTION_TYPES.find(r => r.id === currentReactionType)?.emoji}
            </span>
            {totalReactions > 1 && (
              <span className="text-xs font-medium">
                {totalReactions}
              </span>
            )}
          </div>
        ) : totalReactions > 0 ? (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {reactionsWithCounts.slice(0, 3).map((reaction, index) => (
                <div
                  key={reaction.id}
                  className="text-lg"
                >
                  {reaction.emoji}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-gray-600">
              {totalReactions}
            </span>
          </div>
        ) : (
          <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            iconSizes[size]
          )}>
            <Heart className="w-full h-full text-gray-400" />
          </div>
        )}
      </div>

      {/* Reaction Picker */}
      {showReactions && !isCurrentUser && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1">
            {REACTION_TYPES.map((reaction) => {
              const Icon = reaction.icon;
              const isSelected = currentReactionType === reaction.id;
              const count = reactions[reaction.id as keyof typeof reactions] || 0;
              
              return (
                <button
                  key={reaction.id}
                  onClick={() => handleReactionClick(reaction.id)}
                  disabled={isReacting}
                  className={cn(
                    "relative p-2 rounded-full transition-all duration-200 hover:scale-110",
                    isSelected ? reaction.bgColor : "hover:bg-gray-100 dark:hover:bg-gray-700",
                    isReacting && "opacity-50 cursor-not-allowed"
                  )}
                  title={reaction.label}
                >
                  <span className="text-xl">
                    {reaction.emoji}
                  </span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 text-xs font-bold px-1 py-0.5 rounded-full",
                        reaction.color,
                        reaction.bgColor
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reaction Details Tooltip */}
      {totalReactions > 0 && (
        <div className="absolute bottom-full left-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-40">
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {reactionsWithCounts.map(reaction => (
              <div key={reaction.id} className="flex items-center gap-1">
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </div>
            )).join(' • ')}
          </div>
        </div>
      )}
    </div>
  );
}
