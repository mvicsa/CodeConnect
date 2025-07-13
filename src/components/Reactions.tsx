'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { 
  fetchReactionTypes, 
  addPostReaction, 
  addCommentReaction,
  ReactionType,
  UserReaction,
  Reactions as ReactionsType
} from '../store/slices/reactionsSlice'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Smile } from 'lucide-react'

interface ReactionsProps {
  reactions: ReactionsType
  userReactions: UserReaction[]
  onReactionChange?: (reactions: ReactionsType, userReactions: UserReaction[]) => void
  postId?: string
  commentId?: string
  currentUserId?: string
  currentUsername?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Reactions({
  reactions,
  userReactions,
  onReactionChange,
  postId,
  commentId,
  currentUserId = 'user1', // Default for demo
  currentUsername = 'you', // Default for demo
  size = 'md'
}: ReactionsProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { reactionTypes, loading } = useSelector((state: RootState) => state.reactions)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch reaction types on mount
  useEffect(() => {
    if (reactionTypes.length === 0) {
      dispatch(fetchReactionTypes())
    }
  }, [dispatch, reactionTypes.length])

  // Get current user's reaction
  const currentUserReaction = userReactions.find(ur => ur.userId === currentUserId)

  // Handle reaction click
  const handleReaction = async (reactionType: string) => {
    if (!currentUserId) return

    try {
      if (postId) {
        await dispatch(addPostReaction({
          postId,
          userId: currentUserId,
          username: currentUsername,
          reaction: reactionType
        })).unwrap()
      } else if (commentId) {
        await dispatch(addCommentReaction({
          commentId,
          userId: currentUserId,
          username: currentUsername,
          reaction: reactionType
        })).unwrap()
      }

      // Call callback if provided
      if (onReactionChange) {
        // This would need to be updated with the new reactions from the API
        // For now, we'll just close the popover
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  // Get total reactions count
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0)

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-base'
      default:
        return 'text-sm'
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6'
      case 'lg':
        return 'h-10 w-10'
      default:
        return 'h-8 w-8'
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading reactions...</div>
  }

  return (
    <div className="flex items-center gap-2">
      {/* Reaction Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${getButtonSize()} p-0 hover:bg-muted/50`}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {reactionTypes.map((reactionType) => (
              <Button
                key={reactionType.id}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 hover:scale-110 transition-transform ${
                  currentUserReaction?.reaction === reactionType.id 
                    ? 'bg-muted' 
                    : ''
                }`}
                onClick={() => handleReaction(reactionType.id)}
                title={reactionType.name}
              >
                <span className="text-lg">{reactionType.icon}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Reaction Counts */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1">
          {reactionTypes.map((reactionType) => {
            const count = reactions[reactionType.id as keyof ReactionsType] || 0
            if (count === 0) return null

            return (
              <Badge
                key={reactionType.id}
                variant="secondary"
                className={`${getSizeClasses()} px-1.5 py-0.5 cursor-pointer hover:bg-muted/80 transition-colors`}
                onClick={() => handleReaction(reactionType.id)}
                title={`${count} ${reactionType.name}${count > 1 ? 's' : ''}`}
              >
                <span className="mr-1">{reactionType.icon}</span>
                {count}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Current User's Reaction Indicator */}
      {currentUserReaction && (
        <Badge
          variant="outline"
          className={`${getSizeClasses()} px-1.5 py-0.5`}
        >
          You reacted with {reactionTypes.find(rt => rt.id === currentUserReaction.reaction)?.icon}
        </Badge>
      )}
    </div>
  )
} 