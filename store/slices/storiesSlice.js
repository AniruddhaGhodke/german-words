import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Data
  stories: [],
  selectedStory: null,
  
  // Pagination
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  },
  
  // Filters and sorting
  filters: {
    search: '',
    style: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // UI state
  isViewerOpen: false,
  deleteConfirmId: null,
  
  // Loading states
  isLoading: false,
  isExporting: false,
  error: null
}

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    // Data actions
    setStories: (state, action) => {
      state.stories = action.payload
    },
    addStory: (state, action) => {
      state.stories.unshift(action.payload)
      state.pagination.total += 1
    },
    updateStory: (state, action) => {
      const index = state.stories.findIndex(story => story._id === action.payload._id)
      if (index !== -1) {
        state.stories[index] = action.payload
      }
    },
    removeStory: (state, action) => {
      state.stories = state.stories.filter(story => story._id !== action.payload)
      state.pagination.total -= 1
    },
    setSelectedStory: (state, action) => {
      state.selectedStory = action.payload
    },
    
    // Pagination actions
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setCurrentPage: (state, action) => {
      state.pagination.page = action.payload
    },
    
    // Filter actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload
    },
    setStyleFilter: (state, action) => {
      state.filters.style = action.payload
    },
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload
    },
    setSortOrder: (state, action) => {
      state.filters.sortOrder = action.payload
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // UI actions
    setViewerOpen: (state, action) => {
      state.isViewerOpen = action.payload
      if (!action.payload) {
        state.selectedStory = null
      }
    },
    setDeleteConfirmId: (state, action) => {
      state.deleteConfirmId = action.payload
    },
    
    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setExporting: (state, action) => {
      state.isExporting = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const {
  // Data actions
  setStories,
  addStory,
  updateStory,
  removeStory,
  setSelectedStory,
  
  // Pagination actions
  setPagination,
  setCurrentPage,
  
  // Filter actions
  setFilters,
  setSearch,
  setStyleFilter,
  setSortBy,
  setSortOrder,
  clearFilters,
  
  // UI actions
  setViewerOpen,
  setDeleteConfirmId,
  
  // Loading states
  setLoading,
  setExporting,
  setError,
  clearError
} = storiesSlice.actions

export default storiesSlice.reducer

// Selectors
export const selectStories = (state) => state.stories.stories
export const selectSelectedStory = (state) => state.stories.selectedStory
export const selectStoriesPagination = (state) => state.stories.pagination
export const selectStoriesFilters = (state) => state.stories.filters
export const selectIsViewerOpen = (state) => state.stories.isViewerOpen
export const selectDeleteConfirmId = (state) => state.stories.deleteConfirmId
export const selectStoriesLoading = (state) => state.stories.isLoading
export const selectStoriesExporting = (state) => state.stories.isExporting
export const selectStoriesError = (state) => state.stories.error