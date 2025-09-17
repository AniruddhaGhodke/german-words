"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/store/hooks";
import { setCurrentPage } from "@/store/slices/wordsSlice";

/**
 * Client component for pagination controls
 * Handles pagination interactions
 */
export default function PaginationServer({ pagination }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex justify-center space-x-2 sm:space-x-4 my-6 sm:my-10 items-center flex-wrap gap-2"
    >
      <PageButton
        page={1}
        disabled={!pagination.hasPrev}
        className="hidden sm:inline-flex"
      >
        First
      </PageButton>
      <PageButton
        page={pagination.page - 1}
        disabled={!pagination.hasPrev}
      >
        <span className="sm:hidden">‹</span>
        <span className="hidden sm:inline">Prev</span>
      </PageButton>
      <span className="text-primary font-bold text-sm sm:text-base px-2 py-1 bg-gray-100 rounded">
        {pagination.page} / {pagination.totalPages}
      </span>
      <PageButton
        page={pagination.page + 1}
        disabled={!pagination.hasNext}
      >
        <span className="sm:hidden">›</span>
        <span className="hidden sm:inline">Next</span>
      </PageButton>
      <PageButton
        page={pagination.totalPages}
        disabled={!pagination.hasNext}
        className="hidden sm:inline-flex"
      >
        Last
      </PageButton>
    </motion.div>
  );
}

/**
 * Individual pagination button component
 * Client component for handling clicks
 */
function PageButton({ children, page, disabled, className = "" }) {
  const dispatch = useAppDispatch();

  const handleClick = () => {
    if (!disabled && page) {
      dispatch(setCurrentPage(page));
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base min-h-[40px] ${
        disabled
          ? "bg-gray-300 text-gray-400 cursor-not-allowed"
          : "bg-primary text-gray-200 hover:bg-primary/90"
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}