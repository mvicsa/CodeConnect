import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchArchiveItems,
  fetchArchiveItemById,
  setSearchQuery,
  setStatusFilter,
  setDifficultyFilter,
  setTagsFilter,
  clearFilters,
  clearSearch,
} from '@/store/slices/archiveSlice';

export const useArchive = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items,
    filteredItems,
    loading,
    error,
    searchQuery,
    filters,
  } = useSelector((state: RootState) => state.archive);

  // Get unique values for filter options
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags))
  ).sort();

  const allStatuses = Array.from(
    new Set(items.map((item) => item.status))
  ).filter(Boolean).sort();

  const allDifficulties = Array.from(
    new Set(items.map((item) => item.difficulty))
  ).filter(Boolean).sort();

  // Action dispatchers
  const loadArchiveItems = useCallback((params?: {
    search?: string;
    status?: string;
    difficulty?: string;
    tags?: string[];
  }) => {
    dispatch(fetchArchiveItems(params || {}));
  }, [dispatch]);

  const loadArchiveItemById = useCallback((id: string) => {
    dispatch(fetchArchiveItemById(id));
  }, [dispatch]);

  const search = useCallback((query: string) => {
    dispatch(setSearchQuery(query));
  }, [dispatch]);

  const filterByStatus = useCallback((status: string) => {
    dispatch(setStatusFilter(status));
  }, [dispatch]);

  const filterByDifficulty = useCallback((difficulty: string) => {
    dispatch(setDifficultyFilter(difficulty));
  }, [dispatch]);

  const filterByTags = useCallback((tags: string[]) => {
    dispatch(setTagsFilter(tags));
  }, [dispatch]);

  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const clearSearchQuery = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  return {
    // State
    items,
    filteredItems,
    loading,
    error,
    searchQuery,
    filters,
    
    // Computed values
    allTags,
    allStatuses,
    allDifficulties,
    
    // Actions
    loadArchiveItems,
    loadArchiveItemById,
    search,
    filterByStatus,
    filterByDifficulty,
    filterByTags,
    clearAllFilters,
    clearSearchQuery,
  };
}; 