import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice'
import commentsReducer from './slices/commentsSlice'
import postReducer from './slices/postsSlice'
import programmingLanguagesReducer from './slices/programmingLanguagesSlice'
import reactionsReducer from './slices/reactionsSlice'


export const store = configureStore({
  reducer: {
    counter: counterReducer,
    posts: postReducer,
    comments: commentsReducer,
    programmingLanguages: programmingLanguagesReducer,
    reactions: reactionsReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
