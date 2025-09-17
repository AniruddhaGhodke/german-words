"use client";

import React, { memo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectShowGerman, selectShowEnglish, setShowGerman, setShowEnglish } from "@/store/slices/wordsSlice";
import { useBulkActions } from "../hooks/useBulkActions";
import { useWordActions } from "../hooks/useWordActions";
import toast from "react-hot-toast";

/**
 * Client component for bulk actions and column visibility controls
 * Handles selection mode, bulk operations, and export functions
 */
const BulkActionsBar = memo(function BulkActionsBar({ data }) {
  const dispatch = useAppDispatch();
  const showGerman = useAppSelector(selectShowGerman);
  const showEnglish = useAppSelector(selectShowEnglish);

  const {
    selectedWords,
    isSelectMode,
    isBulkDeleting,
    toggleSelectMode,
    selectAllVisible,
    deselectAll,
    bulkDelete
  } = useBulkActions();

  const { openStoryGenerator } = useWordActions();

  const handleShowGermanToggle = () => {
    if (showGerman && !showEnglish) {
      toast.error("At least one column must be visible");
      return;
    }
    dispatch(setShowGerman(!showGerman));
  };

  const handleShowEnglishToggle = () => {
    if (showEnglish && !showGerman) {
      toast.error("At least one column must be visible");
      return;
    }
    dispatch(setShowEnglish(!showEnglish));
  };

  const handleShowAll = () => {
    dispatch(setShowGerman(true));
    dispatch(setShowEnglish(true));
  };

  const handleBulkDelete = () => {
    bulkDelete(); // The hook handles success callback
  };

  const handleStoryGenerator = () => {
    if (selectedWords.size === 0) {
      toast.error("Please select some words first!");
      return;
    }
    openStoryGenerator();
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/words?limit=1000000');
      const result = await response.json();
      const allData = result.success ? result.data : data;

      const headers = ['German Word,English Word,Type,Date Added'];
      const rows = allData.map(word =>
        `"${word.german}","${word.english}","${word.type || 'Any'}","${new Date(word.createdAt || Date.now()).toLocaleDateString()}"`
      );

      const csvContent = headers.concat(rows).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `german-words-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Words exported successfully!');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const exportToJSON = async () => {
    try {
      const response = await fetch('/api/words?limit=1000000');
      const result = await response.json();
      const allData = result.success ? result.data : data;

      const exportData = {
        exportDate: new Date().toISOString(),
        totalWords: allData.length,
        words: allData.map(word => ({
          german: word.german,
          english: word.english,
          type: word.type || 'Any',
          dateAdded: word.createdAt || new Date().toISOString()
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `german-words-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Words exported successfully!');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="bg-blue-50 px-3 sm:px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={toggleSelectMode}
          className={`px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors min-h-[40px] ${
            isSelectMode
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isSelectMode ? 'Exit Select' : 'Select Mode'}
        </button>

        {/* Column visibility toggles */}
        <div className="flex items-center gap-2 ml-0 sm:ml-4">
          <span className="text-xs sm:text-sm text-gray-600">Show:</span>
          <button
            onClick={handleShowGermanToggle}
            className={`px-2 py-2 rounded text-xs font-medium transition-colors min-h-[36px] ${
              showGerman
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
          >
            🇩🇪 <span className="hidden sm:inline">German</span>
          </button>
          <button
            onClick={handleShowEnglishToggle}
            className={`px-2 py-2 rounded text-xs font-medium transition-colors min-h-[36px] ${
              showEnglish
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
          >
            🇺🇸 <span className="hidden sm:inline">English</span>
          </button>
          {(!showGerman || !showEnglish) && (
            <button
              onClick={handleShowAll}
              className="px-2 py-2 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors min-h-[36px]"
            >
              Show All
            </button>
          )}
        </div>

        {isSelectMode && (
          <>
            <span className="text-sm text-gray-600">
              {selectedWords.size} selected
            </span>
            <button
              onClick={() => selectAllVisible(data)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All ({data.length})
            </button>
            <button
              onClick={deselectAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Deselect All
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {data.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">Export:</span>
            <button
              onClick={exportToCSV}
              className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors min-h-[36px]"
            >
              📊 CSV
            </button>
            <button
              onClick={exportToJSON}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors min-h-[36px]"
            >
              📄 JSON
            </button>
          </div>
        )}

        {isSelectMode && selectedWords.size > 0 && (
          <>
            <button
              onClick={handleStoryGenerator}
              className="px-3 py-2 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors flex items-center gap-1 min-h-[36px] whitespace-nowrap"
              title="Generate story with selected words"
            >
              📖 <span className="hidden sm:inline">Story</span> ({selectedWords.size})
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-3 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 min-h-[36px] whitespace-nowrap"
            >
              {isBulkDeleting ? 'Deleting...' : `🗑️ Delete ${selectedWords.size}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export default BulkActionsBar;