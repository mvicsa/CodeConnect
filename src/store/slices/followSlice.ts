import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PaginatedListState {
  items: string[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  skip: number;
  limit: number;
}

interface FollowState {
  followers: PaginatedListState;
  following: PaginatedListState;
}

const defaultPageSize = 20;

const initialState: FollowState = {
  followers: { items: [], loading: false, error: null, hasMore: true, skip: 0, limit: defaultPageSize },
  following: { items: [], loading: false, error: null, hasMore: true, skip: 0, limit: defaultPageSize },
};

// Paginated fetch followers
export const fetchFollowers = createAsyncThunk(
  'follow/fetchFollowers',
  async ({ userId, limit, skip }: { userId: string; limit?: number; skip?: number }, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      const response = await axios.get(`${API_URL}/users/${userId}/followers?limit=${limit || defaultPageSize}&skip=${skip || 0}`,
        { headers: { Authorization: `Bearer ${token}` } });
      return { items: response.data, limit: limit || defaultPageSize, skip: skip || 0 };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch followers');
    }
  }
);

// Paginated fetch following
export const fetchFollowing = createAsyncThunk(
  'follow/fetchFollowing',
  async ({ userId, limit, skip }: { userId: string; limit?: number; skip?: number }, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      const response = await axios.get(`${API_URL}/users/${userId}/following?limit=${limit || defaultPageSize}&skip=${skip || 0}`,
        { headers: { Authorization: `Bearer ${token}` } });
      return { items: response.data, limit: limit || defaultPageSize, skip: skip || 0 };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch following');
    }
  }
);

// Follow a user
export const followUser = createAsyncThunk(
  'follow/followUser',
  async ({ userId, targetId }: { userId: string; targetId: string }, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      const response = await axios.post(`${API_URL}/users/${userId}/follow/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to follow user');
    }
  }
);

// Unfollow a user
export const unfollowUser = createAsyncThunk(
  'follow/unfollowUser',
  async ({ userId, targetId }: { userId: string; targetId: string }, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      const response = await axios.delete(`${API_URL}/users/${userId}/unfollow/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to unfollow user');
    }
  }
);

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {
    resetFollowers(state) {
      state.followers = { ...initialState.followers };
    },
    resetFollowing(state) {
      state.following = { ...initialState.following };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowers.pending, (state) => {
        state.followers.loading = true;
        state.followers.error = null;
      })
      .addCase(fetchFollowers.fulfilled, (state, action: PayloadAction<{ items: string[]; limit: number; skip: number }>) => {
        state.followers.loading = false;
        if (action.payload.skip === 0) {
          state.followers.items = action.payload.items;
        } else {
          state.followers.items = [...state.followers.items, ...action.payload.items];
        }
        state.followers.skip = action.payload.skip + action.payload.items.length;
        state.followers.limit = action.payload.limit;
        state.followers.hasMore = action.payload.items.length === action.payload.limit;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.followers.loading = false;
        state.followers.error = action.payload as string;
      })
      .addCase(fetchFollowing.pending, (state) => {
        state.following.loading = true;
        state.following.error = null;
      })
      .addCase(fetchFollowing.fulfilled, (state, action: PayloadAction<{ items: string[]; limit: number; skip: number }>) => {
        state.following.loading = false;
        if (action.payload.skip === 0) {
          state.following.items = action.payload.items;
        } else {
          state.following.items = [...state.following.items, ...action.payload.items];
        }
        state.following.skip = action.payload.skip + action.payload.items.length;
        state.following.limit = action.payload.limit;
        state.following.hasMore = action.payload.items.length === action.payload.limit;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.following.loading = false;
        state.following.error = action.payload as string;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        // Optionally update state.following/followers if needed
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        // Optionally update state.following/followers if needed
      });
  },
});

export const { resetFollowers, resetFollowing } = followSlice.actions;
export default followSlice.reducer; 