import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const storiesApi = createApi({
  reducerPath: 'storiesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Add any auth headers if needed
      return headers
    },
  }),
  tagTypes: ['Story'],
  endpoints: (builder) => ({
    // Fetch stories with pagination and filters
    getStories: builder.query({
      query: ({ page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc', style = 'all', search = '' } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
          style,
          search
        })
        return `stories?${params}`
      },
      transformResponse: (response) => {
        return {
          stories: response.data?.stories || [],
          pagination: response.data?.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      },
      providesTags: (result) =>
        result?.stories
          ? [
              ...result.stories.map(({ _id }) => ({ type: 'Story', id: _id })),
              { type: 'Story', id: 'LIST' },
            ]
          : [{ type: 'Story', id: 'LIST' }],
    }),

    // Generate a new story
    generateStory: builder.mutation({
      query: (storyData) => ({
        url: 'stories/generate',
        method: 'POST',
        body: storyData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Story', id: 'LIST' }],
    }),

    // Get a single story
    getStory: builder.query({
      query: (id) => `stories/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Story', id }],
    }),

    // Update a story
    updateStory: builder.mutation({
      query: ({ id, ...storyData }) => ({
        url: `stories/${id}`,
        method: 'PUT',
        body: storyData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Story', id },
        { type: 'Story', id: 'LIST' },
      ],
    }),

    // Delete a story
    deleteStory: builder.mutation({
      query: (id) => ({
        url: `stories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Story', id },
        { type: 'Story', id: 'LIST' },
      ],
    }),

    // Export story data
    exportStory: builder.query({
      query: (id) => `stories/${id}/export`,
      transformResponse: (response) => response.data,
    }),
  }),
})

export const {
  useGetStoriesQuery,
  useLazyGetStoriesQuery,
  useGenerateStoryMutation,
  useGetStoryQuery,
  useUpdateStoryMutation,
  useDeleteStoryMutation,
  useLazyExportStoryQuery,
} = storiesApi