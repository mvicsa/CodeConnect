import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { PostType } from '@/types/post'
import { addPostReaction } from './reactionsSlice'

const API_URL = 'http://localhost:3001/posts'

type PostsState = {
  posts: PostType[]
  loading: boolean
  error: string | null
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
}

export const fetchPosts = createAsyncThunk<PostType[]>(
  'posts/fetchPosts',
  async () => {
    const response = await axios.get<PostType[]>(API_URL)
    return response.data
  }
)

export const createPost = createAsyncThunk<PostType, Omit<PostType, 'id'>>(
  'posts/createPost',
  async (postData) => {
    const response = await axios.post<PostType>(API_URL, postData)
    return response.data
  }
)

export const updatePost = createAsyncThunk<PostType, { id: string; data: Partial<PostType> }>(
  'posts/updatePost',
  async ({ id, data }) => {
    const response = await axios.put<PostType>(`${API_URL}/${id}`, data)
    return response.data
  }
)

export const deletePost = createAsyncThunk<string, string>(
  'posts/deletePost',
  async (id) => {
    await axios.delete(`${API_URL}/${id}`)
    return id
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<PostType>) => {
      state.posts.unshift(action.payload)
    },
    editPost: (state, action: PayloadAction<{ id: string; data: Partial<PostType> }>) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload.data }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch posts'
      })
      // Create Post
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload)
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.posts[index] = action.payload
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p.id !== action.payload)
      })
      // Update post reactions (from reactions slice)
      .addCase(addPostReaction.fulfilled, (state, action) => {
        const { postId, reactions, userReactions } = action.payload
        const postIndex = state.posts.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
          // Create a new post object only if reactions changed
          const currentPost = state.posts[postIndex]
          const currentReactions = currentPost.reactions || { like: 0, love: 0, wow: 0, funny: 0, dislike: 0 }
          const currentUserReactions = currentPost.userReactions || []
          
          const reactionsChanged = 
            currentReactions.like !== reactions.like ||
            currentReactions.love !== reactions.love ||
            currentReactions.wow !== reactions.wow ||
            currentReactions.funny !== reactions.funny ||
            currentReactions.dislike !== reactions.dislike ||
            currentUserReactions.length !== userReactions.length ||
            JSON.stringify(currentUserReactions) !== JSON.stringify(userReactions)
          
          if (reactionsChanged) {
            state.posts[postIndex] = {
              ...currentPost,
              reactions,
              userReactions
            }
          }
        }
      })
  }
})

export const { addPost, editPost } = postsSlice.actions

export default postsSlice.reducer
