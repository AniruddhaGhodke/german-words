"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setSearch, setCurrentPage } from "@/store/slices/wordsSlice";

/**
 * Custom hook for managing search functionality with debouncing.
 * @param {string} initialSearch - Initial search value from Redux.
 * @param {number} debounceMs - Debounce delay in milliseconds.
 * @returns {Object} Search state and handlers.
 */
export function useSearch(initialSearch = "", debounceMs = 300) {
  const dispatch = useAppDispatch();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [isSearching, setIsSearching] = useState(false);

  // Ref to track the last search value from Redux, to avoid overwriting user input.
  const lastReduxSearch = useRef(initialSearch);

  // Sync from Redux to local state if the Redux value changes externally.
  useEffect(() => {
    if (initialSearch !== lastReduxSearch.current) {
      setSearchInput(initialSearch);
      lastReduxSearch.current = initialSearch;
    }
  }, [initialSearch]);

  // Debounced effect to update Redux from local state.
  useEffect(() => {
    if (searchInput === initialSearch) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      dispatch(setSearch(searchInput));
      dispatch(setCurrentPage(1));
      // After dispatching, the new value will be the "last" one from Redux.
      lastReduxSearch.current = searchInput;
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput, initialSearch, dispatch, debounceMs]);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    // Dispatch immediately for responsiveness.
    if (initialSearch !== "") {
      dispatch(setSearch(""));
      dispatch(setCurrentPage(1));
    }
    lastReduxSearch.current = "";
  }, [dispatch, initialSearch]);

  return {
    searchInput,
    isSearching,
    handleSearchChange,
    clearSearch,
  };
}
