import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { PostType } from '@/types/post';
import { User } from '@/types/user';

interface SearchState {
  posts: PostType[];
  users: User[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  lastQuery: string;
}

const initialState: SearchState = {
  posts: [],
  users: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: false,
  lastQuery: '',
};

function getAuthHeaders() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const searchAll = createAsyncThunk<
  { posts: PostType[]; users: User[]; hasMore: boolean },
  { query: string; limit?: number }
>('search/searchAll', async ({ query, limit = 10 }, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();
    const url = `${API_URL}/search`;
    const response = await axios.get(url, {
      params: { q: query, page: 1, limit },
      headers,
    });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return rejectWithValue((axiosError.response?.data as { message?: string })?.message || 'Search failed');
    }
    return rejectWithValue('Search failed');
  }
});

export const loadMoreSearch = createAsyncThunk<
  { posts: PostType[]; users: User[]; hasMore: boolean },
  { query: string; page: number; limit?: number }
>('search/loadMoreSearch', async ({ query, page, limit = 10 }, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();
    const url = `${API_URL}/search`;
    const response = await axios.get(url, {
      params: { q: query, page, limit },
      headers,
    });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return rejectWithValue((axiosError.response?.data as { message?: string })?.message || 'Load more failed');
    }
    return rejectWithValue('Load more failed');
  }
});

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.posts = [];
      state.users = [];
      state.error = null;
      state.loading = false;
      state.page = 1;
      state.hasMore = false;
      state.lastQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchAll.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.page = 1;
        state.hasMore = false;
      })
      .addCase(searchAll.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts;
        state.users = action.payload.users;
        state.hasMore = action.payload.hasMore;
        state.page = 2;
        // Save last query for load more
        if (action.meta && action.meta.arg && action.meta.arg.query) {
          state.lastQuery = action.meta.arg.query;
        }
      })
      .addCase(searchAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Search failed';
      })
      .addCase(loadMoreSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMoreSearch.fulfilled, (state, action: PayloadAction<{ posts: PostType[]; users: User[]; hasMore: boolean }>) => {
        state.loading = false;
        // Append new results
        state.posts = [...state.posts, ...action.payload.posts];
        state.users = [...state.users, ...action.payload.users];
        state.hasMore = action.payload.hasMore;
        state.page += 1;
      })
      .addCase(loadMoreSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Load more failed';
      });
  },
});

export const { clearSearch } = searchSlice.actions;
export default searchSlice.reducer; 