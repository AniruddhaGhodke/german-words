import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const wordsApi = createApi({
  reducerPath: 'wordsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Add any auth headers if needed
      return headers
    },
  }),
  tagTypes: ['Word'],
  endpoints: (builder) => ({
    // Fetch words with pagination and filters
    getWords: builder.query({
      query: ({ page = 1, limit = 10, search = '', type = '', sort = '' } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(type && { type }),
          ...(sort && { sort })
        })
        return `words?${params}`
      },
      transformResponse: (response) => {
        return {
          data: response.data || [],
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ uuid }) => ({ type: 'Word', id: uuid })),
              { type: 'Word', id: 'LIST' },
            ]
          : [{ type: 'Word', id: 'LIST' }],
    }),

    // Add a new word
    addWord: builder.mutation({
      query: (wordData) => ({
        url: 'words',
        method: 'POST',
        body: wordData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Word', id: 'LIST' }],
    }),

    // Update a word
    updateWord: builder.mutation({
      query: ({ uuid, ...wordData }) => ({
        url: `words/${uuid}`,
        method: 'PUT',
        body: wordData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { uuid }) => [
        { type: 'Word', id: uuid },
        { type: 'Word', id: 'LIST' },
      ],
    }),

    // Delete a word
    deleteWord: builder.mutation({
      query: (uuid) => ({
        url: `words/${uuid}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, uuid) => [
        { type: 'Word', id: uuid },
        { type: 'Word', id: 'LIST' },
      ],
    }),

    // Delete multiple words
    deleteWords: builder.mutation({
      query: (uuids) => ({
        url: 'words/batch',
        method: 'DELETE',
        body: { uuids },
      }),
      invalidatesTags: [{ type: 'Word', id: 'LIST' }],
    }),

    // Get a single word
    getWord: builder.query({
      query: (uuid) => `words/${uuid}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, uuid) => [{ type: 'Word', id: uuid }],
    }),

    // Translate word
    translateWord: builder.mutation({
      query: (wordData) => ({
        url: 'translate',
        method: 'POST',
        body: wordData,
      }),
      transformResponse: (response) => response.data,
    }),
  }),
})

export const {
  useGetWordsQuery,
  useLazyGetWordsQuery,
  useAddWordMutation,
  useUpdateWordMutation,
  useDeleteWordMutation,
  useDeleteWordsMutation,
  useGetWordQuery,
  useTranslateWordMutation,
} = wordsApi