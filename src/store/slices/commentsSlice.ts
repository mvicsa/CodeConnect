import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Comment, Reply } from '@/types/comments';
import { getAuthToken } from '@/lib/cookies';
import { toast } from 'sonner';

// Backend URL configuration - using direct URLs now

interface CommentsState {
  comments: Comment[]
  loading: boolean
  error: string | null
  hasMore: Record<string, boolean> // Track hasMore for each post
  totalCounts: Record<string, number> // Track total counts for each post
  visibleCounts: Record<string, number> // Track visible counts for each post
}

const initialState: CommentsState = {
  comments: [],
  loading: false,
  error: null,
  hasMore: {},
  totalCounts: {},
  visibleCounts: {}
}

// ✅ Fetch comments with backend pagination and highlighting
export const fetchComments = createAsyncThunk<{ comments: Comment[]; isInitialLoad: boolean; totalCount: number; hasMore: boolean }, { postId: string; offset?: number; limit?: number; highlight?: string }>(
  'comments/fetchComments',
  async ({ postId, offset = 0, limit = 10, highlight }) => {
    try {
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (highlight) {
        params.append('highlight', highlight);
      }
      
      // Add cache-busting parameter to prevent 304 Not Modified responses
      params.append('_t', Date.now().toString());
      
      // Get comments from backend API
      // Backend should return: highlighted comment (if exists) + normal limit of comments
      // Example: if limit=10 and highlight exists, return highlighted + 10 others = 11 total
      const response = await axios.get<{ comments: Comment[]; total: number; hasMore: boolean }>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/post/${postId}?${params.toString()}`
      );


      // Backend should provide repliesCount with each comment
      const processedComments = response.data.comments.map(comment => ({
        ...comment,
        replies: comment.replies || [], // Initialize empty replies array
        repliesCount: comment.repliesCount || 0
      }));

      return {
        comments: processedComments,
        isInitialLoad: offset === 0,
        totalCount: response.data.total,
        hasMore: response.data.hasMore
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized - Please log in again');
        }
      }
      throw error;
    }
  }
);

// ✅ Get comment context for highlighting
export const getCommentContext = createAsyncThunk<{ comment: Comment; isReply: boolean; parentComment?: Comment; postId: string }, string>(
  'comments/getCommentContext',
  async (commentId) => {
    try {
      const response = await axios.get<{ comment: Comment; isReply: boolean; parentComment?: Comment; postId: string }>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}/context`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

// ✅ Add new comment
export const addCommentAsync = createAsyncThunk<Comment, {
  text?: string,
  code?: string,
  codeLang?: string,
  postId: string,
  createdBy: string
}>(
  'comments/addCommentAsync',
  async (commentData) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authorization token found');

      const response = await axios.post<Comment>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments`,
        {
          text: commentData.text,
          code: commentData.code || '',
          codeLang: commentData.codeLang || '',
          postId: commentData.postId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return {
        ...response.data,
        replies: [] // Initialize empty replies array
      };
    } catch (error) {
      throw error;
    }
  }
);

// ✅ Add reply to comment
export const addReplyAsync = createAsyncThunk<Reply, {
  parentCommentId: string,
  text: string,
  code?: string,
  codeLang?: string,
  postId: string
}>(
  'comments/addReplyAsync',
  async (replyData) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authorization token found');

      const response = await axios.post<Reply>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments`,
        {
          parentCommentId: replyData.parentCommentId,
          text: replyData.text,
          code: replyData.code || '',
          codeLang: replyData.codeLang || '',
          postId: replyData.postId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

// ✅ Edit comment or reply
export const editCommentOrReplyAsync = createAsyncThunk<Comment, { id: string; data: { text?: string; code?: string; codeLang?: string; postId: string; createdBy: string } }>(
  'comments/editCommentOrReplyAsync',
  async ({ id, data }) => {
    try {
      const token = getAuthToken();
      const response = await axios.put<Comment>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${id}`,
        {
          text: data.text,
          code: data.code || '',
          codeLang: data.codeLang || '',
          postId: data.postId,
          createdBy: data.createdBy,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
)

// ✅ Delete comment or reply
export const deleteCommentOrReplyAsync = createAsyncThunk<
  string,
  string
>('comments/deleteCommentOrReplyAsync', async (idToDelete) => {
  try {
    const token = getAuthToken();
    
    // Delete the comment/reply from backend
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/comments/${idToDelete}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return idToDelete;
  } catch (error) {
    throw error;
  }
})

// ✅ Update comment reactions
export const updateCommentReactionsAsync = createAsyncThunk<
  Comment,
  { commentId: string; reaction: string }
>(
  'comments/updateCommentReactionsAsync',
  async ({ commentId, reaction }) => {
    try {
      const token = getAuthToken();
      const response = await axios.post<Comment>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}/reactions`,
        { reaction },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Return the full updated comment
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

// ✅ Update reply reactions
export const updateReplyReactionsAsync = createAsyncThunk<
  Comment,
  { parentCommentId: string; replyId: string; reaction: string }
>(
  'comments/updateReplyReactionsAsync',
  async ({ parentCommentId, replyId, reaction }) => {
    try {
      const token = getAuthToken();
      // Use the same endpoint as comment reactions but pass the replyId
      const response = await axios.post<Comment>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${replyId}/reactions`,
        { 
          reaction,
          parentCommentId // Include parentCommentId in the request body
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Return the full updated comment with updated replies
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

// ✅ Fetch replies with backend pagination and highlighting
export const fetchReplies = createAsyncThunk<{ replies: Reply[]; isInitialLoad: boolean; totalCount: number; hasMore: boolean }, { parentCommentId: string; offset?: number; limit?: number; highlight?: string }, { rejectValue: string }>(
  'comments/fetchReplies',
  async ({ parentCommentId, offset = 0, limit = 10, highlight }, { rejectWithValue }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (highlight) {
        params.append('highlight', highlight);
      }
      
      // Get replies from backend API
      // Backend should return: highlighted reply (if exists) + normal limit of replies
      // Example: if limit=5 and highlight exists, return highlighted + 5 others = 6 total
      const response = await axios.get<{ replies: Reply[]; total: number; hasMore: boolean }>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/replies/${parentCommentId}?${params.toString()}`
      );
      
      const replies = response.data.replies || (Array.isArray(response.data) ? response.data : []);
      
      return {
        replies: replies,
        isInitialLoad: offset === 0,
        totalCount: response.data.total || replies.length || 0,
        hasMore: response.data.hasMore || false
      };
    } catch {
      toast.error('Failed to fetch replies');
      return rejectWithValue('Failed to fetch replies');
    }
  }
);


const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    updateVisibleCount: (state, action: { payload: { postId: string; count: number } }) => {
      state.visibleCounts[action.payload.postId] = action.payload.count;
    }
  },
  extraReducers: (builder) => {
    builder
       // Handle fetchComments
       .addCase(fetchComments.pending, (state) => {
         state.loading = true;
         state.error = null;
       })
       .addCase(fetchComments.fulfilled, (state, action) => {
         state.loading = false;
         const { postId } = action.meta.arg;
         const { comments: newComments, isInitialLoad, totalCount, hasMore } = action.payload;
         
        // Update hasMore and totalCount for this post
        state.hasMore[postId] = hasMore;
        state.totalCounts[postId] = totalCount;
        
         // Keep existing comments for other posts
         const existingCommentsOtherPosts = state.comments.filter(
           comment => comment.postId !== postId
         );
         
         // Get existing comments for this post
         const existingCommentsThisPost = state.comments.filter(
           comment => comment.postId === postId
         );
         
         let updatedCommentsThisPost: Comment[];
         
         if (isInitialLoad) {
           // Initial load - replace all comments for this post
           updatedCommentsThisPost = newComments.map(newComment => {
             const existingComment = existingCommentsThisPost.find(c => c._id === newComment._id);
             if (existingComment && existingComment.replies && existingComment.replies.length > 0) {
               return {
                 ...newComment,
                 replies: existingComment.replies,
                 repliesCount: existingComment.repliesCount !== undefined ? existingComment.repliesCount : newComment.repliesCount
               };
             }
             return newComment;
           });
         } else {
           // Pagination load - append new comments
           // Don't filter out highlighted comments - they might be duplicates but needed for highlighting
           updatedCommentsThisPost = [...existingCommentsThisPost, ...newComments];
         }
         
         state.comments = [...existingCommentsOtherPosts, ...updatedCommentsThisPost];
         
         // Update visible count after updating comments
         if (isInitialLoad) {
           state.visibleCounts[postId] = Math.max(newComments.length, 3);
         } else {
           // For pagination loads, update visible count to show all loaded comments
           state.visibleCounts[postId] = Math.max(updatedCommentsThisPost.length, state.visibleCounts[postId] || 3);
         }
       })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch comments';
      })
      
      // Handle fetchReplies
      .addCase(fetchReplies.fulfilled, (state, action) => {
        const { parentCommentId } = action.meta.arg;
        const { replies: newReplies, isInitialLoad, totalCount } = action.payload;
        
        // Find the parent comment and update its replies
        const parentComment = state.comments.find(c => c._id === parentCommentId);
        if (parentComment) {
          const currentReplies = parentComment.replies || [];
          
          if (isInitialLoad) {
            // Initial load - replace all replies
            parentComment.replies = newReplies;
            parentComment.repliesCount = totalCount;
          } else {
            // Pagination load - append new replies
            const newUniqueReplies = newReplies.filter(
              newReply => !currentReplies.some(existing => existing._id === newReply._id)
            );
            parentComment.replies = [...currentReplies, ...newUniqueReplies];
          }
        }
      })
      
      // Handle addCommentAsync
      .addCase(addCommentAsync.fulfilled, (state, action) => {
        state.comments.unshift(action.payload);
      })
      
      // Handle addReplyAsync
      .addCase(addReplyAsync.fulfilled, (state, action) => {
        const parentCommentId = action.meta.arg.parentCommentId;
        const parentComment = state.comments.find(c => c._id === parentCommentId);
        if (parentComment) {
          // Add new reply at the beginning of the array
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.unshift(action.payload);
          // Update replies count
          parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
          // Update store total count
          state.totalCounts[parentCommentId] = (state.totalCounts[parentCommentId] || 0) + 1;
        }
      })

      // Handle editCommentOrReplyAsync
      .addCase(editCommentOrReplyAsync.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        // Check if it's a top-level comment
        const commentIndex = state.comments.findIndex(c => c._id === updatedComment._id);
        if (commentIndex !== -1) {
          // Update the comment while preserving its replies
          const existingReplies = state.comments[commentIndex].replies;
          state.comments[commentIndex] = {
            ...updatedComment,
            replies: existingReplies
          } as Comment;
        } else {
          // It's a reply, find the parent comment and update the reply
          state.comments = state.comments.map(comment => {
            if (comment.replies?.some(reply => reply?._id === updatedComment._id)) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply._id === updatedComment._id ? updatedComment as Reply : reply
                )
              };
            }
            return comment;
          });
        }
      })

      // Handle deleteCommentOrReplyAsync
      .addCase(deleteCommentOrReplyAsync.fulfilled, (state, action) => {
        const deletedId = action.payload;
        // Check if it's a top-level comment
        const commentIndex = state.comments.findIndex(c => c._id === deletedId);
        if (commentIndex !== -1) {
          // Remove the comment
          state.comments.splice(commentIndex, 1);
        } else {
          // It's a reply, find the parent comment and remove the reply
          state.comments = state.comments.map(comment => {
            if (comment.replies?.some(reply => reply?._id === deletedId)) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply._id !== deletedId)
              };
            }
            return comment;
          });
        }
      })

      // Handle updateCommentReactionsAsync
      .addCase(updateCommentReactionsAsync.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        const commentIndex = state.comments.findIndex(c => c._id === updatedComment._id);
        if (commentIndex !== -1) {
          // Update the comment while preserving its replies
          const existingReplies = state.comments[commentIndex].replies;
          state.comments[commentIndex] = {
            ...updatedComment,
            replies: existingReplies
          } as Comment;
        }
      })

      // Handle updateReplyReactionsAsync
      .addCase(updateReplyReactionsAsync.fulfilled, (state, action) => {
        const updatedReply = action.payload;
        // Find the parent comment and update the specific reply
        state.comments = state.comments.map(comment => {
          if (comment.replies?.some(reply => reply?._id === updatedReply._id)) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply._id === updatedReply._id ? updatedReply as Reply : reply
              )
            };
          }
          return comment;
        });
      })

      // Handle getCommentContext - add parent comment to store if it's a reply
      .addCase(getCommentContext.fulfilled, (state, action) => {
        const { parentComment, isReply } = action.payload;
        
        // If it's a reply and we have parent comment, add it to store if not already there
        if (isReply && parentComment) {
          const existingComment = state.comments.find(c => c._id === parentComment._id);
          if (!existingComment) {
            // Add parent comment to store
            state.comments.push(parentComment);
          }
        }
      });
  }
});

export const { updateVisibleCount } = commentsSlice.actions;
export default commentsSlice.reducer;
