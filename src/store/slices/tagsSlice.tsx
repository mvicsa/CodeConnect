import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { PostType } from '@/types/post'

// Use environment variable for API URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/posts`

type TagInfo = {
  name: string
  count: number
}

type TagsState = {
  allTags: TagInfo[]
  postsByTag: PostType[]
  currentTag: string | null
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  limit: number
}

const initialState: TagsState = {
  allTags: [],
  postsByTag: [],
  currentTag: null,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 10
}

// Fetch all tags with post counts
export const fetchAllTags = createAsyncThunk<TagInfo[]>(
  'tags/fetchAllTags',
  async () => {
    const response = await axios.get(`${API_URL}/tags`)
    return response.data
  }
)

// Fetch posts by tag with pagination
export const fetchPostsByTag = createAsyncThunk<PostType[], { tag: string; page?: number; limit?: number; refresh?: boolean }>(
  'tags/fetchPostsByTag',
  async ({ tag, page = 1, limit = 10 }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const url = `${API_URL}/tag/${encodeURIComponent(tag)}?${params.toString()}`
    const response = await axios.get(url)
    return response.data
  }
)

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    setCurrentTag: (state, action: PayloadAction<string | null>) => {
      state.currentTag = action.payload
    },
    resetPostsByTag: (state) => {
      state.postsByTag = []
      state.page = 1
      state.hasMore = true
      state.error = null
    },
    clearTagsState: (state) => {
      state.allTags = []
      state.postsByTag = []
      state.currentTag = null
      state.loading = false
      state.error = null
      state.hasMore = true
      state.page = 1
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Tags
      .addCase(fetchAllTags.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllTags.fulfilled, (state, action) => {
        state.allTags = action.payload
        state.loading = false
      })
      .addCase(fetchAllTags.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch tags'
      })
      // Fetch Posts By Tag
      .addCase(fetchPostsByTag.pending, (state, action) => {
        if (action.meta.arg.refresh) {
          state.loading = true
          state.error = null
        } else {
          // Don't show loading for pagination
          state.error = null
        }
      })
      .addCase(fetchPostsByTag.fulfilled, (state, action) => {
        const { refresh = false, page: requestedPage = 1 } = action.meta.arg
        const newPosts = action.payload
        
        if (refresh) {
          // Refresh mode - replace all posts
          state.postsByTag = newPosts
          state.page = 1
          state.loading = false
          
          // Sort posts by newest first
          state.postsByTag.sort((a: PostType, b: PostType) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
        } else {
          // Pagination mode - append posts
          const existingIds = new Set(state.postsByTag.map(post => post._id))
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id))
          
          state.postsByTag = [...state.postsByTag, ...uniqueNewPosts]
          state.page = requestedPage + 1
        }
        
        // Check if we have more posts
        const limit = action.meta.arg.limit || 10
        state.hasMore = newPosts.length === limit
        state.loading = false
      })
      .addCase(fetchPostsByTag.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch posts by tag'
      })
  }
})

export const { setCurrentTag, resetPostsByTag, clearTagsState } = tagsSlice.actions

export default tagsSlice.reducer 