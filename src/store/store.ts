import { configureStore, Middleware } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice'
import commentsReducer from './slices/commentsSlice'
import postReducer from './slices/postsSlice'
import programmingLanguagesReducer from './slices/programmingLanguagesSlice'
import reactionsReducer from './slices/reactionsSlice'
import { editPost } from './slices/postsSlice'
import authReducer from './slices/authSlice'
import aiSuggestionsReducer from './slices/aiSuggestionsSlice'
import chatReducer from './slices/chatSlice'
import followReducer from './slices/followSlice'
import userReducer from './slices/userSlice'
import tagsReducer from './slices/tagsSlice';
import searchReducer from './slices/searchSlice'
import notificationsReducer from './slices/notificationsSlice';
import type { Reactions, UserReaction } from './slices/reactionsSlice';
import type { UserReaction as PostUserReaction } from '@/types/post';

function isAddPostReactionFulfilledAction(
  action: unknown
): action is { type: string; payload: { postId: string; reactions: Reactions; userReactions: UserReaction[] } } {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    action.type === 'reactions/addPostReaction/fulfilled' &&
    'payload' in action &&
    typeof (action as { payload: { postId: string, reactions: Reactions, userReactions: UserReaction[] } }).payload === 'object' &&
    (action as { payload: { postId: string, reactions: Reactions, userReactions: UserReaction[] } }).payload !== null &&
    'postId' in (action as { payload: { postId: string, reactions: Reactions, userReactions: UserReaction[] } }).payload &&
    'reactions' in (action as { payload: { postId: string, reactions: Reactions, userReactions: UserReaction[] } }).payload &&
    'userReactions' in (action as { payload: { postId: string, reactions: Reactions, userReactions: UserReaction[] } }).payload
  );
}

export const reactionSyncMiddleware: Middleware = store => next => (action) => {
  const result = next(action);

  if (isAddPostReactionFulfilledAction(action)) {
    const { postId, reactions, userReactions } = action.payload;

    // Convert userReactions to the correct type
    const convertedUserReactions: PostUserReaction[] = userReactions.map(ur => ({
      ...ur,
      userId: { _id: ur.userId } // or provide more User fields if needed
    }));

    store.dispatch(editPost({
      id: postId,
      data: {
        reactions,
        userReactions: convertedUserReactions
      }
    }));
  }

  return result;
};


export const store = configureStore({
  reducer: {
    counter: counterReducer,
    posts: postReducer,
    comments: commentsReducer,
    programmingLanguages: programmingLanguagesReducer,
    reactions: reactionsReducer,
    auth: authReducer,
    aiSuggestions: aiSuggestionsReducer,
    chat: chatReducer,
    follow: followReducer,
    user: userReducer,
    tags: tagsReducer,
    search: searchReducer,
    notifications: notificationsReducer
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
