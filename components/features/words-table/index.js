// Main export for the words table feature
export { default } from "./server/WordsPageLayout";
export { default as WordsPageLayout } from "./server/WordsPageLayout";
export { default as WordsTableServer } from "./server/WordsTableServer";
export { default as EmptyStateServer } from "./server/EmptyStateServer";
export { default as PaginationServer } from "./server/PaginationServer";

// Client components
export { default as AddWordForm } from "./client/AddWordForm";
export { default as SearchFilterBar } from "./client/SearchFilterBar";
export { default as BulkActionsBar } from "./client/BulkActionsBar";
export { default as WordsTableClient } from "./client/WordsTableClient";
export { default as WordActionsCell } from "./client/WordActionsCell";

// Hooks
export { useSearch } from "./hooks/useSearch";
export { useFilters } from "./hooks/useFilters";
export { useBulkActions } from "./hooks/useBulkActions";
export { useWordActions } from "./hooks/useWordActions";