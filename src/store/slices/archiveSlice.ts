import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ArchiveItem } from '@/types/archive';

interface ArchiveState {
  items: ArchiveItem[];
  filteredItems: ArchiveItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    status: string;
    difficulty: string;
    tags: string[];
  };
}

const initialState: ArchiveState = {
  items: [],
  filteredItems: [],
  loading: true, // Start with loading true to show skeleton initially
  error: null,
  searchQuery: '',
  filters: {
    status: '',
    difficulty: '',
    tags: [],
  },
};

// Helper function to filter items based on search query and filters
function filterItems(
  items: ArchiveItem[],
  searchQuery: string,
  filters: { status: string; difficulty: string; tags: string[] }
): ArchiveItem[] {
  let filtered = items;

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((item) => {
      return (
        item.text.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.codeLang.toLowerCase().includes(query) ||
        item.createdBy.firstName.toLowerCase().includes(query) ||
        item.createdBy.lastName.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.comments.some((comment) => 
          comment.text.toLowerCase().includes(query) ||
          comment.code.toLowerCase().includes(query) ||
          comment.aiComment?.evaluation.toLowerCase().includes(query)
        )
      );
    });
  }

  // Apply status filter (removed - not available in API response)
  // Apply difficulty filter (removed - not available in API response)

  // Apply tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter((item) =>
      filters.tags.some((tag) => item.tags.includes(tag))
    );
  }

  return filtered;
}

// Async thunk to fetch all archive items from your real API
export const fetchArchiveItems = createAsyncThunk(
  'archive/fetchItems',
  async (params: { search?: string; status?: string; difficulty?: string; tags?: string[] } = {}, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.search) searchParams.append('search', params.search);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
      if (params?.tags && params.tags.length > 0) searchParams.append('tags', params.tags.join(','));
      
      // Use your existing real API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/archive?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data; // Return the data directly from your API
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch archive items');
    }
  }
);

// Async thunk to fetch archive item by ID from your real API
export const fetchArchiveItemById = createAsyncThunk(
  'archive/fetchItemById',
  async (id: string, { rejectWithValue }) => {
    try {
      // Use your existing real API endpoint for individual items
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/archive/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return rejectWithValue('Archive item not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data; // Return the data directly from your API
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch archive item');
    }
  }
);

const archiveSlice = createSlice({
  name: 'archive',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredItems = filterItems(state.items, action.payload, state.filters);
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filters.status = action.payload;
      state.filteredItems = filterItems(state.items, state.searchQuery, state.filters);
    },
    setDifficultyFilter: (state, action: PayloadAction<string>) => {
      state.filters.difficulty = action.payload;
      state.filteredItems = filterItems(state.items, state.searchQuery, state.filters);
    },
    setTagsFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.tags = action.payload;
      state.filteredItems = filterItems(state.items, state.searchQuery, state.filters);
    },
    clearFilters: (state) => {
      state.filters = {
        status: '',
        difficulty: '',
        tags: [],
      };
      state.searchQuery = '';
      state.filteredItems = state.items;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.filteredItems = filterItems(state.items, '', state.filters);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArchiveItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArchiveItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.filteredItems = filterItems(action.payload, state.searchQuery, state.filters);
      })
      .addCase(fetchArchiveItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setStatusFilter,
  setDifficultyFilter,
  setTagsFilter,
  clearFilters,
  clearSearch,
} = archiveSlice.actions;

export default archiveSlice.reducer; 