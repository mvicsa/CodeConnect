import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice'
import commentsReducer from './slices/commentsSlice'
import postReducer from './slices/postsSlice'
import programmingLanguagesReducer from './slices/programmingLanguagesSlice'
import reactionsReducer from './slices/reactionsSlice'
import { editPost } from './slices/postsSlice'
import authReducer from './slices/authSlice'

// Middleware to sync reactions between slices
const reactionSyncMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action)
  
  // If a post reaction was added, sync it to the posts slice
  if (action.type === 'reactions/addPostReaction/fulfilled') {
    const { postId, reactions, userReactions } = action.payload
    store.dispatch(editPost({
      id: postId,
      data: {
        reactions,
        userReactions
      }
    }))
  }
  
  return result
}

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    posts: postReducer,
    comments: commentsReducer,
    programmingLanguages: programmingLanguagesReducer,
    reactions: reactionsReducer,
    auth: authReducer
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
    }).concat(reactionSyncMiddleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
