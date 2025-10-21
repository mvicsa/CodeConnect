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
  aiSuggestionsCount: Record<string, number>
  isLoaded: Record<string, boolean> // Track if AI suggestions data for a post has been loaded
}

const initialState: AiSuggestionsState = {
  suggestions: {},
  loading: {},
  error: {},
  aiSuggestionsCount: {},
  isLoaded: {}
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
  reducers: {
    updateAiSuggestionsCount: (state, action: { payload: { postId: string; count: number } }) => {
      state.aiSuggestionsCount[action.payload.postId] = action.payload.count
    },
    incrementAiSuggestionsCount: (state, action: { payload: string }) => {
      const postId = action.payload
      state.aiSuggestionsCount[postId] = (state.aiSuggestionsCount[postId] || 0) + 1
    },
    decrementAiSuggestionsCount: (state, action: { payload: string }) => {
      const postId = action.payload
      state.aiSuggestionsCount[postId] = Math.max(0, (state.aiSuggestionsCount[postId] || 0) - 1)
    }
  },
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
        // Update count when suggestions are fetched
        state.aiSuggestionsCount[postId] = action.payload ? 1 : 0
        state.isLoaded[postId] = true; // Mark as loaded
      })
      .addCase(fetchCodeSuggestions.rejected, (state, action) => {
        const postId = action.meta.arg
        state.loading[postId] = false
        state.error[postId] = action.payload ? (action.payload as { message: string }).message : 'Unknown error'
        // Set count to 0 if fetch failed
        state.aiSuggestionsCount[postId] = 0
      })
  }
})

export const { updateAiSuggestionsCount, incrementAiSuggestionsCount, decrementAiSuggestionsCount } = aiSuggestionsSlice.actions

export default aiSuggestionsSlice.reducer 