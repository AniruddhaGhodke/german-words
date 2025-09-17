"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useDeleteWordMutation } from "@/store/api/wordsApi";
import { openModal } from "@/store/slices/uiSlice";
import toast from "react-hot-toast";

/**
 * Custom hook for individual word actions (delete, speak, modals)
 * @returns {Object} Word action handlers
 */
export function useWordActions() {
  const dispatch = useAppDispatch();
  const [deleteWord, { isLoading: isDeleting }] = useDeleteWordMutation();

  const handleSpeak = useCallback(async (speakword, rate = 0.8) => {
    try {
      const { speakGermanWord } = await import("../../../../utils/speechSynthesis");
      await speakGermanWord(speakword, {
        rate: rate,
        onStart: () => console.log('Speaking:', speakword),
        onEnd: () => console.log('Finished speaking:', speakword)
      });
    } catch (error) {
      console.error('Speech error:', error);
      toast.error('Speech synthesis failed. Please try again.');
    }
  }, []);

  const handleDelete = useCallback(async (uuid, onSuccess) => {
    try {
      await deleteWord(uuid).unwrap();
      toast.success("Deleted Successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error?.data?.message || "Failed to delete word");
    }
  }, [deleteWord]);

  const openFlashcard = useCallback((word) => {
    dispatch(openModal({ modalType: 'flashcard', data: { word } }));
  }, [dispatch]);

  const openPronunciationTrainer = useCallback((word) => {
    dispatch(openModal({ modalType: 'pronunciation', data: { word } }));
  }, [dispatch]);

  const openStoryGenerator = useCallback(() => {
    dispatch(openModal({ modalType: 'storyGenerator' }));
  }, [dispatch]);

  return {
    isDeleting,
    handleSpeak,
    handleDelete,
    openFlashcard,
    openPronunciationTrainer,
    openStoryGenerator
  };
}