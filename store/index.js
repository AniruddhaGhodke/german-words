import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import wordsReducer from './slices/wordsSlice'
import uiReducer from './slices/uiSlice'
import storiesReducer from './slices/storiesSlice'
import { wordsApi } from './api/wordsApi'
import { storiesApi } from './api/storiesApi'

export const store = configureStore({
  reducer: {
    words: wordsReducer,
    ui: uiReducer,
    stories: storiesReducer,
    [wordsApi.reducerPath]: wordsApi.reducer,
    [storiesApi.reducerPath]: storiesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(wordsApi.middleware, storiesApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)