"use client";

import React, { useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetWordsQuery } from "@/store/api/wordsApi";
import {
  selectPagination,
  selectFilters,
  setPagination
} from "@/store/slices/wordsSlice";
import toast from "react-hot-toast";
import WordsTableServer from "../server/WordsTableServer";
import EmptyStateServer from "../server/EmptyStateServer";
import PaginationServer from "../server/PaginationServer";

/**
 * Component that handles data fetching and table display
 * Completely separate from SearchBarWrapper
 */
export default function DataTableWrapper({ rate }) {
  const dispatch = useAppDispatch();
  const pagination = useAppSelector(selectPagination);
  const filters = useAppSelector(selectFilters);

  // RTK Query for data fetching
  const {
    data: wordsResponse,
    error,
    isLoading,
    isFetching,
    refetch
  } = useGetWordsQuery({
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search,
    type: filters.type,
    sort: filters.sort
  });

  const data = useMemo(() => wordsResponse?.data || [], [wordsResponse?.data]);
  const paginationData = useMemo(() =>
    wordsResponse?.pagination || pagination,
    [wordsResponse?.pagination, pagination]
  );

  // Update pagination in Redux when data changes
  useEffect(() => {
    if (wordsResponse?.pagination) {
      dispatch(setPagination(wordsResponse.pagination));
    }
  }, [wordsResponse?.pagination, dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error('Failed to fetch words');
      console.error('Words fetch error:', error);
    }
  }, [error]);

  if (isLoading || isFetching) {
    return (
      <div className="w-full sm:w-11/12 mx-auto">
        <div className="animate-pulse bg-gray-200 h-64 rounded-b-xl shadow-xl">
          <div className="p-4">
            <div className="h-4 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-11/12 mx-auto">
      {data.length ? (
        <>
          <WordsTableServer
            data={data}
            pagination={paginationData}
            rate={rate}
            filters={filters}
            refetch={refetch}
          />
          <PaginationServer pagination={paginationData} />
        </>
      ) : (
        <EmptyStateServer />
      )}
    </div>
  );
}