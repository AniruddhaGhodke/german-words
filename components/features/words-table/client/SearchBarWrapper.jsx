"use client";

import React, { memo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectFilters } from "@/store/slices/wordsSlice";
import SearchFilterBar from "./SearchFilterBar";

/**
 * Wrapper component for SearchFilterBar that gets filters from Redux
 * This component is completely independent of data fetching
 */
const SearchBarWrapper = memo(function SearchBarWrapper() {
  const filters = useAppSelector(selectFilters);

  return (
    <div className="w-full sm:w-11/12 mx-auto mt-6 sm:mt-10">
      <div className="overflow-hidden rounded-t-xl shadow-xl bg-white">
        <div className="text-gray-300 bg-primary">
          <SearchFilterBar filters={filters} />
        </div>
      </div>
    </div>
  );
});

export default SearchBarWrapper;