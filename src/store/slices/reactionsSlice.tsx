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
}

export interface ReactionState {
  reactionTypes: ReactionType[]
  loading: boolean
  error: string | null
}

// Async thunks
export const fetchReactionTypes = createAsyncThunk(
  'reactions/fetchReactionTypes',
  async () => {
    const response = await axios.get('http://localhost:3001/reactionTypes')
    return response.data
  }
)

export const addPostReaction = createAsyncThunk(
  'reactions/addPostReaction',
  async ({ postId, userId, username, reaction }: {
    postId: string
    userId: string
    username: string
    reaction: string
  }) => {
    // Get current post
    const postResponse = await axios.get(`http://localhost:3001/posts/${postId}`)
    const post = postResponse.data
    
    // Check if user already reacted
    const existingReactionIndex = post.userReactions?.findIndex(
      (ur: UserReaction) => ur.userId === userId
    ) || -1

    let updatedUserReactions = [...(post.userReactions || [])]
    let updatedReactions = { ...post.reactions }

    if (existingReactionIndex >= 0) {
      // Remove previous reaction
      const previousReaction = updatedUserReactions[existingReactionIndex].reaction
      updatedReactions[previousReaction as keyof Reactions] = Math.max(0, updatedReactions[previousReaction as keyof Reactions] - 1)
      
      // Update or remove reaction
      if (updatedUserReactions[existingReactionIndex].reaction === reaction) {
        // Remove reaction if same type
        updatedUserReactions.splice(existingReactionIndex, 1)
      } else {
        // Change reaction type
        updatedUserReactions[existingReactionIndex] = {
          userId,
          username,
          reaction,
          createdAt: new Date().toISOString()
        }
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

    // Update post
    const updateResponse = await axios.patch(`http://localhost:3001/posts/${postId}`, {
      reactions: updatedReactions,
      userReactions: updatedUserReactions
    })

    return {
      postId,
      reactions: updatedReactions,
      userReactions: updatedUserReactions
    }
  }
)

export const addCommentReaction = createAsyncThunk(
  'reactions/addCommentReaction',
  async ({ commentId, userId, username, reaction }: {
    commentId: string
    userId: string
    username: string
    reaction: string
  }) => {
    // Get current comment
    const commentResponse = await axios.get(`http://localhost:3001/comments/${commentId}`)
    const comment = commentResponse.data
    
    // Check if user already reacted
    const existingReactionIndex = comment.userReactions?.findIndex(
      (ur: UserReaction) => ur.userId === userId
    ) || -1

    let updatedUserReactions = [...(comment.userReactions || [])]
    let updatedReactions = { ...comment.reactions }

    if (existingReactionIndex >= 0) {
      // Remove previous reaction
      const previousReaction = updatedUserReactions[existingReactionIndex].reaction
      updatedReactions[previousReaction as keyof Reactions] = Math.max(0, updatedReactions[previousReaction as keyof Reactions] - 1)
      
      // Update or remove reaction
      if (updatedUserReactions[existingReactionIndex].reaction === reaction) {
        // Remove reaction if same type
        updatedUserReactions.splice(existingReactionIndex, 1)
      } else {
        // Change reaction type
        updatedUserReactions[existingReactionIndex] = {
          userId,
          username,
          reaction,
          createdAt: new Date().toISOString()
        }
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
    const updateResponse = await axios.patch(`http://localhost:3001/comments/${commentId}`, {
      reactions: updatedReactions,
      userReactions: updatedUserReactions
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
  reactionTypes: [],
  loading: false,
  error: null
}

// Slice
const reactionsSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch reaction types
      .addCase(fetchReactionTypes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReactionTypes.fulfilled, (state, action) => {
        state.loading = false
        state.reactionTypes = action.payload
      })
      .addCase(fetchReactionTypes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch reaction types'
      })
      
      // Add post reaction
      .addCase(addPostReaction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addPostReaction.fulfilled, (state) => {
        state.loading = false
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
      .addCase(addCommentReaction.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(addCommentReaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add comment reaction'
      })
  }
})

export const { clearError } = reactionsSlice.actions
export default reactionsSlice.reducer 