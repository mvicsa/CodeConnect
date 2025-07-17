import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Types for AI suggestions
interface CodeSuggestion {
  _id: string
  postId: string
  suggestions: string
  createdAt: string
  updatedAt: string
}

interface AiSuggestionsState {
  suggestions: Record<string, CodeSuggestion>
  loading: Record<string, boolean>
  error: Record<string, string | null>
}

const initialState: AiSuggestionsState = {
  suggestions: {},
  loading: {},
  error: {}
}

// API URL configuration
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/posts`

// Fetch code suggestions for a post
export const fetchCodeSuggestions = createAsyncThunk<CodeSuggestion, string>(
  'aiSuggestions/fetchCodeSuggestions',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await axios.get<CodeSuggestion>(`${API_URL}/${postId}/code-suggestions`)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return rejectWithValue({ message: 'No suggestions available for this post.' })
      }
      return rejectWithValue({ message: 'Failed to fetch code suggestions' })
    }
  }
)

const aiSuggestionsSlice = createSlice({
  name: 'aiSuggestions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCodeSuggestions.pending, (state, action) => {
        const postId = action.meta.arg
        state.loading[postId] = true
        state.error[postId] = null
      })
      .addCase(fetchCodeSuggestions.fulfilled, (state, action) => {
        const postId = action.meta.arg
        state.loading[postId] = false
        state.suggestions[postId] = action.payload
      })
      .addCase(fetchCodeSuggestions.rejected, (state, action) => {
        const postId = action.meta.arg
        state.loading[postId] = false
        state.error[postId] = action.payload ? (action.payload as { message: string }).message : 'Unknown error'
      })
  }
})

export default aiSuggestionsSlice.reducer 