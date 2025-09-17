"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectSelectedWords, selectIsSelectMode, selectShowGerman, selectShowEnglish } from "@/store/slices/wordsSlice";
import { selectModalState, closeModal } from "@/store/slices/uiSlice";
import { useBulkActions } from "../hooks/useBulkActions";
import { useWordActions } from "../hooks/useWordActions";
import WordActionsCell from "./WordActionsCell";
import FlashcardModal from "../../../FlashcardModal";
import PronunciationTrainerModal from "../../../PronunciationTrainerModal";
import StoryGeneratorModal from "../../../StoryGeneratorModal";

const HEADERS = ["German word", "English word", "Type", "Actions"];

/**
 * Client component for the interactive table
 * Handles user interactions, selections, and modal management
 */
export default function WordsTableClient({ data, rate, refetch }) {
  const dispatch = useAppDispatch();
  const selectedWords = useAppSelector(selectSelectedWords);
  const isSelectMode = useAppSelector(selectIsSelectMode);
  const showGerman = useAppSelector(selectShowGerman);
  const showEnglish = useAppSelector(selectShowEnglish);

  // Modal states from RTK
  const flashcardModal = useAppSelector(selectModalState('flashcard'));
  const pronunciationModal = useAppSelector(selectModalState('pronunciation'));
  const storyGeneratorModal = useAppSelector(selectModalState('storyGenerator'));

  const { toggleSelectWord, selectAllVisible, deselectAll } = useBulkActions();
  const { handleSpeak } = useWordActions();

  const getSelectedWordsArray = () => {
    return data.filter(word => selectedWords.includes(word.uuid));
  };

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-4 p-4">
        {isSelectMode && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            <input
              type="checkbox"
              checked={data.length > 0 && data.every(word => selectedWords.includes(word.uuid))}
              onChange={(e) => e.target.checked ? selectAllVisible(data) : deselectAll()}
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-700">Select all visible words</span>
          </div>
        )}

        {data.map((word, i) => (
          <motion.div
            key={word.uuid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelectMode && selectedWords.includes(word.uuid)
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {showGerman && (
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {word.german}
                  </h3>
                )}
                {showEnglish && (
                  <p className="text-gray-600 mb-2">
                    {word.english}
                  </p>
                )}
                {word.type && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {word.type}
                  </span>
                )}
              </div>

              {isSelectMode && (
                <input
                  type="checkbox"
                  checked={selectedWords.includes(word.uuid)}
                  onChange={() => toggleSelectWord(word.uuid)}
                  className="w-5 h-5 mt-1"
                />
              )}
            </div>

            {!isSelectMode && (
              <WordActionsCell word={word} rate={rate} onUpdate={refetch} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full table-fixed text-sm lg:text-base overflow-hidden min-w-[600px]">
          <thead>
            <tr className="bg-primary text-gray-300">
              {isSelectMode && (
                <th className="w-12 py-3 px-4">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && data.every(word => selectedWords.includes(word.uuid))}
                    onChange={(e) => e.target.checked ? selectAllVisible(data) : deselectAll()}
                    className="w-4 h-4"
                  />
                </th>
              )}
              {HEADERS.map((header, index) => {
                if (index === 0 && !showGerman) return null;
                if (index === 1 && !showEnglish) return null;

                return (
                  <motion.th
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${
                      index === 2 ? "hidden lg:table-cell" : ""
                    } capitalize py-3 px-2 sm:px-4`}
                  >
                    {header}
                  </motion.th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((word, i) => (
              <motion.tr
                key={word.uuid}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.05,
                }}
                className={`text-center transition-colors duration-200 ${
                  isSelectMode && selectedWords.includes(word.uuid)
                    ? 'bg-blue-100 hover:bg-blue-200'
                    : 'bg-gray-100 hover:bg-teriary-100'
                }`}
              >
                {isSelectMode && (
                  <td className="py-3 px-2 sm:px-4">
                    <input
                      type="checkbox"
                      checked={selectedWords.includes(word.uuid)}
                      onChange={() => toggleSelectWord(word.uuid)}
                      className="w-4 h-4"
                    />
                  </td>
                )}
                {showGerman && (
                  <td className="py-3 px-2 sm:px-4 font-medium text-sm">
                    {word.german}
                  </td>
                )}
                {showEnglish && (
                  <td className="py-3 px-2 sm:px-4 text-sm">
                    {word.english}
                  </td>
                )}
                <td className="hidden lg:table-cell py-3 px-2 sm:px-4 text-sm">
                  {word.type || "Any"}
                </td>
                <td className="py-3 px-1 sm:px-4">
                  {!isSelectMode && (
                    <WordActionsCell word={word} rate={rate} onUpdate={refetch} />
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <FlashcardModal
        word={flashcardModal.word}
        isOpen={flashcardModal.isOpen}
        onClose={() => dispatch(closeModal('flashcard'))}
        onSpeak={handleSpeak}
      />
      <PronunciationTrainerModal
        word={pronunciationModal.word}
        isOpen={pronunciationModal.isOpen}
        onClose={() => dispatch(closeModal('pronunciation'))}
      />
      <StoryGeneratorModal
        isOpen={storyGeneratorModal.isOpen}
        onClose={() => dispatch(closeModal('storyGenerator'))}
        selectedWords={getSelectedWordsArray()}
        onSpeak={handleSpeak}
      />
    </>
  );
}