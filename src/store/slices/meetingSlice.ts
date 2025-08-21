import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';
import { User } from '@/types/user';

export interface Room {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  secretId: string;
  publicId?: string; // Optional public ID for public rooms
  isActive: boolean;
  createdBy: User;
  invitedUsers: User[];
  inviteEmail?: string;
  createdAt: string;
  updatedAt: string;
  currentParticipants?: number; // Current number of participants in the room
  scheduledStartTime?: string; // When creator wants meeting to start
  actualStartTime?: string;    // When session actually started
  endedDate?: string;          // When session ended
  totalParticipantsJoined?: number; // Total participants who joined (even if they left)
}

export interface PublicSession {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  isActive: boolean;
  createdBy?: User; // Make createdBy optional
  createdAt: string;
  updatedAt: string;
  currentParticipants?: number;
  totalParticipantsJoined?: number; // Total participants who joined (even if they left)
}

export interface SessionHistory {
  roomId: string;
  roomName: string;
  roomDescription: string;
  isPrivate: boolean;
  isActive: boolean;
  createdBy: User | null; // Make createdBy nullable since API can return null
  createdAt: string;
  endedAt?: string | null;
  duration?: number | null;
  totalTimeSpent: number;
  joinCount: number;
  lastJoined?: string | null; // Make lastJoined nullable since API can return null
  status: string;
}

export interface CreateRoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  invitedUsers: string[]; // Array of email strings
  inviteEmail?: string;
  scheduledStartTime?: string | null; // Optional scheduled start time, can be null to clear
}

export interface UpdateRoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  invitedUsers: string[]; // Array of email strings
  scheduledStartTime?: string | null; // Optional scheduled start time, can be null to clear
}

interface MeetingState {
  rooms: Room[];
  publicSessions: PublicSession[];
  sessionHistory: SessionHistory[];
  loading: boolean;
  publicSessionsLoading: boolean;
  sessionHistoryLoading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  // Pagination state for session history
  currentPage: number;
  hasMoreSessions: boolean;
  totalSessions: number;
  // Additional session statistics from backend
  totalRooms: number;
  activeRooms: number;
  endedRooms: number;
}

const initialState: MeetingState = {
  rooms: [],
  publicSessions: [],
  sessionHistory: [],
  loading: false,
  publicSessionsLoading: true, // Start as true to show loading initially
  sessionHistoryLoading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  // Pagination state for session history
  currentPage: 1,
  hasMoreSessions: true,
  totalSessions: 0,
  // Additional session statistics from backend
  totalRooms: 0,
  activeRooms: 0,
  endedRooms: 0,
};

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

// Fetch public sessions
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

// Fetch session history
export const fetchSessionHistory = createAsyncThunk(
  'meeting/fetchSessionHistory',
  async ({ page = 1, limit = 10, loadMore = false }: { page?: number; limit?: number; loadMore?: boolean } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await axiosInstance.get(`/livekit/rooms/my-session-history?${params.toString()}`);
      
      // Extract the mySessionHistory array and pagination info from the response
      const sessionHistory = response.data.mySessionHistory || [];
      const pagination = response.data.pagination || {
        page: 1,
        limit: 10,
        total: sessionHistory.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };
      
      return {
        sessionHistory,
        pagination,
        loadMore,
        page,
        // Additional metadata from backend
        totalRooms: response.data.totalRooms,
        activeRooms: response.data.activeRooms,
        endedRooms: response.data.endedRooms
      };
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
        invitedUsers: roomData.invitedUsers, // Already an array of email strings
        scheduledStartTime: roomData.scheduledStartTime
      };

      const response = await axiosInstance.post('/livekit/rooms', payload);
      return response.data;
    } catch (error) {
      console.error('Create room error:', (error as Error).message);
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
        invitedUsers: roomData.invitedUsers, // Already an array of email strings
        scheduledStartTime: roomData.scheduledStartTime
      };

      const response = await axiosInstance.put(`/livekit/rooms/${roomId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update room error:', (error as Error).message);
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
      return rejectWithValue((error as Error).message || 'Failed to delete room');
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
        // Only set loading to false for initial loads
        if (!action.payload.loadMore) {
          state.sessionHistoryLoading = false;
        }
        
        if (action.payload.loadMore) {
          // Append new sessions for load more
          console.log('🔵 Load More - Current sessions:', state.sessionHistory.length);
          console.log('🔵 Load More - New sessions received:', action.payload.sessionHistory.length);
          
          const existingIds = new Set(state.sessionHistory.map(session => session.roomId));
          const uniqueNewSessions = action.payload.sessionHistory.filter(
            (session: SessionHistory) => !existingIds.has(session.roomId)
          );
          
          console.log('🔵 Load More - Unique new sessions:', uniqueNewSessions.length);
          console.log('🔵 Load More - Existing IDs:', Array.from(existingIds));
          
          state.sessionHistory = [...state.sessionHistory, ...uniqueNewSessions];
          console.log('🔵 Load More - Final sessions count:', state.sessionHistory.length);
        } else {
          // Replace all sessions for initial load or refresh
          state.sessionHistory = action.payload.sessionHistory;
        }
        
        // Update pagination state
        state.currentPage = action.payload.page;
        state.hasMoreSessions = action.payload.pagination.hasNext;
        state.totalSessions = action.payload.pagination.total;
        
        // Update additional session statistics if available
        if (action.payload.totalRooms !== undefined) state.totalRooms = action.payload.totalRooms;
        if (action.payload.activeRooms !== undefined) state.activeRooms = action.payload.activeRooms;
        if (action.payload.endedRooms !== undefined) state.endedRooms = action.payload.endedRooms;
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
            maxParticipants: action.payload.maxParticipants,
            isActive: action.payload.isActive,
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
  },
});

export const { clearError, clearRooms } = meetingSlice.actions;
export default meetingSlice.reducer; 