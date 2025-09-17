"use client";

import React from "react";
import AddWordForm from "../client/AddWordForm";
import SearchBarWrapper from "../client/SearchBarWrapper";
import DataTableWrapper from "../client/DataTableWrapper";

/**
 * Main layout component for the words page
 * Separates search bar from data fetching to prevent unnecessary re-renders
 */
export default function WordsPageLayout({ rate }) {
  return (
    <>
      <AddWordForm />

      {/* Search bar - completely independent of data changes */}
      <SearchBarWrapper />

      {/* Data table - handles its own data fetching and loading states */}
      <DataTableWrapper rate={rate} />
    </>
  );
}