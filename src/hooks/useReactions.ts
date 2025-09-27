import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store'
import { 
  addPostReaction, 
  updatePostReactions,
  updateCommentReactions,
  addMessageReaction,
  updateMessageReactions
} from '../store/slices/reactionsSlice'
import { 
  updateCommentReactionsAsync,
  updateReplyReactionsAsync
} from '../store/slices/commentsSlice'
import { editPost } from '../store/slices/postsSlice'
import { useCallback, useRef } from 'react'
import { UserReaction as ReactionUserReaction } from '../store/slices/reactionsSlice'
import { getAuthToken } from '@/lib/cookies';

export const useReactions = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { postReactions, commentReactions, messageReactions } = useSelector((state: RootState) => state.reactions)
  const pendingReactionsRef = useRef<Set<string>>(new Set())

  // Add/remove post reaction
  const handlePostReaction = useCallback(async (
    postId: string,
    reaction: string
  ) => {
    // Create a unique key for this reaction attempt
    const reactionKey = `${postId}-${reaction}`
    
    // Check if this reaction is already pending
    if (pendingReactionsRef.current.has(reactionKey)) {
      return { success: false, error: 'Reaction already pending' }
    }
    
    // Add to pending set
    pendingReactionsRef.current.add(reactionKey)
    
    try {
      
      const result = await dispatch(addPostReaction({
        postId,
        reaction,
        token: getAuthToken() || ''
      })).unwrap()
      
      
      // Update reactions slice state immediately for better UX
      if (result) {
        dispatch(updatePostReactions({
          postId,
          reactions: result.reactions,
          userReactions: result.userReactions
        }))
        dispatch(editPost({
          id: postId,
          data: {
            reactions: result.reactions,
            userReactions: result.userReactions
          }
        }))
      }
      
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error }
    } finally {
      // Remove from pending set
      pendingReactionsRef.current.delete(reactionKey)
    }
  }, [dispatch])

  // Add/remove comment reaction
  const handleCommentReaction = useCallback(async (
    commentId: string,
    reaction: string
  ) => {
    // Create a unique key for this reaction attempt
    const reactionKey = `comment-${commentId}-${reaction}`
    
    // Check if this reaction is already pending
    if (pendingReactionsRef.current.has(reactionKey)) {
      return { success: false, error: 'Reaction already pending' }
    }
    
    // Add to pending set
    pendingReactionsRef.current.add(reactionKey)
    
    try {
      const result = await dispatch(updateCommentReactionsAsync({
        commentId,
        reaction
      })).unwrap()
      
      // Update reactions slice state immediately for better UX
      if (result) {
        // Convert CommentUserReaction[] to ReactionUserReaction[]
        const convertedUserReactions: ReactionUserReaction[] = result.userReactions.map(ur => ({
          userId: ur.userId._id ?? '',
          username: ur.username,
          reaction: ur.reaction,
          createdAt: ur.createdAt
        }))

        dispatch(updateCommentReactions({
          commentId: result._id,
          reactions: result.reactions,
          userReactions: convertedUserReactions
        }))
      }
      
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error }
    } finally {
      // Remove from pending set
      pendingReactionsRef.current.delete(reactionKey)
    }
  }, [dispatch])

  // Add/remove reply reaction
  const handleReplyReaction = useCallback(async (
    parentCommentId: string,
    replyId: string,
    reaction: string
  ) => {
    // Create a unique key for this reaction attempt
    const reactionKey = `reply-${parentCommentId}-${replyId}-${reaction}`
    
    // Check if this reaction is already pending
    if (pendingReactionsRef.current.has(reactionKey)) {
      return { success: false, error: 'Reaction already pending' }
    }
    
    // Add to pending set
    pendingReactionsRef.current.add(reactionKey)
    
    try {
      const result = await dispatch(updateReplyReactionsAsync({
        parentCommentId,
        replyId,
        reaction
      })).unwrap()
      
      // Update reactions slice state immediately for better UX
      if (result) {
        // The result is now the updated reply itself
        // Convert CommentUserReaction[] to ReactionUserReaction[]
        const convertedUserReactions: ReactionUserReaction[] = result.userReactions.map(ur => ({
          userId: ur.userId._id ?? '',
          username: ur.username,
          reaction: ur.reaction,
          createdAt: ur.createdAt
        }))

        dispatch(updateCommentReactions({
          commentId: replyId,
          reactions: result.reactions,
          userReactions: convertedUserReactions
        }))
      }
      
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error }
    } finally {
      // Remove from pending set
      pendingReactionsRef.current.delete(reactionKey)
    }
  }, [dispatch])

  // Get current user's reaction
  const getCurrentUserReaction = useCallback((
    userReactions: Array<{ userId: string; reaction: string }>,
    currentUserId: string
  ) => {
    return userReactions.find(ur => ur.userId === currentUserId)?.reaction || null
  }, [])

  // Check if user has reacted
  const hasUserReacted = useCallback((
    userReactions: Array<{ userId: string; reaction: string }>,
    currentUserId: string,
    reactionType?: string
  ) => {
    const userReaction = userReactions.find(ur => ur.userId === currentUserId)
    if (!reactionType) return !!userReaction
    return userReaction?.reaction === reactionType
  }, [])

  // Get reactions for a post from Redux state
  const getPostReactions = useCallback((postId: string) => {
    return postReactions[postId] || { reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 }, userReactions: [] }
  }, [postReactions])

  // Add/remove message reaction
  const handleMessageReaction = useCallback(async (
    messageId: string,
    reaction: string
  ) => {
    // Create a unique key for this reaction attempt
    const reactionKey = `message-${messageId}-${reaction}`
    
    // Check if this reaction is already pending
    if (pendingReactionsRef.current.has(reactionKey)) {
      return { success: false, error: 'Reaction already pending' }
    }
    
    // Add to pending set
    pendingReactionsRef.current.add(reactionKey)
    
    try {
      console.log('🎯 Making API call for message reaction:', { messageId, reaction });
      const result = await dispatch(addMessageReaction({
        messageId,
        reaction,
        token: getAuthToken() || ''
      })).unwrap()
      
      console.log('🎯 API call result:', result);
      
      // Update reactions slice state immediately for better UX
      if (result) {
        dispatch(updateMessageReactions({
          messageId,
          reactions: result.reactions,
          userReactions: result.userReactions
        }))
      }
      
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error }
    } finally {
      // Remove from pending set
      pendingReactionsRef.current.delete(reactionKey)
    }
  }, [dispatch])

  // Get reactions for a comment from Redux state
  const getCommentReactions = useCallback((commentId: string) => {
    return commentReactions[commentId] || { reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 }, userReactions: [] }
  }, [commentReactions])

  // Get reactions for a message from Redux state
  const getMessageReactions = useCallback((messageId: string) => {
    return messageReactions[messageId] || { reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 }, userReactions: [] }
  }, [messageReactions])

  return {
    handlePostReaction,
    handleCommentReaction,
    handleReplyReaction,
    handleMessageReaction,
    getCurrentUserReaction,
    hasUserReacted,
    getPostReactions,
    getCommentReactions,
    getMessageReactions
  }
} 