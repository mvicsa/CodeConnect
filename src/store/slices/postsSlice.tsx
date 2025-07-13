import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { PostType } from '@/types/post'

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
    deletePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(p => p.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
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
  }
})

export const { addPost, editPost, deletePost } = postsSlice.actions

export default postsSlice.reducer
