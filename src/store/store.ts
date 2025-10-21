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
import archiveReducer from './slices/archiveSlice'
import blockReducer from './slices/blockSlice'
import meetingReducer from './slices/meetingSlice'
import earningsReducer from './slices/earningsSlice'





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
    archive: archiveReducer,
    block: blockReducer,
    meeting: meetingReducer,
    earnings: earningsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'comments/fetchReplies/pending',
          'comments/fetchReplies/fulfilled',
          'comments/addReplyAsync/pending',
          'comments/addReplyAsync/fulfilled',
          'comments/updateCommentReactionsAsync/pending',
          'comments/updateCommentReactionsAsync/fulfilled',
          'comments/updateReplyReactionsAsync/pending',
          'comments/updateReplyReactionsAsync/fulfilled'
        ],
        // Ignore these field paths in the state
        ignoredPaths: [
          'comments.comments.replies',
          'comments.comments.createdAt',
          'comments.comments.updatedAt'
        ]
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
