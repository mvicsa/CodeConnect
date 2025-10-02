import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios, { isAxiosError } from 'axios'
import { PostType } from '@/types/post'
import { addPostReaction } from './reactionsSlice'
import { getAuthToken } from '@/lib/cookies'

// Use environment variable for API URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/posts`

type PostsState = {
  // Timeline posts (general posts)
  posts: PostType[]
  loading: boolean
  paginationLoading: boolean
  error: string | null
  hasMore: boolean
  page: number
  limit: number
  
  // Profile posts (user-specific posts)
  profilePosts: PostType[]
  profileAllPosts: PostType[] // All posts fetched from API
  profileLoading: boolean
  profilePaginationLoading: boolean
  profileError: string | null
  profileHasMore: boolean
  profilePage: number
  profileDisplayedCount: number // How many posts we're currently showing
  currentProfileUserId: string | null
}

const initialState: PostsState = {
  // Timeline posts
  posts: [],
  loading: false,
  paginationLoading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 10,
  
  // Profile posts
  profilePosts: [],
  profileAllPosts: [],
  profileLoading: true,
  profilePaginationLoading: false,
  profileError: null,
  profileHasMore: true,
  profilePage: 1,
  profileDisplayedCount: 0,
  currentProfileUserId: null
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
  async ({ userId, page = 1 }) => {
    // Only fetch from API on first page, for pagination we use client-side slicing
    if (page > 1) {
      // Add small delay to show skeleton for pagination
      await new Promise(resolve => setTimeout(resolve, 800))
      // Return empty array for pagination, we'll handle it client-side
      return []
    }
    
    const params = new URLSearchParams({ page: String(1), limit: String(100) }) // Get all posts
    const url = `${API_URL}/user/${userId}?${params.toString()}`
    const response = await axios.get(url)
    return response.data
  }
)

// Fetch post by ID
export const fetchPostById = createAsyncThunk<PostType, string>(
  'posts/fetchPostById',
  async (id, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API_URL}/${id}`, { headers })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return rejectWithValue('Unauthorized - Please log in again');
        }
        if (error.response?.status === 404) {
          return rejectWithValue('Post not found');
        }
      }
      return rejectWithValue('Failed to fetch post');
    }
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
      
      // Also add to profile posts if it matches the current profile user
      if (state.currentProfileUserId === action.payload.createdBy._id) {
        state.profileAllPosts.unshift(action.payload)
        state.profilePosts.unshift(action.payload)
        state.profileDisplayedCount = Math.min(state.profileDisplayedCount + 1, state.profileAllPosts.length)
      }
    },
    editPost: (state, action: PayloadAction<{ id: string; data: Partial<PostType> }>) => {
      // Update in timeline posts
      const index = state.posts.findIndex(p => p._id === action.payload.id)
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload.data }
      }
      
      // Update in profile posts
      const profileIndex = state.profilePosts.findIndex(p => p._id === action.payload.id)
      if (profileIndex !== -1) {
        state.profilePosts[profileIndex] = { ...state.profilePosts[profileIndex], ...action.payload.data }
      }
      
      // Update in profile all posts
      const profileAllIndex = state.profileAllPosts.findIndex(p => p._id === action.payload.id)
      if (profileAllIndex !== -1) {
        state.profileAllPosts[profileAllIndex] = { ...state.profileAllPosts[profileAllIndex], ...action.payload.data }
      }
    },
    resetPosts: (state) => {
      state.posts = []
      state.page = 1
      state.hasMore = true
      state.error = null
      state.loading = false
      state.paginationLoading = false
    },
    resetProfilePosts: (state) => {
      state.profilePosts = []
      state.profileAllPosts = []
      state.profilePage = 1
      state.profileDisplayedCount = 0
      state.profileHasMore = true
      state.profileError = null
      state.profileLoading = false
      state.profilePaginationLoading = false
      state.currentProfileUserId = null
    },
    // 🔥 دالة لحذف البوست من UI (للـ socket events)
    removePost: (state, action: PayloadAction<string>) => {
      const postId = action.payload;
      
      // Remove from timeline posts
      state.posts = state.posts.filter(p => p._id !== postId);
      // Force immutability to trigger re-renders
      state.posts = [...state.posts];
      
      // Remove from profile posts
      state.profilePosts = state.profilePosts.filter(p => p._id !== postId);
      // Force immutability to trigger re-renders
      state.profilePosts = [...state.profilePosts];
      
      // Remove from profile all posts
      state.profileAllPosts = state.profileAllPosts.filter(p => p._id !== postId);
      state.profileAllPosts = [...state.profileAllPosts];
      
      // Update displayed count
      state.profileDisplayedCount = Math.min(state.profileDisplayedCount, state.profileAllPosts.length);
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
          // Show pagination loading for Load More
          state.paginationLoading = true
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
          state.paginationLoading = false
          
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
        state.paginationLoading = false
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
        const updatedPost = action.payload
        
        // Update in timeline posts
        const index = state.posts.findIndex(p => p._id === updatedPost._id)
        if (index !== -1) {
          state.posts[index] = {
            ...state.posts[index],
            ...updatedPost,
            createdBy: updatedPost.createdBy || state.posts[index].createdBy
          }
        }
        
        // Update in profile posts
        const profileIndex = state.profilePosts.findIndex(p => p._id === updatedPost._id)
        if (profileIndex !== -1) {
          state.profilePosts[profileIndex] = {
            ...state.profilePosts[profileIndex],
            ...updatedPost,
            createdBy: updatedPost.createdBy || state.profilePosts[profileIndex].createdBy
          }
        }
        
        // Update in profile all posts
        const profileAllIndex = state.profileAllPosts.findIndex(p => p._id === updatedPost._id)
        if (profileAllIndex !== -1) {
          state.profileAllPosts[profileAllIndex] = {
            ...state.profileAllPosts[profileAllIndex],
            ...updatedPost,
            createdBy: updatedPost.createdBy || state.profileAllPosts[profileAllIndex].createdBy
          }
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        const deletedPostId = action.payload
        
        // Remove from timeline posts
        state.posts = state.posts.filter(p => p._id !== deletedPostId)
        
        // Remove from profile posts
        state.profilePosts = state.profilePosts.filter(p => p._id !== deletedPostId)
        
        // Remove from profile all posts
        state.profileAllPosts = state.profileAllPosts.filter(p => p._id !== deletedPostId)
        
        // Update profile displayed count
        state.profileDisplayedCount = Math.min(state.profileDisplayedCount, state.profileAllPosts.length)
      })
      // Fetch Post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false
        // Add the post to the posts array if it doesn't exist
        const existingPostIndex = state.posts.findIndex(p => p._id === action.payload._id)
        if (existingPostIndex === -1) {
          state.posts.unshift(action.payload)
        } else {
          // Update existing post
          state.posts[existingPostIndex] = action.payload
        }
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch post'
      })
      // Update post reactions (from reactions slice)
      .addCase(addPostReaction.fulfilled, (state, action) => {
        const { postId, reactions, userReactions } = action.payload
        
        // Update in timeline posts
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
        
        // Update in profile posts
        const profilePostIndex = state.profilePosts.findIndex(p => p._id === postId)
        if (profilePostIndex !== -1) {
          const currentProfilePost = state.profilePosts[profilePostIndex]
          const currentReactions = currentProfilePost.reactions || { like: 0, love: 0, wow: 0, funny: 0, dislike: 0 }
          const currentUserReactions = currentProfilePost.userReactions || []
          
          const reactionsChanged = 
            currentReactions.like !== reactions.like ||
            currentReactions.love !== reactions.love ||
            currentReactions.wow !== reactions.wow ||
            currentReactions.funny !== reactions.funny ||
            currentReactions.dislike !== reactions.dislike ||
            currentUserReactions.length !== userReactions.length ||
            JSON.stringify(currentUserReactions) !== JSON.stringify(userReactions)
          
          if (reactionsChanged) {
            state.profilePosts[profilePostIndex] = {
              ...currentProfilePost,
              reactions,
              userReactions
            }
          }
        }
        
        // Update in profile all posts
        const profileAllPostIndex = state.profileAllPosts.findIndex(p => p._id === postId)
        if (profileAllPostIndex !== -1) {
          const currentProfileAllPost = state.profileAllPosts[profileAllPostIndex]
          const currentReactions = currentProfileAllPost.reactions || { like: 0, love: 0, wow: 0, funny: 0, dislike: 0 }
          const currentUserReactions = currentProfileAllPost.userReactions || []
          
          const reactionsChanged = 
            currentReactions.like !== reactions.like ||
            currentReactions.love !== reactions.love ||
            currentReactions.wow !== reactions.wow ||
            currentReactions.funny !== reactions.funny ||
            currentReactions.dislike !== reactions.dislike ||
            currentUserReactions.length !== userReactions.length ||
            JSON.stringify(currentUserReactions) !== JSON.stringify(userReactions)
          
          if (reactionsChanged) {
            state.profileAllPosts[profileAllPostIndex] = {
              ...currentProfileAllPost,
              reactions,
              userReactions
            }
          }
        }
      })
    .addCase(fetchPostsByUser.pending, (state, action) => {
      const { userId } = action.meta.arg
      
      // If switching to a different user, clear the posts immediately
      if (state.currentProfileUserId !== userId) {
        state.profilePosts = []
        state.profileAllPosts = []
        state.profileDisplayedCount = 0
        state.currentProfileUserId = userId
      }
      
      if (action.meta.arg.refresh || action.meta.arg.page === 1) {
        state.profileLoading = true
        state.profileError = null
      } else {
        // Show pagination loading for Load More
        state.profilePaginationLoading = true
        state.profileError = null
      }
    })
    .addCase(fetchPostsByUser.fulfilled, (state, action) => {
      const { page: requestedPage = 1, limit = 10, refresh = requestedPage === 1, userId } = action.meta.arg
      const newPosts = action.payload
      
      // Ensure we're still on the same user (in case of race conditions)
      if (state.currentProfileUserId === userId) {
        if (refresh || requestedPage === 1) {
          // First load - store all posts and show first batch
          state.profileAllPosts = newPosts
          state.profileDisplayedCount = Math.min(limit, newPosts.length)
          state.profilePosts = newPosts.slice(0, state.profileDisplayedCount)
          state.profilePage = 1
          state.profileLoading = false
          
          // Check if we have more posts to show
          state.profileHasMore = state.profileDisplayedCount < newPosts.length
        } else {
          // Load more - show more posts from the already fetched data
          const newDisplayedCount = Math.min(
            state.profileDisplayedCount + limit,
            state.profileAllPosts.length
          )
          
          state.profilePosts = state.profileAllPosts.slice(0, newDisplayedCount)
          state.profileDisplayedCount = newDisplayedCount
          state.profilePage = requestedPage + 1
          state.profilePaginationLoading = false
          
          // Check if we have more posts to show
          state.profileHasMore = state.profileDisplayedCount < state.profileAllPosts.length
        }
        
        state.profileLoading = false
      }
    })
    .addCase(fetchPostsByUser.rejected, (state, action) => {
      state.profileLoading = false;
      state.profilePaginationLoading = false;
      state.profileError = action.error.message || 'Failed to fetch user posts';
    });
  }
})

export const { addPost, editPost, resetPosts, resetProfilePosts, removePost } = postsSlice.actions

export default postsSlice.reducer
