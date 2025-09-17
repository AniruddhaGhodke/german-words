import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Modal states
  modals: {
    flashcard: {
      isOpen: false,
      word: null
    },
    pronunciation: {
      isOpen: false,
      word: null
    },
    storyGenerator: {
      isOpen: false
    },
    wordAssociation: {
      isOpen: false,
      word: null
    },
    sentenceBuilder: {
      isOpen: false,
      word: null
    },
    ttsSelector: {
      isOpen: false
    }
  },
  
  // Loading states
  loading: {
    words: false,
    stories: false,
    translation: false,
    speech: false,
    general: false
  },
  
  // Error states
  errors: {
    words: null,
    stories: null,
    translation: null,
    speech: null,
    general: null
  },
  
  // Toast/notification states
  notifications: [],
  
  // User preferences
  preferences: {
    speechRate: 0.8,
    selectedVoice: null,
    theme: 'light',
    language: 'en'
  },
  
  // Mobile/responsive states
  isMobileMenuOpen: false,
  
  // Game states
  game: {
    isActive: false,
    currentLevel: 1,
    score: 0,
    timeRemaining: 0
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action) => {
      const { modalType, data } = action.payload
      if (state.modals[modalType]) {
        state.modals[modalType].isOpen = true
        if (data) {
          state.modals[modalType] = { ...state.modals[modalType], ...data }
        }
      }
    },
    closeModal: (state, action) => {
      const modalType = action.payload
      if (state.modals[modalType]) {
        state.modals[modalType].isOpen = false
        // Reset modal data when closing
        if (state.modals[modalType].word !== undefined) {
          state.modals[modalType].word = null
        }
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalType => {
        state.modals[modalType].isOpen = false
        if (state.modals[modalType].word !== undefined) {
          state.modals[modalType].word = null
        }
      })
    },
    
    // Loading actions
    setLoading: (state, action) => {
      const { type, isLoading } = action.payload
      if (state.loading[type] !== undefined) {
        state.loading[type] = isLoading
      }
    },
    setLoadingMultiple: (state, action) => {
      const loadingStates = action.payload
      Object.entries(loadingStates).forEach(([type, isLoading]) => {
        if (state.loading[type] !== undefined) {
          state.loading[type] = isLoading
        }
      })
    },
    
    // Error actions
    setError: (state, action) => {
      const { type, error } = action.payload
      if (state.errors[type] !== undefined) {
        state.errors[type] = error
      }
    },
    clearError: (state, action) => {
      const type = action.payload
      if (state.errors[type] !== undefined) {
        state.errors[type] = null
      }
    },
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(type => {
        state.errors[type] = null
      })
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action) => {
      const id = action.payload
      state.notifications = state.notifications.filter(n => n.id !== id)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Preferences actions
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    setSpeechRate: (state, action) => {
      state.preferences.speechRate = action.payload
    },
    setSelectedVoice: (state, action) => {
      state.preferences.selectedVoice = action.payload
    },
    setTheme: (state, action) => {
      state.preferences.theme = action.payload
    },
    setLanguage: (state, action) => {
      state.preferences.language = action.payload
    },
    
    // Mobile/responsive actions
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    setMobileMenu: (state, action) => {
      state.isMobileMenuOpen = action.payload
    },
    
    // Game actions
    updateGameState: (state, action) => {
      state.game = { ...state.game, ...action.payload }
    },
    startGame: (state, action) => {
      state.game = {
        isActive: true,
        currentLevel: action.payload?.level || 1,
        score: 0,
        timeRemaining: action.payload?.timeLimit || 60
      }
    },
    endGame: (state) => {
      state.game.isActive = false
    },
    updateScore: (state, action) => {
      state.game.score = action.payload
    },
    updateTimeRemaining: (state, action) => {
      state.game.timeRemaining = action.payload
    }
  }
})

export const {
  // Modal actions
  openModal,
  closeModal,
  closeAllModals,
  
  // Loading actions
  setLoading,
  setLoadingMultiple,
  
  // Error actions
  setError,
  clearError,
  clearAllErrors,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Preferences actions
  updatePreferences,
  setSpeechRate,
  setSelectedVoice,
  setTheme,
  setLanguage,
  
  // Mobile/responsive actions
  toggleMobileMenu,
  setMobileMenu,
  
  // Game actions
  updateGameState,
  startGame,
  endGame,
  updateScore,
  updateTimeRemaining
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectModals = (state) => state.ui.modals
export const selectModalState = (modalType) => (state) => state.ui.modals[modalType]
export const selectLoading = (state) => state.ui.loading
export const selectLoadingState = (type) => (state) => state.ui.loading[type]
export const selectErrors = (state) => state.ui.errors
export const selectError = (type) => (state) => state.ui.errors[type]
export const selectNotifications = (state) => state.ui.notifications
export const selectPreferences = (state) => state.ui.preferences
export const selectSpeechRate = (state) => state.ui.preferences.speechRate
export const selectSelectedVoice = (state) => state.ui.preferences.selectedVoice
export const selectTheme = (state) => state.ui.preferences.theme
export const selectLanguage = (state) => state.ui.preferences.language
export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen
export const selectGameState = (state) => state.ui.game