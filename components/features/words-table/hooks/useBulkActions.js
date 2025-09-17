"use client";

import { useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectSelectedWords,
  selectIsSelectMode,
  toggleSelectedWord,
  setSelectedWords,
  clearSelectedWords,
  setSelectMode
} from "@/store/slices/wordsSlice";
import { useDeleteWordsMutation } from "@/store/api/wordsApi";
import toast from "react-hot-toast";

/**
 * Custom hook for managing bulk actions (select, delete, etc.)
 * @returns {Object} Bulk action state and handlers
 */
export function useBulkActions() {
  const dispatch = useAppDispatch();
  const selectedWords = useAppSelector(selectSelectedWords);
  const isSelectMode = useAppSelector(selectIsSelectMode);
  const [deleteWords, { isLoading: isBulkDeleting }] = useDeleteWordsMutation();

  const toggleSelectMode = useCallback(() => {
    dispatch(setSelectMode(!isSelectMode));
    if (isSelectMode) {
      dispatch(clearSelectedWords());
    }
  }, [dispatch, isSelectMode]);

  const toggleSelectWord = useCallback((uuid) => {
    dispatch(toggleSelectedWord(uuid));
  }, [dispatch]);

  const selectAllVisible = useCallback((visibleWords) => {
    const allVisible = visibleWords.map(word => word.uuid);
    dispatch(setSelectedWords(allVisible));
  }, [dispatch]);

  const deselectAll = useCallback(() => {
    dispatch(clearSelectedWords());
  }, [dispatch]);

  const bulkDelete = useCallback(async (onSuccess) => {
    if (selectedWords.size === 0) return;

    try {
      const uuids = Array.from(selectedWords);
      await deleteWords(uuids).unwrap();
      toast.success(`Deleted ${selectedWords.size} words successfully!`);
      dispatch(clearSelectedWords());
      dispatch(setSelectMode(false));
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error("Failed to delete words");
    }
  }, [selectedWords, deleteWords, dispatch]);

  return {
    selectedWords,
    isSelectMode,
    isBulkDeleting,
    toggleSelectMode,
    toggleSelectWord,
    selectAllVisible,
    deselectAll,
    bulkDelete
  };
}