import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/lib/axios';

export interface Spark {
  _id: string;
  userId: string;
  files: Record<string, { code: string; active?: boolean }>;
  title: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  previewImage?: string; // <-- Add previewImage for sparks
  forkedFrom?: {
    owner?: {
      _id: string;
      username: string;
    };
    _id?: string;
  };
}

interface SparksState {
  sparks: Spark[];
  allSparks: Spark[];
  currentSpark: Spark | null;
  loading: boolean;
  error: string | null;
  ratings: Record<string, { average: number; userRating?: number; ratings: Array<{ userId: string; value: number }> }>;
  // Pagination state
  allSparksPage: number;
  allSparksHasMore: boolean;
  allSparksLoading: boolean;
  allSparksTotalPages?: number;
  allSparksTotalItems?: number;
  userSparksPage: number;
  userSparksHasMore: boolean;
  userSparksLoading: boolean;
  userSparksTotalPages?: number;
  userSparksTotalItems?: number;
}

const initialState: SparksState = {
  sparks: [],
  allSparks: [],
  currentSpark: null,
  loading: false,
  error: null,
  ratings: {},
  // Pagination initial state
  allSparksPage: 1,
  allSparksHasMore: true,
  allSparksLoading: false,
  allSparksTotalPages: undefined,
  allSparksTotalItems: undefined,
  userSparksPage: 1,
  userSparksHasMore: true,
  userSparksLoading: false,
  userSparksTotalPages: undefined,
  userSparksTotalItems: undefined,
};

// Async thunks
export const fetchSparkById = createAsyncThunk<Spark, string>(
  'sparks/fetchSparkById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/sparks/${id}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch spark');
    }
  }
);

export const fetchSparksByUser = createAsyncThunk<
  { data: Spark[]; page: number; loadMore: boolean; hasMore: boolean; totalPages?: number; totalItems?: number },
  { userId: string; page?: number; limit?: number; loadMore?: boolean }
>(
  'sparks/fetchSparksByUser',
  async ({ userId, page = 1, limit = 12, loadMore = false }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/sparks/user/${userId}?page=${page}&limit=${limit}`);
      const data = res.data;
      
      // Calculate if there are more pages based on the response
      const hasMore = data.length === limit; // If we got exactly the limit, there might be more
      
      return { 
        data, 
        page, 
        loadMore, 
        hasMore,
        totalPages: res.headers['x-total-pages'] ? parseInt(res.headers['x-total-pages']) : undefined,
        totalItems: res.headers['x-total-count'] ? parseInt(res.headers['x-total-count']) : undefined
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sparks');
    }
  }
);

export const createSpark = createAsyncThunk<Spark, { files: any; title: string; previewImage?: string }>(
  'sparks/createSpark',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post('/sparks', payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create spark');
    }
  }
);

export const updateSpark = createAsyncThunk<Spark, { id: string; files?: any; title?: string; previewImage?: string }>(
  'sparks/updateSpark',
  async (payload, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const res = await axios.put(`/sparks/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update spark');
    }
  }
);

export const deleteSpark = createAsyncThunk<string, string>(
  'sparks/deleteSpark',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/sparks/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete spark');
    }
  }
);

export const rateSpark = createAsyncThunk<
  { average: number; userRating: number; ratings: any[] },
  { id: string; value: number }
>(
  'sparks/rateSpark',
  async ({ id, value }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/sparks/${id}/rate`, { value });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to rate spark');
    }
  }
);

export const fetchSparkRatings = createAsyncThunk<{ average: number; ratings: any[]; userRating?: number }, string>(
  'sparks/fetchSparkRatings',
  async (id, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get(`/sparks/${id}/ratings`);
      const userId = (getState() as any).auth.user?._id;
      const userRating = userId
        ? res.data.ratings.find((r: any) => r.userId === userId)?.value
        : undefined;
      return {
        average: res.data.averageRating,
        ratings: res.data.ratings,
        userRating,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch ratings');
    }
  }
);

export const fetchAllSparks = createAsyncThunk<
  { data: Spark[]; page: number; loadMore: boolean; hasMore: boolean; totalPages?: number; totalItems?: number },
  { page?: number; limit?: number; loadMore?: boolean }
>(
  'sparks/fetchAllSparks',
  async ({ page = 1, limit = 12, loadMore = false } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/sparks?page=${page}&limit=${limit}`);
      const data = res.data;
      
      // Calculate if there are more pages based on the response
      const hasMore = data.length === limit; // If we got exactly the limit, there might be more
      
      return { 
        data, 
        page, 
        loadMore, 
        hasMore,
        totalPages: res.headers['x-total-pages'] ? parseInt(res.headers['x-total-pages']) : undefined,
        totalItems: res.headers['x-total-count'] ? parseInt(res.headers['x-total-count']) : undefined
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sparks');
    }
  }
);

export const forkSpark = createAsyncThunk<Spark, string>(
  'sparks/forkSpark',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/sparks/${id}/fork`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fork spark');
    }
  }
);

const sparksSlice = createSlice({
  name: 'sparks',
  initialState,
  reducers: {
    setCurrentSpark(state, action: PayloadAction<Spark | null>) {
      state.currentSpark = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSparkById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSparkById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSpark = action.payload;
      })
      .addCase(fetchSparkById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSparksByUser.pending, (state) => {
        state.userSparksLoading = true;
        state.error = null;
      })
      .addCase(fetchSparksByUser.fulfilled, (state, action) => {
        state.userSparksLoading = false;
        const { data, page, loadMore, hasMore, totalPages, totalItems } = action.payload;
        if (loadMore) {
          state.sparks = [...state.sparks, ...data];
        } else {
          state.sparks = data;
        }
        state.userSparksPage = page;
        state.userSparksHasMore = hasMore;
        state.userSparksTotalPages = totalPages;
        state.userSparksTotalItems = totalItems;
      })
      .addCase(fetchSparksByUser.rejected, (state, action) => {
        state.userSparksLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createSpark.fulfilled, (state, action) => {
        state.sparks.unshift(action.payload);
        state.currentSpark = action.payload;
      })
      .addCase(updateSpark.fulfilled, (state, action) => {
        state.currentSpark = action.payload;
        const idx = state.sparks.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.sparks[idx] = action.payload;
      })
      .addCase(deleteSpark.fulfilled, (state, action) => {
        state.sparks = state.sparks.filter(s => s._id !== action.payload);
        if (state.currentSpark?._id === action.payload) state.currentSpark = null;
      })
      .addCase(fetchSparkRatings.fulfilled, (state, action) => {
        state.ratings[action.meta.arg] = action.payload;
      })
      .addCase(rateSpark.fulfilled, (state, action) => {
        const sparkId = action.meta.arg.id;
        if (!state.ratings[sparkId]) {
          state.ratings[sparkId] = { average: 0, ratings: [], userRating: 0 };
        }
        state.ratings[sparkId].average = action.payload.average;
        state.ratings[sparkId].userRating = action.payload.userRating;
        if (action.payload.ratings) {
          state.ratings[sparkId].ratings = action.payload.ratings;
        }
      })
      .addCase(forkSpark.fulfilled, (state, action) => {
        state.sparks.unshift(action.payload);
      })
      .addCase(fetchAllSparks.pending, (state) => {
        state.allSparksLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSparks.fulfilled, (state, action) => {
        state.allSparksLoading = false;
        const { data, page, loadMore, hasMore, totalPages, totalItems } = action.payload;
        if (loadMore) {
          state.allSparks = [...state.allSparks, ...data];
        } else {
          state.allSparks = data;
        }
        state.allSparksPage = page;
        state.allSparksHasMore = hasMore;
        state.allSparksTotalPages = totalPages;
        state.allSparksTotalItems = totalItems;
      })
      .addCase(fetchAllSparks.rejected, (state, action) => {
        state.allSparksLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentSpark } = sparksSlice.actions;
export default sparksSlice.reducer; 