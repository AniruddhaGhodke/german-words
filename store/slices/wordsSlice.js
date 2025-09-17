import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Data
  words: [],
  
  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  },
  
  // Filters
  filters: {
    search: '',
    type: '',
    sort: ''
  },
  
  // Selection state
  selectedWords: [],
  isSelectMode: false,
  
  // UI state for words
  showGerman: true,
  showEnglish: true,
  
  // Loading states
  isLoading: false,
  error: null
}

const wordsSlice = createSlice({
  name: 'words',
  initialState,
  reducers: {
    // Data actions
    setWords: (state, action) => {
      state.words = action.payload
    },
    addWord: (state, action) => {
      state.words.unshift(action.payload)
      state.pagination.total += 1
    },
    updateWord: (state, action) => {
      const index = state.words.findIndex(word => word.uuid === action.payload.uuid)
      if (index !== -1) {
        state.words[index] = action.payload
      }
    },
    removeWord: (state, action) => {
      state.words = state.words.filter(word => word.uuid !== action.payload)
      state.pagination.total -= 1
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
    setTypeFilter: (state, action) => {
      state.filters.type = action.payload
    },
    setSort: (state, action) => {
      state.filters.sort = action.payload
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Selection actions
    setSelectedWords: (state, action) => {
      state.selectedWords = Array.isArray(action.payload) ? action.payload : Array.from(action.payload)
    },
    addSelectedWord: (state, action) => {
      if (!state.selectedWords.includes(action.payload)) {
        state.selectedWords.push(action.payload)
      }
    },
    removeSelectedWord: (state, action) => {
      state.selectedWords = state.selectedWords.filter(id => id !== action.payload)
    },
    toggleSelectedWord: (state, action) => {
      const index = state.selectedWords.indexOf(action.payload)
      if (index > -1) {
        state.selectedWords.splice(index, 1)
      } else {
        state.selectedWords.push(action.payload)
      }
    },
    clearSelectedWords: (state) => {
      state.selectedWords = []
    },
    setSelectMode: (state, action) => {
      state.isSelectMode = action.payload
      if (!action.payload) {
        state.selectedWords = []
      }
    },
    
    // Display preferences
    setShowGerman: (state, action) => {
      state.showGerman = action.payload
    },
    setShowEnglish: (state, action) => {
      state.showEnglish = action.payload
    },
    
    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload
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
  setWords,
  addWord,
  updateWord,
  removeWord,
  
  // Pagination actions
  setPagination,
  setCurrentPage,
  
  // Filter actions
  setFilters,
  setSearch,
  setTypeFilter,
  setSort,
  clearFilters,
  
  // Selection actions
  setSelectedWords,
  addSelectedWord,
  removeSelectedWord,
  toggleSelectedWord,
  clearSelectedWords,
  setSelectMode,
  
  // Display preferences
  setShowGerman,
  setShowEnglish,
  
  // Loading states
  setLoading,
  setError,
  clearError
} = wordsSlice.actions

export default wordsSlice.reducer

// Selectors
export const selectWords = (state) => state.words.words
export const selectPagination = (state) => state.words.pagination
export const selectFilters = (state) => state.words.filters
export const selectSelectedWords = (state) => state.words.selectedWords
export const selectIsSelectMode = (state) => state.words.isSelectMode
export const selectShowGerman = (state) => state.words.showGerman
export const selectShowEnglish = (state) => state.words.showEnglish
export const selectWordsLoading = (state) => state.words.isLoading
export const selectWordsError = (state) => state.words.error