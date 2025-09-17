"use client";

import React from "react";
import { motion } from "framer-motion";
import { useWordActions } from "../hooks/useWordActions";

/**
 * Client component for word action buttons
 * Handles individual word actions like speak, practice, flashcard
 */
export default function WordActionsCell({ word, rate, onUpdate }) {
  const {
    handleSpeak,
    handleDelete,
    openFlashcard,
    openPronunciationTrainer
  } = useWordActions();

  const onSpeakClick = () => {
    handleSpeak(word.german, rate);
  };

  const onDeleteClick = () => {
    handleDelete(word.uuid, onUpdate);
  };

  const onFlashcardClick = () => {
    openFlashcard(word);
  };

  const onPronunciationClick = () => {
    openPronunciationTrainer(word);
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <motion.button
        whileHover={{ scale: 1.1, y: -1 }}
        whileTap={{ scale: 0.95 }}
        className="bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 p-3 rounded-lg sm:rounded-xl border border-sky-200 hover:border-sky-300 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={onPronunciationClick}
        aria-label="Pronunciation Trainer"
        title="Advanced pronunciation practice"
      >
        <span className="text-lg sm:text-xl">🎯</span>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1, y: -1 }}
        whileTap={{ scale: 0.95 }}
        className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 p-3 rounded-lg sm:rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={onFlashcardClick}
        aria-label="Flashcard Practice"
        title="Flashcard practice"
      >
        <span className="text-lg sm:text-xl">🃏</span>
      </motion.button>
    </div>
  );
}