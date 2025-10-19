import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '@/lib/axios';
import {
  EarningsDashboardData,
  QuickStats,
  EarningsHistory,
  PurchasesHistory,
  BalanceSummary,
  EscrowSummary,
  EarningsEscrow,
  Pagination,
  ApiResponse,
  EarningsHistoryResponse,
  PurchasesHistoryResponse,
  EscrowsResponse,
  WithdrawalHistory,
  WithdrawalsHistoryResponse,
  RecentActivity,
} from '@/types/earnings';
import {
  getEarningsDashboard,
  getQuickStats,
  getMyEarnings,
  getMyPurchases,
  getBalanceSummary,
  getEscrowSummary,
  getEscrows,
  getRecentActivities,
  getMyWithdrawals
} from '@/lib/earnings';
import { EARNINGS_HISTORY_LIMIT, PURCHASES_HISTORY_LIMIT, ESCROWS_LIMIT, WITHDRAWALS_HISTORY_LIMIT } from '@/constants/pagination';

interface EarningsState {
  dashboardData: EarningsDashboardData | null;
  quickStats: QuickStats | null;
  earningsHistory: EarningsHistory[];
  purchasesHistory: PurchasesHistory[];
  withdrawalsHistory: WithdrawalHistory[];
  recentActivities: RecentActivity[];
  balanceSummary: BalanceSummary | null;
  escrowSummary: EscrowSummary | null;
  escrows: EarningsEscrow[];
  earningsHistoryPagination: Pagination;
  purchasesHistoryPagination: Pagination;
  withdrawalsHistoryPagination: Pagination;
  recentActivitiesPagination: Pagination;
  escrowsPagination: Pagination;
  dashboardLoading: boolean;
  quickStatsLoading: boolean;
  earningsHistoryLoading: boolean;
  purchasesHistoryLoading: boolean;
  withdrawalsHistoryLoading: boolean;
  recentActivitiesLoading: boolean;
  balanceSummaryLoading: boolean;
  escrowSummaryLoading: boolean;
  escrowsLoading: boolean;
  withdrawLoading: boolean;
  error: string | null;
}

const initialPagination: Pagination = {
  page: 1,
  limit: EARNINGS_HISTORY_LIMIT,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

const initialState: EarningsState = {
  dashboardData: {
    stats: {
      totalEarnings: 0,
      totalSpent: 0,
      availableBalance: 0,
      pendingEarnings: 0,
      totalSessionsCreated: 0,
      totalSessionsPurchased: 0,
      totalParticipants: 0,
      currency: 'USD',
    },
    recentActivities: [],
    monthlyEarnings: [],
    monthlyPurchases: [],
  },
  quickStats: {
    totalEarnings: 0,
    totalSpent: 0,
    availableBalance: 0,
    pendingEarnings: 0,
    totalSessionsCreated: 0,
    totalSessionsPurchased: 0,
    totalParticipants: 0,
    currency: 'USD',
  },
  earningsHistory: [],
  purchasesHistory: [],
  withdrawalsHistory: [],
  recentActivities: [],
  balanceSummary: null,
  escrowSummary: null,
  escrows: [],
  earningsHistoryPagination: initialPagination,
  purchasesHistoryPagination: initialPagination,
  withdrawalsHistoryPagination: initialPagination,
  recentActivitiesPagination: initialPagination,
  escrowsPagination: initialPagination,
  dashboardLoading: true,
  quickStatsLoading: true,
  earningsHistoryLoading: true,
  purchasesHistoryLoading: true,
  withdrawalsHistoryLoading: true,
  recentActivitiesLoading: true,
  balanceSummaryLoading: true,
  escrowSummaryLoading: true,
  escrowsLoading: true,
  withdrawLoading: false,
  error: null,
};

// Helper function for error handling
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Helper to extract data from API response
const extractData = <T>(response: ApiResponse<T> | T): T => {
  // Check if response has a 'data' property (ApiResponse structure)
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  // Otherwise, return response as-is
  return response as T;
};

// Async Thunks
export const fetchEarningsDashboard = createAsyncThunk<
  EarningsDashboardData,
  { startDate?: string; endDate?: string } | void,
  { rejectValue: string }
>(
  'earnings/fetchEarningsDashboard',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getEarningsDashboard(params || undefined);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchQuickStats = createAsyncThunk<
  QuickStats,
  void,
  { rejectValue: string }
>(
  'earnings/fetchQuickStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getQuickStats();
      return extractData(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchEarningsHistory = createAsyncThunk<
  EarningsHistoryResponse,
  { 
    page?: number; 
    limit?: number; 
    startDate?: string; 
    endDate?: string; 
    currency?: string;
    search?: string;
  },
  { rejectValue: string }
>(
  'earnings/fetchEarningsHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMyEarnings(params);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPurchasesHistory = createAsyncThunk<
  PurchasesHistoryResponse,
  {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    currency?: string;
    roomId?: string;
    search?: string;
  },
  { rejectValue: string }
>(
  'earnings/fetchPurchasesHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMyPurchases(params);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchWithdrawalsHistory = createAsyncThunk<
  WithdrawalsHistoryResponse,
  {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  },
  { rejectValue: string }
>(
  'earnings/fetchWithdrawalsHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMyWithdrawals(params);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchRecentActivities = createAsyncThunk<
  { activities: RecentActivity[]; pagination: Pagination },
  { 
    page?: number; 
    limit?: number; 
    startDate?: string; 
    endDate?: string;
    search?: string;
  },
  { rejectValue: string }
>(
  'earnings/fetchRecentActivities',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getRecentActivities(params);
      const data = extractData(response);
      
      return {
        activities: data.data || [],
        pagination: {
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          hasNext: (data.page || 1) < (data.totalPages || 0),
          hasPrev: (data.page || 1) > 1,
        }
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchBalanceSummary = createAsyncThunk<
  BalanceSummary,
  void,
  { rejectValue: string }
>(
  'earnings/fetchBalanceSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getBalanceSummary();
      return extractData(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchEscrowSummary = createAsyncThunk<
  EscrowSummary,
  { startDate?: string; endDate?: string } | void,
  { rejectValue: string }
>(
  'earnings/fetchEscrowSummary',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getEscrowSummary(params || undefined);
      return extractData(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchEscrows = createAsyncThunk<
  EscrowsResponse,
  {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    currency?: string;
    roomId?: string;
    search?: string;
  },
  { rejectValue: string }
>(
  'earnings/fetchEscrows',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getEscrows(params);
      
      // Ensure the return type matches EscrowsResponse exactly
      return {
        data: response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || ESCROWS_LIMIT,
        totalPages: response.totalPages || 0
      } as unknown as EscrowsResponse;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const withdrawEarnings = createAsyncThunk<
  { success: boolean; message?: string },
  { amount: number; currency: string }, // Updated payload type
  { rejectValue: string }
>(
  'earnings/withdrawEarnings',
  async ({ amount, currency }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ApiResponse<{ success: boolean; message?: string }>>('/earnings-escrow/withdraw', { amount, currency }); // Updated API endpoint and payload
      return extractData(response.data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetEarningsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Earnings Dashboard
      .addCase(fetchEarningsDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchEarningsDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
        // Update quickStats from dashboard stats
        if (action.payload.stats) {
          state.quickStats = action.payload.stats;
        }
      })
      .addCase(fetchEarningsDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload ?? 'Failed to fetch dashboard data';
      })

      // Fetch Quick Stats
      .addCase(fetchQuickStats.pending, (state) => {
        state.quickStatsLoading = true;
        state.error = null;
      })
      .addCase(fetchQuickStats.fulfilled, (state, action) => {
        state.quickStatsLoading = false;
        state.quickStats = action.payload;
      })
      .addCase(fetchQuickStats.rejected, (state, action) => {
        state.quickStatsLoading = false;
        state.error = action.payload ?? 'Failed to fetch quick stats';
      })

      // Fetch Earnings History
      .addCase(fetchEarningsHistory.pending, (state) => {
        state.earningsHistoryLoading = true;
        state.error = null;
      })
      .addCase(fetchEarningsHistory.fulfilled, (state, action) => {
        state.earningsHistoryLoading = false;
        state.earningsHistory = action.payload.earnings || [];
        state.earningsHistoryPagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || EARNINGS_HISTORY_LIMIT,
          total: action.payload.totalCount || 0,
          totalPages: action.payload.totalPages || 0,
          hasNext: action.payload.hasNextPage || false,
          hasPrev: action.payload.hasPreviousPage || false,
        };
      })
      .addCase(fetchEarningsHistory.rejected, (state, action) => {
        state.earningsHistoryLoading = false;
        state.error = action.payload ?? 'Failed to fetch earnings history';
      })

      // Fetch Purchases History
      .addCase(fetchPurchasesHistory.pending, (state) => {
        state.purchasesHistoryLoading = true;
        state.error = null;
      })
      .addCase(fetchPurchasesHistory.fulfilled, (state, action) => {
        state.purchasesHistoryLoading = false;
        state.purchasesHistory = action.payload.purchases || [];
        state.purchasesHistoryPagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || PURCHASES_HISTORY_LIMIT,
          total: action.payload.totalCount || 0,
          totalPages: action.payload.totalPages || 0,
          hasNext: action.payload.hasNextPage || false,
          hasPrev: action.payload.hasPreviousPage || false,
        };
      })
      .addCase(fetchPurchasesHistory.rejected, (state, action) => {
        state.purchasesHistoryLoading = false;
        state.error = action.payload ?? 'Failed to fetch purchases history';
      })

      // Fetch Withdrawals History
      .addCase(fetchWithdrawalsHistory.pending, (state) => {
        state.withdrawalsHistoryLoading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawalsHistory.fulfilled, (state, action) => {
        state.withdrawalsHistoryLoading = false;
        state.withdrawalsHistory = action.payload.data || [];
        state.withdrawalsHistoryPagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || WITHDRAWALS_HISTORY_LIMIT,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
          hasNext: (action.payload.page || 1) < (action.payload.totalPages || 0),
          hasPrev: (action.payload.page || 1) > 1,
        };
      })
      .addCase(fetchWithdrawalsHistory.rejected, (state, action) => {
        state.withdrawalsHistoryLoading = false;
        state.error = action.payload ?? 'Failed to fetch withdrawals history';
      })

      // Fetch Recent Activities
      .addCase(fetchRecentActivities.pending, (state) => {
        state.recentActivitiesLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.recentActivitiesLoading = false;
        state.recentActivities = action.payload.activities || [];
        state.recentActivitiesPagination = action.payload.pagination || initialPagination;
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.recentActivitiesLoading = false;
        state.error = action.payload ?? 'Failed to fetch recent activities';
      })

      // Fetch Balance Summary
      .addCase(fetchBalanceSummary.pending, (state) => {
        state.balanceSummaryLoading = true;
        state.error = null;
      })
      .addCase(fetchBalanceSummary.fulfilled, (state, action) => {
        state.balanceSummaryLoading = false;
        state.balanceSummary = action.payload;
      })
      .addCase(fetchBalanceSummary.rejected, (state, action) => {
        state.balanceSummaryLoading = false;
        state.error = action.payload ?? 'Failed to fetch balance summary';
      })

      // Fetch Escrow Summary
      .addCase(fetchEscrowSummary.pending, (state) => {
        state.escrowSummaryLoading = true;
        state.error = null;
      })
      .addCase(fetchEscrowSummary.fulfilled, (state, action) => {
        state.escrowSummaryLoading = false;
        state.escrowSummary = action.payload;
      })
      .addCase(fetchEscrowSummary.rejected, (state, action) => {
        state.escrowSummaryLoading = false;
        state.error = action.payload ?? 'Failed to fetch escrow summary';
      })

      // Fetch Escrows
      .addCase(fetchEscrows.pending, (state) => {
        state.escrowsLoading = true;
        state.error = null;
      })
      .addCase(fetchEscrows.fulfilled, (state, action) => {
        state.escrowsLoading = false;
        state.escrows = action.payload.data || [];
        state.escrowsPagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || ESCROWS_LIMIT,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
          hasNext: (action.payload.page || 1) < (action.payload.totalPages || 0),
          hasPrev: (action.payload.page || 1) > 1,
        };
        state.error = null;
      })
      .addCase(fetchEscrows.rejected, (state, action) => {
        state.escrowsLoading = false;
        state.escrows = [];
        state.error = String(action.payload ?? 'Failed to fetch escrows');
      })

      // Withdraw Earnings
      .addCase(withdrawEarnings.pending, (state) => {
        state.withdrawLoading = true;
        state.error = null;
      })
      .addCase(withdrawEarnings.fulfilled, (state) => {
        state.withdrawLoading = false;
      })
      .addCase(withdrawEarnings.rejected, (state, action) => {
        state.withdrawLoading = false;
        state.error = action.payload ?? 'Failed to withdraw earnings';
      });
  },
});

export const { clearError, resetEarningsState } = earningsSlice.actions;
export default earningsSlice.reducer;