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
}

export interface UpdateRoomData {
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  invitedUsers: string[]; // Array of email strings
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
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/livekit/rooms/my-session-history');
      // Extract the mySessionHistory array from the response
      return response.data.mySessionHistory || [];
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
        invitedUsers: roomData.invitedUsers // Already an array of email strings
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
        invitedUsers: roomData.invitedUsers // Already an array of email strings
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
        state.publicSessions = action.payload;
      })
      .addCase(fetchPublicSessions.rejected, (state, action) => {
        state.publicSessionsLoading = false;
        state.error = action.payload as string;
      });

    // Fetch session history
    builder
      .addCase(fetchSessionHistory.pending, (state) => {
        state.sessionHistoryLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        state.sessionHistoryLoading = false;
        state.sessionHistory = action.payload;
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
      .addCase(createRoom.fulfilled, (state) => {
        state.createLoading = false;
        // Don't add to state here since we're refetching the complete list
        // state.rooms.push(action.payload);
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
        state.rooms = state.rooms.filter(room => room._id !== action.payload);
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearRooms } = meetingSlice.actions;
export default meetingSlice.reducer; 