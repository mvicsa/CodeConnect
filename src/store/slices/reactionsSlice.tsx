import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

// Types
export interface ReactionType {
  id: string
  name: string
  icon: string
  color: string
}

export interface UserReaction {
  userId: string
  username: string
  reaction: string
  createdAt: string
}

export interface Reactions {
  like: number
  love: number
  wow: number
  funny: number
  dislike: number
  happy: number
}

export interface ReactionState {
  loading: boolean
  error: string | null
  postReactions: Record<string, { reactions: Reactions; userReactions: UserReaction[] }>
  commentReactions: Record<string, { reactions: Reactions; userReactions: UserReaction[] }>
}

// Async thunks
export const addPostReaction = createAsyncThunk(
  'reactions/addPostReaction',
  async ({ postId, reaction, token }: { postId: string; reaction: string; token: string }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/posts/${postId}/reactions`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Backend error:', error.response.data);
      }
      throw error;
    }
  }
);

export const addCommentReaction = createAsyncThunk(
  'reactions/addCommentReaction',
  async ({ commentId, userId, username, reaction, token }: {
    commentId: string
    userId: string
    username: string
    reaction: string
    token: string
  }) => {
    // Get current comment
    const commentResponse = await axios.get(`http://localhost:5000/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const comment = commentResponse.data
    
    // Check if user already reacted - handle duplicates properly
    const existingReactions = comment.userReactions?.filter(
      (ur: UserReaction) => ur.userId === userId
    ) || []
    
    // Remove any duplicate reactions for this user (safety check)
    const uniqueUserReactions = (comment.userReactions || []).filter((reaction: UserReaction, index: number, self: UserReaction[]) => 
      index === self.findIndex((r: UserReaction) => r.userId === reaction.userId)
    )

    let updatedUserReactions = [...uniqueUserReactions]
    let updatedReactions = { ...comment.reactions }

    // Check if user already has this reaction type
    const userHasThisReaction = existingReactions.some((ur: UserReaction) => ur.reaction === reaction)
    const userHasAnyReaction = existingReactions.length > 0

    if (userHasAnyReaction) {
      // Remove ALL existing reactions for this user (clean up duplicates)
      existingReactions.forEach((existingReaction: UserReaction) => {
        const previousReaction = existingReaction.reaction
        updatedReactions[previousReaction as keyof Reactions] = Math.max(0, updatedReactions[previousReaction as keyof Reactions] - 1)
      })
      
      // Remove all user reactions for this user
      updatedUserReactions = updatedUserReactions.filter(ur => ur.userId !== userId)
      
      // If user clicked the same reaction type, don't add it back (toggle off)
      if (!userHasThisReaction) {
        // Add new reaction type
        updatedUserReactions.push({
          userId,
          username,
          reaction,
          createdAt: new Date().toISOString()
        })
        updatedReactions[reaction as keyof Reactions] = (updatedReactions[reaction as keyof Reactions] || 0) + 1
      }
    } else {
      // Add new reaction
      updatedUserReactions.push({
        userId,
        username,
        reaction,
        createdAt: new Date().toISOString()
      })
      updatedReactions[reaction as keyof Reactions] = (updatedReactions[reaction as keyof Reactions] || 0) + 1
    }

    // Update comment
    const updateResponse = await axios.put(`http://localhost:5000/comments/${commentId}`, {
      ...comment,
      reactions: updatedReactions,
      userReactions: updatedUserReactions
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return {
      commentId,
      reactions: updatedReactions,
      userReactions: updatedUserReactions
    }
  }
)

// Initial state
const initialState: ReactionState = {
  loading: false,
  error: null,
  postReactions: {},
  commentReactions: {}
}

// Slice
const reactionsSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Update post reactions in local state
    updatePostReactions: (state, action: PayloadAction<{
      postId: string
      reactions: Reactions
      userReactions: UserReaction[]
    }>) => {
      const { postId, reactions, userReactions } = action.payload
      state.postReactions[postId] = { reactions, userReactions }
    },
    // Update comment reactions in local state
    updateCommentReactions: (state, action: PayloadAction<{
      commentId: string
      reactions: Reactions
      userReactions: UserReaction[]
    }>) => {
      const { commentId, reactions, userReactions } = action.payload
      state.commentReactions[commentId] = { reactions, userReactions }
    }
  },
  extraReducers: (builder) => {
    builder
      // Add post reaction
      .addCase(addPostReaction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addPostReaction.fulfilled, (state, action) => {
        state.loading = false
        const post = action.payload;
        state.postReactions[post._id] = {
          reactions: post.reactions,
          userReactions: post.userReactions
        };
      })
      .addCase(addPostReaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add post reaction'
      })
      
      // Add comment reaction
      .addCase(addCommentReaction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addCommentReaction.fulfilled, (state, action) => {
        state.loading = false
        const { commentId, reactions, userReactions } = action.payload
        state.commentReactions[commentId] = { reactions, userReactions }
        console.log('Comment reactions updated in reactions slice:', commentId, reactions)
      })
      .addCase(addCommentReaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add comment reaction'
      })
  }
})

export const { clearError, updatePostReactions, updateCommentReactions } = reactionsSlice.actions
export default reactionsSlice.reducer 