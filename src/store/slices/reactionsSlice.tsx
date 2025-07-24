import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios, { AxiosError } from 'axios'

// Backend URL configuration
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`

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
      // Use the original POST endpoint which should handle toggling on the backend
      const response = await axios.post(
        `${API_URL}/posts/${postId}/reactions`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // console.error('Backend error:', axiosError.response.data);
        // console.error('Backend status:', axiosError.response.status);
        // console.error('Backend headers:', axiosError.response.headers);
      } else if (axiosError.request) {
        // console.error('No response received:', axiosError.request);
      } else {
        // console.error('Error setting up request:', axiosError.message);
      }
      throw error;
    }
  }
);

export const addCommentReaction = createAsyncThunk(
  'reactions/addCommentReaction',
  async ({ commentId, reaction, token }: { commentId: string; reaction: string; token: string }) => {
    try {
      const response = await axios.post(
        `${API_URL}/comments/${commentId}/reactions`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Assuming backend returns updated comment
      return {
        commentId,
        reactions: response.data.reactions,
        userReactions: response.data.userReactions
      };
    } catch (error) {
      // handle error
      throw error;
    }
  }
);

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
      })
      .addCase(addCommentReaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add comment reaction'
      })
  }
})

export const { clearError, updatePostReactions, updateCommentReactions } = reactionsSlice.actions
export default reactionsSlice.reducer 