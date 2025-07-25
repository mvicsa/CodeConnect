import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/counterSlice'
import postsReducer from './slices/postsSlice'
import commentsReducer from './slices/commentsSlice'
import authReducer from './slices/authSlice'
import programmingLanguagesReducer from './slices/programmingLanguagesSlice'
import reactionsReducer from './slices/reactionsSlice'
import notificationsReducer from './slices/notificationsSlice'
import tagsReducer from './slices/tagsSlice'
import searchReducer from './slices/searchSlice'
import followReducer from './slices/followSlice'
import userReducer from './slices/userSlice'
import chatReducer from './slices/chatSlice'
import sparksReducer from './slices/sparksSlice'
import aiSuggestionsReducer from './slices/aiSuggestionsSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    posts: postsReducer,
    comments: commentsReducer,
    auth: authReducer,
    programmingLanguages: programmingLanguagesReducer,
    reactions: reactionsReducer,
    notifications: notificationsReducer,
    tags: tagsReducer,
    search: searchReducer,
    follow: followReducer,
    user: userReducer,
    chat: chatReducer,
    sparks: sparksReducer,
    aiSuggestions: aiSuggestionsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
