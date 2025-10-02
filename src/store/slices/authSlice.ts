import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { getAuthToken, setAuthToken, removeAuthToken, setCookie, deleteCookie } from '@/lib/cookies';

interface User {
  _id: string;
  username: string;
  email: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? getAuthToken() : null,
  loading: false,
  error: null,
  initialized: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, data);
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue((error.response?.data as { message?: string })?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: { firstName: string; lastName: string; username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue((error.response?.data as { message?: string })?.message || 'Registration failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Get token from state or cookies
      const state = getState() as { auth: AuthState };
      const token = state.auth.token || getAuthToken();
      if (!token) throw new Error('No token');
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue((error.response?.data as { message?: string })?.message || '');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: unknown, { getState, rejectWithValue }) => {
    try {
      console.log('profileData', profileData);
      const state = getState() as { auth: AuthState };
      const token = state.auth.token || getAuthToken();
      if (!token) throw new Error('No token');
      const response = await axios.patch(
        `${API_URL}/users/me`,
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue((error.response?.data as { message?: string })?.message || 'Failed to update profile');
    }
  }
);

export const githubLogin = createAsyncThunk(
  'auth/githubLogin',
  async (_, { rejectWithValue }) => {
    try {
      // Redirect to backend GitHub OAuth endpoint
      window.location.href = `${API_URL}/auth/github`;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue((error.response?.data as { message?: string })?.message || 'GitHub login failed');
    }
  }
);

export const handleGitHubCallback = createAsyncThunk(
  'auth/handleGitHubCallback',
  async (callbackData: { token: string; user: User }, { rejectWithValue }) => {
    try {
      return callbackData;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue((error.response?.data as { message?: string })?.message || 'GitHub callback failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    data: { currentPassword: string; newPassword: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token || getAuthToken();
      if (!token) throw new Error('No token');
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError;
      return rejectWithValue(
        (error.response?.data as { message?: string })?.message ||
          'Failed to change password'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      removeAuthToken();
      if (typeof window !== 'undefined') {
        deleteCookie('username');
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      setAuthToken(action.payload);
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add a new reducer to update following list without fetching profile
    updateFollowing: (state, action: PayloadAction<string[]>) => {
      if (state.user) {
        state.user.following = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
        if (typeof window !== 'undefined' && action.payload?.user?.username) {
          setCookie('username', action.payload.user.username);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
        if (typeof window !== 'undefined' && action.payload?.user?.username) {
          setCookie('username', action.payload.user.username);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload;
        state.initialized = true;
        const username = (state.user as User | null)?.username;
        if (typeof window !== 'undefined' && username) {
          setCookie('username', username);
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.token = null;
        state.initialized = true;
        removeAuthToken();
      })
      .addCase(githubLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(githubLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(handleGitHubCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
        if (typeof window !== 'undefined' && action.payload?.user?.username) {
          setCookie('username', action.payload.user.username);
        }
      })
      .addCase(handleGitHubCallback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload;
        const username = (action.payload as User | null)?.username;
        if (typeof window !== 'undefined' && username) {
          setCookie('username', username);
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setUser, setToken, setInitialized, clearError, updateFollowing } = authSlice.actions;
export default authSlice.reducer; 