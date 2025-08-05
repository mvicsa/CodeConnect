import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';
import { User } from '@/types/user';

export interface Room {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  maxParticipants: number;
  secretId: string;
  isActive: boolean;
  createdBy: User;
  invitedUsers: User[];
  createdAt: string;
  updatedAt: string;
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
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

const initialState: MeetingState = {
  rooms: [],
  loading: false,
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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
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
    } catch (error: any) {
      console.error('Create room error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
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
    } catch (error: any) {
      console.error('Update room error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update room');
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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete room');
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

    // Create room
    builder
      .addCase(createRoom.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
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