import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios, { isAxiosError } from 'axios'
import { PostType } from '@/types/post'
import { addPostReaction } from './reactionsSlice'

// Use environment variable for API URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/posts`

type PostsState = {
  posts: PostType[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  limit: number
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 10
}

// Fetch all posts with pagination and type filter
export const fetchPosts = createAsyncThunk<PostType[], { page?: number; limit?: number; type?: string; refresh?: boolean }>(
  'posts/fetchPosts',
  async ({ page = 1, limit = 10, type}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (type) params.append('type', type)
    const url = `${API_URL}?${params.toString()}`
    const response = await axios.get(url)
    return response.data
  }
)



// Fetch posts by user
export const fetchPostsByUser = createAsyncThunk<PostType[], { userId: string; page?: number; limit?: number; refresh?: boolean }>(
  'posts/fetchPostsByUser',
  async ({ userId, page = 1, limit = 10 }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const url = `${API_URL}/user/${userId}?${params.toString()}`
    const response = await axios.get(url)
    return response.data
  }
)

// Fetch post by ID
export const fetchPostById = createAsyncThunk<PostType, string>(
  'posts/fetchPostById',
  async (id) => {
    const response = await axios.get(`${API_URL}/${id}`)
    return response.data
  }
)

// Create post (requires Bearer token)
export const createPost = createAsyncThunk<
  PostType,
  { postData: Omit<PostType, '_id' | 'createdBy' | 'createdAt' | 'updatedAt'>; token: string },
  { rejectValue: { message: string } } // 👈 هنا نحدد شكل الخطأ
>(
  'posts/createPost',
  async ({ postData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, postData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (err) {
      if (isAxiosError(err)) {
        return rejectWithValue({ message: err.response?.data?.message || 'Unknown error occurred' })
      }
      return rejectWithValue({ message: 'Unknown error occurred' })
    }
  }
)

// Update post (requires Bearer token)
export const updatePost = createAsyncThunk<PostType, { id: string; data: Partial<PostType>; token: string }>(
  'posts/updatePost',
  async ({ id, data, token }) => {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
)

// Delete post (requires Bearer token)
export const deletePost = createAsyncThunk<string, { id: string; token: string }>(
  'posts/deletePost',
  async ({ id, token }) => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return id
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<PostType>) => {
      // Add new post at the beginning since it's the newest
      state.posts.unshift(action.payload)
    },
    editPost: (state, action: PayloadAction<{ id: string; data: Partial<PostType> }>) => {
      const index = state.posts.findIndex(p => p._id === action.payload.id)
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload.data }
      }
    },
    resetPosts: (state) => {
      state.posts = []
      state.page = 1
      state.hasMore = true
      state.error = null
    },
    // 🔥 دالة لحذف البوست من UI (للـ socket events)
    removePost: (state, action: PayloadAction<string>) => {
      const postId = action.payload;
      state.posts = state.posts.filter(p => p._id !== postId);
      
      // Force immutability to trigger re-renders
      state.posts = [...state.posts];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state, action) => {
        if (action.meta.arg.refresh) {
          state.loading = true
          state.error = null
        } else {
          // Don't show loading for pagination
          state.error = null
        }
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        const { refresh = false, page: requestedPage = 1 } = action.meta.arg
        const newPosts = action.payload
        
        if (refresh) {
          // Refresh mode - replace all posts and ensure proper sorting
          state.posts = newPosts
          state.page = 1
          state.loading = false
          
          // Always sort posts by newest first for refresh
          state.posts.sort((a: PostType, b: PostType) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
        } else {
          // Pagination mode - append posts at the end without resorting
          // This maintains the scroll position and prevents posts from jumping around
          const existingIds = new Set(state.posts.map(post => post._id))
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id))
          
          // Simply append new posts at the end
          // The API should return posts in the correct order (newest first for page 1, older for page 2+)
          state.posts = [...state.posts, ...uniqueNewPosts]
          state.page = requestedPage + 1
          
          // Safety check: don't let page go too high
          if (state.page > 10) {
            state.page = 1
          }
        }
        
        // Check if we have more posts using pagination info
        const limit = action.meta.arg.limit || 10
        // If we got the full limit, there might be more
        state.hasMore = newPosts.length === limit

      })
              .addCase(fetchPosts.rejected, (state, action) => {
          state.loading = false
          state.error = action.error.message || 'Failed to fetch posts'
        })
      // Create Post
      .addCase(createPost.fulfilled, (state, action) => {
        // Add new post at the beginning since it's the newest
        const newPost = action.payload
        
        // Set hasAiSuggestions to true if the post contains code
        if (newPost.code && newPost.code.trim()) {
          newPost.hasAiSuggestions = true
        }
        
        state.posts.unshift(newPost)
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          state.posts[index] = {
            ...state.posts[index],
            ...action.payload,
            createdBy: action.payload.createdBy || state.posts[index].createdBy
          }
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p._id !== action.payload)
      })
      // Update post reactions (from reactions slice)
      .addCase(addPostReaction.fulfilled, (state, action) => {
        const { postId, reactions, userReactions } = action.payload
        const postIndex = state.posts.findIndex(p => p._id === postId)
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
    .addCase(fetchPostsByUser.pending, (state, action) => {
      if (action.meta.arg.refresh || action.meta.arg.page === 1) {
        state.loading = true
        state.error = null
      } else {
        // Don't show full loading for pagination
        state.error = null
      }
    })
    .addCase(fetchPostsByUser.fulfilled, (state, action) => {
      const { page: requestedPage = 1, limit = 10, refresh = requestedPage === 1 } = action.meta.arg
      const newPosts = action.payload
      
      if (refresh || requestedPage === 1) {
        // Refresh mode - replace all posts
        state.posts = newPosts
        state.page = 1
        state.loading = false
      } else {
        // Pagination mode - append posts
        const existingIds = new Set(state.posts.map(post => post._id))
        const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id))
        
        state.posts = [...state.posts, ...uniqueNewPosts]
        state.page = requestedPage + 1
      }
      
      // Check if we have more posts
      state.hasMore = newPosts.length === limit
      state.loading = false
    })
    .addCase(fetchPostsByUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch user posts';
    });
  }
})

export const { addPost, editPost, resetPosts, removePost } = postsSlice.actions

export default postsSlice.reducer
