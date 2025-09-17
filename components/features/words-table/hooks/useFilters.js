"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setTypeFilter, setCurrentPage, setSort } from "@/store/slices/wordsSlice";

/**
 * Custom hook for managing filter functionality
 * @returns {Object} Filter handlers
 */
export function useFilters() {
  const dispatch = useAppDispatch();

  const handleFilterChange = useCallback((filterType) => {
    dispatch(setTypeFilter(filterType === 'All' ? '' : filterType));
    dispatch(setCurrentPage(1));
  }, [dispatch]);

  const handleSort = useCallback((sortType) => {
    dispatch(setSort(sortType));
    dispatch(setCurrentPage(1));
  }, [dispatch]);

  const clearAllFilters = useCallback(() => {
    dispatch(setTypeFilter(''));
    dispatch(setCurrentPage(1));
  }, [dispatch]);

  return {
    handleFilterChange,
    handleSort,
    clearAllFilters
  };
}