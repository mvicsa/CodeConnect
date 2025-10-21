import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '@/lib/axios';
import { User } from '@/types/user';

export interface Room {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  secretId?: string;
  publicId?: string; // Optional public ID for public rooms
  isActive: boolean;
  isPaid?: boolean; // New field for paid sessions
  price?: number; // New field for session price
  currency?: string; // New field for currency (USD, EUR, JOD, etc.)
  createdBy: User;
  invitedUsers: User[];
  inviteEmail?: string;
  createdAt: string;
  updatedAt: string;
  currentParticipants?: number; // Current number of participants in the room
  scheduledStartTime?: string; // When creator wants meeting to start
  actualStartTime?: string;    // When session actually started
  endedDate?: string;          // When session ended
  cancelledAt?: string; // New field for cancellation timestamp
  cancellationReason?: string; // New field for cancellation reason
  totalParticipantsJoined?: number; // Total participants who joined (even if they left)
  averageRating?: number; // New field for average rating
  ratingCount?: number; // New field for total rating count
  userRating?: number; // New field for current user's rating
  isUserRated?: boolean; // New field to indicate if current user has rated
  completedPurchasesCount?: number; // New field for completed purchases count
  recentPurchasers?: User[]; // New field for recent purchasers
}

export interface PublicSession {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  isActive: boolean;
  isPaid?: boolean; // New field for paid sessions
  price?: number; // New field for session price
  currency?: string; // New field for currency
  createdBy?: User; // Make createdBy optional
  createdAt: string;
  updatedAt: string;
  currentParticipants?: number;
  totalParticipantsJoined?: number; // Total participants who joined (even if they left)
  completedPurchasesCount?: number; // New field for completed purchases count
  recentPurchasers?: User[]; // New field for recent purchasers
}

export interface SessionHistory {
  _id?: string;
  roomId: string;
  roomName: string;
  roomDescription: string;
  isPrivate: boolean;
  isActive: boolean;
  maxParticipants?: number; // Add this line
  createdBy: User | null; // Make createdBy nullable since API can return null
  invitedUsers?: User[]; // Add this line
  currentParticipants?: number; // Add this line
  totalParticipantsJoined?: number; // Add this line
  scheduledStartTime?: string; // Add this line
  isPaid?: boolean; // Add this line
  price?: number; // Add this line
  currency?: string; // Add this line
  createdAt: string;
  endedAt?: string; // Changed from string | null | undefined
  cancelledAt?: string; // New field for cancellation timestamp
  cancellationReason?: string; // New field for cancellation reason
  duration?: number | null;
  totalTimeSpent: number;
  joinCount: number;
  lastJoined?: string | null; // Make lastJoined nullable since API can return null
  status: string;
  secretId?: string; // Add this line
  updatedAt?: string; // Add this line
  averageRating?: number; // New field for average rating
  ratingCount?: number; // New field for total rating count
  userRating?: number; // New field for current user's rating
  isUserRated?: boolean; // New field to indicate if current user has rated
}

export interface CreateRoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants?: number | null; // null = no limit
  isPaid?: boolean;
  price?: number; // Required if isPaid = true
  currency?: string; // Required if isPaid = true, default to 'USD'
  invitedUsers: string[]; // Array of email strings
  inviteEmail?: string;
  scheduledStartTime?: string | null; // Optional scheduled start time, can be null to clear
}

export interface UpdateRoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants?: number | null; // null = no limit
  isPaid?: boolean;
  price?: number; // Required if isPaid = true
  currency?: string; // Required if isPaid = true, default to 'USD'
  invitedUsers: string[]; // Array of email strings
  scheduledStartTime?: string | null; // Optional scheduled start time, can be null to clear
}

// Payment related interfaces
export interface PaymentRecord {
  _id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EarningsRecord {
  _id: string;
  roomId: string;
  roomName: string;
  totalEarnings: number;
  currency: string;
  participantCount: number;
  averageRating?: number;
  createdAt: string;
}

export interface PaymentSummary {
  totalEarnings: number;
  totalEarningsUSD: number;
  currency: string;
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PurchasesSummary {
  totalSpent: number;
  totalSpentUSD: number;
  currency: string;
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MeetingState {
  rooms: Room[];
  publicSessions: PublicSession[];
  sessionHistory: {
    sessions: SessionHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      totalActiveSessions: number;
      totalEndedSessions: number;
      totalCancelledSessions: number;
      totalPublicSessions?: number;
      totalPrivateSessions?: number;
      totalPaidSessions?: number;
      totalFreeSessions?: number;
    };
  };
  loading: boolean;
  publicSessionsLoading: boolean;
  discoverSessionsLoading: boolean;
  sessionHistoryLoading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  cancelLoading: boolean; // New loading state for cancelling rooms
  // Payment related state
  earnings: EarningsRecord[];
  purchases: PaymentRecord[];
  earningsLoading: boolean;
  purchasesLoading: boolean;
  earningsSummary: PaymentSummary | null;
  purchasesSummary: PurchasesSummary | null;
  // Payment creation state
  paymentLoading: boolean;
  paymentError: string | null;
}

const initialState: MeetingState = {
  rooms: [],
  publicSessions: [],
  sessionHistory: {
    sessions: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    filters: {
      totalActiveSessions: 0,
      totalEndedSessions: 0,
      totalCancelledSessions: 0,
      totalPublicSessions: 0,
      totalPrivateSessions: 0,
      totalPaidSessions: 0,
      totalFreeSessions: 0,
    },
  },
  loading: false,
  publicSessionsLoading: true, // Start as true to show loading initially
  discoverSessionsLoading: false,
  sessionHistoryLoading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  cancelLoading: false, // Initialize new loading state
  // Payment related state
  earnings: [],
  purchases: [],
  earningsLoading: false,
  purchasesLoading: false,
  earningsSummary: null,
  purchasesSummary: null,
  // Payment creation state
  paymentLoading: false,
  paymentError: null,
};

interface FetchSessionHistoryPayload {
  mySessionHistory: SessionHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  totalRooms: number;
  activeRooms: number;
  endedRooms: number;
  cancelledRooms: number;
  filters: {
    totalActiveSessions: number;
    totalEndedSessions: number;
    totalCancelledSessions: number;
    totalPublicSessions: number;
    totalPrivateSessions: number;
    totalPaidSessions: number;
    totalFreeSessions: number;
    availableStatuses: string[];
    availableTypes: string[];
    availablePaymentStatuses: string[];
  };
  message: string;
}

// Fetch all rooms
export const fetchRooms = createAsyncThunk(
  'meeting/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch only rooms created by the current user
      const response = await axiosInstance.get('/livekit/rooms/user/my-rooms');
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch rooms');
    }
  }
);

// Fetch public sessions (deprecated - use discoverSessions instead)
export const fetchPublicSessions = createAsyncThunk(
  'meeting/fetchPublicSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/livekit/rooms/public');
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch public sessions');
    }
  }
);

// Discover sessions with filters
export interface DiscoverSessionsFilters {
  search?: string;
  type?: 'public' | 'private' | 'all';
  status?: 'active' | 'scheduled' | 'ended' | 'all';
  isPaid?: boolean;
  paymentStatus?: 'paid' | 'free' | 'all'; // Added paymentStatus
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
  sortBy?: 'createdAt' | 'name' | 'participants' | 'price' | 'lastJoined';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const discoverSessions = createAsyncThunk(
  'meeting/discoverSessions',
  async (filters: DiscoverSessionsFilters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      // Add all filters to URL params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axiosInstance.get(`/livekit/sessions/discover?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to discover sessions');
    }
  }
);

// Fetch session history
export const fetchSessionHistory = createAsyncThunk(
  'meeting/fetchSessionHistory',
  async ({ page = 1, limit = 10, sortBy, sortOrder, status, type, paymentStatus, search }: DiscoverSessionsFilters & { loadMore?: boolean } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add all filters to URL params
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      if (search) params.append('search', search);
      
      const response = await axiosInstance.get<FetchSessionHistoryPayload>(`/livekit/rooms/my-session-history?${params.toString()}`);
      
      // Return the entire response.data directly, which now matches FetchSessionHistoryPayload
      return response.data;

    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch session history');
    }
  }
);

// Create a new room
export const createRoom = createAsyncThunk(
  'meeting/createRoom',
  async (roomData: CreateRoomData, { rejectWithValue }) => {
    try {
      // Prepare the payload - only send emails for invitedUsers
      const payload = {
        name: roomData.name,
        description: roomData.description,
        isPrivate: roomData.isPrivate,
        maxParticipants: roomData.maxParticipants,
        isPaid: roomData.isPaid,
        ...(roomData.isPaid && {
          price: roomData.price,
          currency: roomData.currency
        }),
        invitedUsers: roomData.invitedUsers, // Already an array of email strings
        scheduledStartTime: roomData.scheduledStartTime
      };
      const response = await axiosInstance.post('/livekit/rooms', payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error || 'Failed to create room');
      }
      return rejectWithValue((error as Error).message || 'Failed to create room');
    }
  }
);

// Update a room
export const updateRoom = createAsyncThunk(
  'meeting/updateRoom',
  async ({ roomId, roomData }: { roomId: string; roomData: UpdateRoomData }, { rejectWithValue }) => {
    try {
      // Prepare the payload - only send emails for invitedUsers
      const payload = {
        name: roomData.name,
        description: roomData.description,
        isPrivate: roomData.isPrivate,
        maxParticipants: roomData.maxParticipants,
        isPaid: roomData.isPaid,
        ...(roomData.isPaid && {
          price: roomData.price,
          currency: roomData.currency
        }),
        invitedUsers: roomData.invitedUsers, // Already an array of email strings
        scheduledStartTime: roomData.scheduledStartTime
      };
      const response = await axiosInstance.put(`/livekit/rooms/${roomId}`, payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error || 'Failed to update room');
      }
      return rejectWithValue((error as Error).message || 'Failed to update room');
    }
  }
);

// Delete a room
export const deleteRoom = createAsyncThunk(
  'meeting/deleteRoom',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/livekit/rooms/${roomId}`);
      return roomId;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error || 'Failed to delete room');
      }
      return rejectWithValue((error as Error).message || 'Failed to delete room');
    }
  }
);

// Cancel a room
export const cancelRoom = createAsyncThunk(
  'meeting/cancelRoom',
  async ({ roomId, reason }: { roomId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/livekit/rooms/${roomId}/cancel`, {
        reason //
      });
      return response.data; // Return updated room data or a success message
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error || 'Failed to cancel room');
      }
      return rejectWithValue((error as Error).message || 'Failed to cancel room');
    }
  }
);

// Payment related thunks

// Create checkout session for paid room
export const createCheckoutSession = createAsyncThunk(
  'meeting/createCheckoutSession',
  async ({ roomId, successUrl, cancelUrl }: {
    roomId: string;
    successUrl: string;
    cancelUrl: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/payment/create-checkout-session', {
        roomId,
        successUrl,
        cancelUrl
      });
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to create checkout session');
    }
  }
);

// Fetch creator earnings
export const fetchEarnings = createAsyncThunk(
  'meeting/fetchEarnings',
  async ({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    currency
  }: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    currency?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (currency) params.append('currency', currency);

      const response = await axiosInstance.get(`/payment/my-earnings?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch earnings');
    }
  }
);

// Fetch user purchases
export const fetchPurchases = createAsyncThunk(
  'meeting/fetchPurchases',
  async ({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    currency
  }: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    currency?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (currency) params.append('currency', currency);

      const response = await axiosInstance.get(`/payment/my-purchases?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message || 'Failed to fetch purchases');
    }
  }
);

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRooms: (state) => {
      state.rooms = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch rooms
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch public sessions
    builder
      .addCase(fetchPublicSessions.pending, (state) => {
        state.publicSessionsLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicSessions.fulfilled, (state, action) => {
        state.publicSessionsLoading = false;
        
        // Simply set the public sessions without filtering
        // The previous filtering logic was incorrect - it was filtering out
        // public sessions from other users when comparing against user's rooms
        state.publicSessions = action.payload;
        
      })
      .addCase(fetchPublicSessions.rejected, (state, action) => {
        state.publicSessionsLoading = false;
        state.error = action.payload as string;
      });

    // Discover sessions with filters
    builder
      .addCase(discoverSessions.pending, (state) => {
        state.discoverSessionsLoading = true;
        state.error = null;
      })
      .addCase(discoverSessions.fulfilled, (state) => {
        state.discoverSessionsLoading = false;
        // Note: discoverSessions data is not stored in Redux state
        // It's used directly in the component via the action payload
      })
      .addCase(discoverSessions.rejected, (state, action) => {
        state.discoverSessionsLoading = false;
        state.error = action.payload as string;
      });

    // Fetch session history
    builder
      .addCase(fetchSessionHistory.pending, (state, action) => {
        // Only set loading to true for initial loads, not for load more
        if (!action.meta?.arg?.loadMore) {
          state.sessionHistoryLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        // Only set loading to false for initial loads (not for loadMore)
        if (!action.meta.arg.loadMore) {
          state.sessionHistoryLoading = false;
        }
        
        if (action.meta.arg.loadMore) {
          const existingIds = new Set(state.sessionHistory.sessions.map(session => session.roomId));
          const uniqueNewSessions = action.payload.mySessionHistory.filter(
            (session: SessionHistory) => !existingIds.has(session.roomId)
          );
          
          state.sessionHistory.sessions = [...state.sessionHistory.sessions, ...uniqueNewSessions];
        } else {
          // Replace all sessions for initial load or refresh
          state.sessionHistory.sessions = action.payload.mySessionHistory;
        }
        
        // Update pagination state
        state.sessionHistory.pagination.page = action.payload.pagination.page;
        state.sessionHistory.pagination.hasNext = action.payload.pagination.hasNext;
        state.sessionHistory.pagination.total = action.payload.pagination.total;
        state.sessionHistory.pagination.totalPages = action.payload.pagination.totalPages;
        
        // Update additional session statistics from action.payload.filters
        if (action.payload.filters?.totalActiveSessions !== undefined) state.sessionHistory.filters.totalActiveSessions = action.payload.filters.totalActiveSessions;
        if (action.payload.filters?.totalEndedSessions !== undefined) state.sessionHistory.filters.totalEndedSessions = action.payload.filters.totalEndedSessions; 
        if (action.payload.filters?.totalCancelledSessions !== undefined) state.sessionHistory.filters.totalCancelledSessions = action.payload.filters.totalCancelledSessions; 

        // Update other totals from payload filters to ensure consistency
        if (action.payload.filters?.totalPublicSessions !== undefined) state.sessionHistory.filters.totalPublicSessions = action.payload.filters.totalPublicSessions;
        if (action.payload.filters?.totalPrivateSessions !== undefined) state.sessionHistory.filters.totalPrivateSessions = action.payload.filters.totalPrivateSessions;
        if (action.payload.filters?.totalPaidSessions !== undefined) state.sessionHistory.filters.totalPaidSessions = action.payload.filters.totalPaidSessions;
        if (action.payload.filters?.totalFreeSessions !== undefined) state.sessionHistory.filters.totalFreeSessions = action.payload.filters.totalFreeSessions;

      })
      .addCase(fetchSessionHistory.rejected, (state, action) => {
        state.sessionHistoryLoading = false;
        state.error = action.payload as string;
      });

    // Create room
    builder
      .addCase(createRoom.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.createLoading = false;
        // Don't add to rooms state here since we're refetching the complete list
        // state.rooms.push(action.payload);
        
        // If the created room is public, add it to publicSessions
        if (!action.payload.isPrivate) {
          // Convert Room to PublicSession format
          const publicSession = {
            _id: action.payload._id,
            name: action.payload.name,
            description: action.payload.description,
            isPrivate: false,
            maxParticipants: action.payload.maxParticipants || 10,
            isActive: action.payload.isActive,
            isPaid: action.payload.isPaid || false,
            price: action.payload.price,
            currency: action.payload.currency,
            createdBy: action.payload.createdBy,
            createdAt: action.payload.createdAt,
            updatedAt: action.payload.updatedAt,
            currentParticipants: action.payload.currentParticipants || 0,
            totalParticipantsJoined: action.payload.totalParticipantsJoined || 0
          };
          state.publicSessions.unshift(publicSession); // Add to beginning of array
        }
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      });

    // Update room
    builder
      .addCase(updateRoom.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.rooms.findIndex(room => room._id === action.payload._id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Delete room
    builder
      .addCase(deleteRoom.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove room from rooms array
        state.rooms = state.rooms.filter(room => room._id !== action.payload);
        // Also remove from publicSessions if it exists there
        state.publicSessions = state.publicSessions.filter(session => session._id !== action.payload);
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      });

    // Cancel room
    builder
      .addCase(cancelRoom.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })
      .addCase(cancelRoom.fulfilled, (state, action) => {
        state.cancelLoading = false;
        // Update the cancelled room's status, e.g., isActive to false
        const updatedRoom = action.payload;
        state.rooms = state.rooms.map(room =>
          room._id === updatedRoom._id ? { ...room, ...updatedRoom } : room
        );
        // Also update in public sessions if necessary
        state.publicSessions = state.publicSessions.map(session =>
          session._id === updatedRoom._id ? { ...session, ...updatedRoom } : session
        );
        state.sessionHistory.sessions = state.sessionHistory.sessions.map(session => // Corrected to target sessions array
          session.roomId === updatedRoom._id ? { ...session, isActive: false, status: 'cancelled' } : session
        );
      })
      .addCase(cancelRoom.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload as string;
      });

    // Payment related reducers

    // Create checkout session
    builder
      .addCase(createCheckoutSession.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.paymentLoading = false;
        // Return checkout URL - handled by component
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload as string;
      });

    // Fetch earnings
    builder
      .addCase(fetchEarnings.pending, (state) => {
        state.earningsLoading = true;
        state.error = null;
      })
      .addCase(fetchEarnings.fulfilled, (state, action) => {
        state.earningsLoading = false;
        state.earnings = action.payload.earnings || [];
        state.earningsSummary = {
          totalEarnings: action.payload.totalEarningsUSD || 0,
          totalEarningsUSD: action.payload.totalEarningsUSD || 0,
          currency: action.payload.currency || 'USD',
          totalCount: action.payload.totalCount || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          hasNext: action.payload.hasNext || false,
          hasPrev: action.payload.hasPrev || false
        };
      })
      .addCase(fetchEarnings.rejected, (state, action) => {
        state.earningsLoading = false;
        state.error = action.payload as string;
      });

    // Fetch purchases
    builder
      .addCase(fetchPurchases.pending, (state) => {
        state.purchasesLoading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.purchasesLoading = false;
        state.purchases = action.payload.purchases || [];
        state.purchasesSummary = {
          totalSpent: action.payload.totalSpentUSD || 0,
          totalSpentUSD: action.payload.totalSpentUSD || 0,
          currency: action.payload.currency || 'USD',
          totalCount: action.payload.totalCount || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          hasNext: action.payload.hasNext || false,
          hasPrev: action.payload.hasPrev || false
        };
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.purchasesLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearRooms } = meetingSlice.actions;

export default meetingSlice.reducer; 