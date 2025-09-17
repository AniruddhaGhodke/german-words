"use client";

import React, { memo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectShowGerman, selectShowEnglish } from "@/store/slices/wordsSlice";
import { useSearch } from "../hooks/useSearch";
import { useFilters } from "../hooks/useFilters";

/**
 * Client component for search and filter controls
 * Handles search input, filters, and column visibility
 */
const SearchFilterBar = memo(function SearchFilterBar({ filters }) {
  const showGerman = useAppSelector(selectShowGerman);
  const showEnglish = useAppSelector(selectShowEnglish);

  const {
    searchInput,
    isSearching,
    handleSearchChange,
    clearSearch
  } = useSearch(filters?.search);

  const { handleFilterChange, handleSort } = useFilters();

  const filterType = filters?.type || "All";

  return (
    <>
      {/* Column visibility status */}
      {(!showGerman || !showEnglish) && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-3 text-amber-800 text-sm">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span>
              Practice Mode: {!showGerman ? 'English→German' : 'German→English'}
              {' '}(hiding {!showGerman ? 'German' : 'English'} column for better practice)
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-10 p-3 sm:p-4 lg:p-5 font-normal sm:flex-row">
        {/* Search Input */}
        <div className="flex justify-start items-end sm:justify-end sm:basis-1/3">
          <div className="w-full flex items-center gap-2">
            <label
              htmlFor="searchWord"
              className="block text-sm font-medium"
            >
              Search:
            </label>
            <div className="relative flex-1">
              <input
                type="text"
                id="searchWord"
                name="searchWord"
                value={searchInput}
                className={`mt-1 block px-3 py-3 w-full text-primary bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:bg-secondary-100 min-h-[44px] text-sm sm:text-base transition-colors ${
                  searchInput ? 'pr-16' : 'pr-3'
                } ${isSearching ? 'border-blue-400 bg-blue-50' : ''}`}
                placeholder="Search words..."
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchInput && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {isSearching && (
                    <div className="text-blue-500 text-xs font-medium animate-pulse">
                      🔍
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
                    title="Clear search"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex justify-start items-end gap-2 sm:justify-end sm:basis-1/3">
          <div className="w-full flex items-center gap-2">
            <label
              htmlFor="filterWords"
              className="block text-sm font-medium text-nowrap"
            >
              Filter By:
            </label>
            <select
              id="filterWords"
              name="filterWords"
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="mt-1 block w-full min-w-max pl-3 pr-10 py-3 text-sm sm:text-base text-primary bg-gray-100 outline-1 border border-gray-300 outline-gray-300 focus:bg-secondary-100 rounded-md min-h-[44px]"
            >
              <option>All</option>
              <option>Noun</option>
              <option>Verb</option>
              <option>Adjective</option>
              <option>Adverb</option>
              <option>Pronoun</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sort Options Bar */}
      <div className="bg-gray-50 px-3 sm:px-5 py-3 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="font-medium text-gray-700 w-full sm:w-auto mb-2 sm:mb-0">Sort by:</span>
          <button
            onClick={() => handleSort('german-asc')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
          >
            🇩🇪 A→Z
          </button>
          <button
            onClick={() => handleSort('english-asc')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
          >
            🇺🇸 A→Z
          </button>
          <button
            onClick={() => handleSort('date-newest')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
          >
            📅 Newest
          </button>
          <button
            onClick={() => handleSort('type')}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[40px] text-xs sm:text-sm"
          >
            📝 Type
          </button>
        </div>
      </div>
    </>
  );
});

export default SearchFilterBar;