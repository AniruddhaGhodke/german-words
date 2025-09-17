import React from "react";

/**
 * Server component for empty state when no words exist
 * Pure static content - no interactivity needed
 */
export default function EmptyStateServer() {
  return (
    <div className="mt-20 w-full flex flex-col items-center justify-center text-center p-8">
      <div className="bg-gray-100 rounded-full p-6 mb-6">
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-semibold text-gray-700 mb-2">
        No German words yet!
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">
        Start building your German vocabulary by adding your first word. You can also use the translate feature to help you learn new words.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add Your First Word
        </button>
        <a
          href="/wordGame"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
        >
          Try Word Challenge
        </a>
      </div>
    </div>
  );
}