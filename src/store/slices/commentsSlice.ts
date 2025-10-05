import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Comment, Reply } from '@/types/comments';
import { getAuthToken } from '@/lib/cookies';

// Backend URL configuration
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/comments`

interface CommentsState {
  comments: Comment[]
  loading: boolean
  error: string | null
}

const initialState: CommentsState = {
  comments: [],
  loading: false,
  error: null,
}

// ✅ Fetch all comments by id /post/:id (only top-level comments)
export const fetchComments = createAsyncThunk<Comment[], string>(
  'comments/fetchComments',
  async (postId) => {
    try {
      // Get all comments for the post
      const response = await axios.get<Comment[]>(`${API_URL}/post/${postId}`);

      // Return comments with replies count but without loading replies automatically
      const processedComments = await Promise.all(response.data.map(async (comment) => {
        try {
          // Get replies count by fetching replies but only using the length
          const repliesResponse = await axios.get<Reply[]>(`${API_URL}/replies/${comment._id}`);
          return {
            ...comment,
            replies: [], // Initialize empty replies array (don't store the actual replies)
            repliesCount: repliesResponse.data.length // Add replies count
          };
        } catch (error) {
          console.error('Error fetching replies count:', error);
          return {
            ...comment,
            replies: [],
            repliesCount: 0
          };
        }
      }));

      return processedComments;
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
        API_URL,
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
        API_URL,
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
        `${API_URL}/${id}`,
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
    await axios.delete(`${API_URL}/${idToDelete}`, {
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
        `${API_URL}/${commentId}/reactions`,
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
        `${API_URL}/${replyId}/reactions`,
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

// ✅ Fetch replies for a specific comment
export const fetchReplies = createAsyncThunk<Reply[], string, { rejectValue: string }>(
  'comments/fetchReplies',
  async (parentCommentId, { rejectWithValue }) => {
    try {
      const response = await axios.get<Reply[]>(`${API_URL}/replies/${parentCommentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching replies:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      return rejectWithValue('Failed to fetch replies');
    }
  }
);


const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
       // Handle fetchComments
       .addCase(fetchComments.pending, (state) => {
         state.loading = true;
         state.error = null;
       })
       .addCase(fetchComments.fulfilled, (state, action) => {
         state.loading = false;
         // Keep existing comments for other posts and add new ones
         const existingComments = state.comments.filter(
           comment => comment.postId !== action.meta.arg
         );
         // Only update if the comments are actually different
         const newComments = action.payload;
         const currentPostComments = state.comments.filter(
           comment => comment.postId === action.meta.arg
         );
         
         // Check if the comments are actually different
         const hasChanged = newComments.length !== currentPostComments.length ||
           newComments.some((newComment, index) => 
             !currentPostComments[index] || 
             currentPostComments[index]._id !== newComment._id
           );
         
         if (hasChanged) {
           // Preserve existing replies when updating comments
           const updatedComments = newComments.map(newComment => {
             const existingComment = currentPostComments.find(c => c._id === newComment._id);
             if (existingComment && existingComment.replies && existingComment.replies.length > 0) {
               // Keep existing replies if they exist
               return {
                 ...newComment,
                 replies: existingComment.replies,
                 repliesCount: existingComment.repliesCount || newComment.repliesCount
               };
             }
             return newComment;
           });
           state.comments = [...existingComments, ...updatedComments];
         }
       })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch comments';
      })
      
      // Handle fetchReplies
      .addCase(fetchReplies.fulfilled, (state, action) => {
        const parentCommentId = action.meta.arg;
        // Find the parent comment and update its replies
        const parentComment = state.comments.find(c => c._id === parentCommentId);
        if (parentComment) {
          // Only update if the replies are actually different
          const newReplies = action.payload;
          const currentReplies = parentComment.replies || [];
          
          const hasChanged = newReplies.length !== currentReplies.length ||
            newReplies.some((newReply, index) => 
              !currentReplies[index] || 
              currentReplies[index]?._id !== newReply._id
            );
          
          if (hasChanged) {
            parentComment.replies = newReplies;
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
          parentComment.replies.unshift(action.payload);
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
      });
  }
});

export default commentsSlice.reducer;
