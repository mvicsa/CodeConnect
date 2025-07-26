import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blockService } from '@/services/blockAPI';
import { Block, BlockStatus, BlockStats, BlockUser } from '@/types/block';

// Async thunks
export const blockUser = createAsyncThunk(
  'block/blockUser',
  async ({ blockedId, reason }: { blockedId: string; reason?: string }, { rejectWithValue }) => {
    try {
      return await blockService.blockUser(blockedId, reason);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to block user');
    }
  }
);

export const unblockUser = createAsyncThunk(
  'block/unblockUser',
  async (blockedId: string, { rejectWithValue }) => {
    try {
      const result = await blockService.unblockUser(blockedId);
      return { blockedId, result };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to unblock user');
    }
  }
);

export const checkBlockStatus = createAsyncThunk(
  'block/checkStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await blockService.checkBlockRelationship(userId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to check block status');
    }
  }
);

export const fetchBlockedUsers = createAsyncThunk(
  'block/fetchBlockedUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await blockService.getBlockedUsers();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch blocked users');
    }
  }
);

export const fetchBlockedByUsers = createAsyncThunk(
  'block/fetchBlockedByUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await blockService.getBlockedByUsers();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch blocked by users');
    }
  }
);

export const fetchBlockStats = createAsyncThunk(
  'block/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await blockService.getBlockStats();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch block stats');
    }
  }
);

interface BlockState {
  blockedUsers: BlockUser[];
  blockedByUsers: BlockUser[];
  blockStatuses: Record<string, BlockStatus>;
  stats: BlockStats | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
}

const initialState: BlockState = {
  blockedUsers: [],
  blockedByUsers: [],
  blockStatuses: {},
  stats: null,
  loading: false,
  error: null,
  actionLoading: false,
};

const blockSlice = createSlice({
  name: 'block',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBlockStatus: (state, action) => {
      const userId = action.payload;
      delete state.blockStatuses[userId];
    },
    setBlockStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.blockStatuses[userId] = status;
    },
  },
  extraReducers: (builder) => {
    builder
      // Block user
      .addCase(blockUser.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;
        
        // Optimistic update - immediately update block status
        const blockedId = action.meta.arg.blockedId;
        if (state.blockStatuses[blockedId]) {
          state.blockStatuses[blockedId].isBlocked = true;
        } else {
          state.blockStatuses[blockedId] = {
            isBlocked: true,
            isBlockedBy: false
          };
        }
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        const blockedUser = state.blockedUsers.find(user => user._id === action.payload.blockedId);
        if (!blockedUser) {
          // Add to blocked users list if not already there
          state.blockedUsers.push({
            _id: action.payload.blockedId,
            name: '', // Will be populated when fetching blocked users
            username: '',
            avatar: '',
            block: action.payload,
          });
        }
        
        // Update block status immediately
        const blockedId = action.payload.blockedId;
        if (state.blockStatuses[blockedId]) {
          state.blockStatuses[blockedId].isBlocked = true;
          state.blockStatuses[blockedId].block = action.payload;
        } else {
          state.blockStatuses[blockedId] = {
            isBlocked: true,
            isBlockedBy: false,
            block: action.payload
          };
        }
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
        
        // Revert optimistic update on error
        const blockedId = action.meta.arg.blockedId;
        if (state.blockStatuses[blockedId]) {
          state.blockStatuses[blockedId].isBlocked = false;
        }
      })
      // Unblock user
      .addCase(unblockUser.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;
        
        // Optimistic update - immediately update block status
        const blockedId = action.meta.arg;
        if (state.blockStatuses[blockedId]) {
          state.blockStatuses[blockedId].isBlocked = false;
        }
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { blockedId } = action.payload;
        state.blockedUsers = state.blockedUsers.filter(user => user._id !== blockedId);
        
        // Update block status immediately
        if (state.blockStatuses[blockedId]) {
          state.blockStatuses[blockedId].isBlocked = false;
          state.blockStatuses[blockedId].block = undefined;
        }
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
        
        // Revert optimistic update on error
        const blockedId = action.meta.arg;
        if (state.blockStatuses[blockedId]) {
          state.blockStatuses[blockedId].isBlocked = true;
        }
      })
      // Check block status
      .addCase(checkBlockStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkBlockStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Store the status for the user
        const userId = action.meta.arg;
        state.blockStatuses[userId] = action.payload;
      })
      .addCase(checkBlockStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch blocked users
      .addCase(fetchBlockedUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.blockedUsers = action.payload;
      })
      .addCase(fetchBlockedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch blocked by users
      .addCase(fetchBlockedByUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlockedByUsers.fulfilled, (state, action) => {
        state.loading = false;
        console.log('fetchBlockedByUsers fulfilled with data:', action.payload);
        state.blockedByUsers = action.payload;
      })
      .addCase(fetchBlockedByUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch block stats
      .addCase(fetchBlockStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlockStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchBlockStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearBlockStatus, setBlockStatus } = blockSlice.actions;
export default blockSlice.reducer; 