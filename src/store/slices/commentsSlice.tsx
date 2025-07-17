import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { Comment, Reply, Reactions, UserReaction } from '@/types/comments'

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

      // For each comment, get its replies count
      const processedComments = await Promise.all(response.data.map(async (comment) => {
        try {
          // Just get the replies to know how many there are
          const repliesResponse = await axios.get<Reply[]>(`${API_URL}/replies/${comment._id}`);
          return {
            ...comment,
            // Initialize empty replies array but set the correct length
            replies: new Array(repliesResponse.data.length).fill(null)
          };
        } catch (error) {
          return {
            ...comment,
            replies: []
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
      const token = localStorage.getItem('token');
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
      console.error('Error adding comment:', error);
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
      const token = localStorage.getItem('token');
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
      console.error('Error adding reply:', error);
      throw error;
    }
  }
);

// ✅ Edit comment or reply
export const editCommentOrReplyAsync = createAsyncThunk<Comment, { id: string; data: { text?: string; code?: string; codeLang?: string; postId: string; createdBy: string } }>(
  'comments/editCommentOrReplyAsync',
  async ({ id, data }) => {
    try {
      const token = localStorage.getItem('token');
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
      console.error('Error editing comment:', error);
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
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/${idToDelete}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Comment/reply deleted successfully');
    return idToDelete;
  } catch (error) {
    console.error('Error deleting comment/reply:', error);
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
      const token = localStorage.getItem('token');
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
      console.error('Error updating comment reactions:', error);
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
      const token = localStorage.getItem('token');
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
      console.error('Error updating reply reactions:', error);
      throw error;
    }
  }
);

// Helper function to normalize reply data
const normalizeReply = (reply: any): Reply => {
  // Convert Date objects to ISO strings to ensure serializability
  const serializeDate = (date: any): string => {
    if (!date) return new Date().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return date;
    return new Date().toISOString();
  };

  // Create a base reply object with default values
  const baseReply: Reply = {
    _id: reply._id || reply.id || `temp-${Date.now()}`,
    parentCommentId: reply.parentCommentId || '',
    createdBy: {
      _id: 'unknown',
      firstName: 'Unknown',
      lastName: '',
      username: 'user',
      avatar: '',
      email: '',
      createdAt: serializeDate(new Date()),
      updatedAt: serializeDate(new Date())
    },
    text: '',
    code: '',
    codeLang: '',
    createdAt: serializeDate(reply.createdAt),
    postId: reply.postId || '',
    reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
    userReactions: []
  };

  // Handle createdBy field
  if (reply.createdBy) {
    // If createdBy is already a proper object
    baseReply.createdBy = {
      _id: reply.createdBy._id || 'unknown',
      firstName: reply.createdBy.firstName || reply.createdBy.name || 'Unknown',
      lastName: reply.createdBy.lastName || '',
      username: reply.createdBy.username || 'user',
      avatar: reply.createdBy.avatar || '',
      email: reply.createdBy.email || '',
      createdAt: serializeDate(reply.createdBy.createdAt),
      updatedAt: serializeDate(reply.createdBy.updatedAt)
    };
  } else if (reply.user) {
    // If user field is available instead
    baseReply.createdBy = {
      _id: reply.user._id || 'unknown',
      firstName: reply.user.name || reply.user.firstName || 'Unknown',
      lastName: reply.user.lastName || '',
      username: reply.user.username || 'user',
      avatar: reply.user.avatar || '',
      email: reply.user.email || '',
      createdAt: serializeDate(new Date()),
      updatedAt: serializeDate(new Date())
    };
  }

  // Handle content field
  if (reply.content && typeof reply.content === 'object') {
    baseReply.text = reply.content.text || reply.text || '';
    baseReply.code = reply.content.code?.code || reply.code || '';
    baseReply.codeLang = reply.content.code?.language || reply.codeLang || '';
  } else {
    baseReply.text = reply.text || '';
    baseReply.code = reply.code || '';
    baseReply.codeLang = reply.codeLang || '';
  }

  // Handle reactions
  if (reply.reactions) {
    baseReply.reactions = {
      like: reply.reactions.like || 0,
      love: reply.reactions.love || 0,
      wow: reply.reactions.wow || 0,
      funny: reply.reactions.funny || 0,
      dislike: reply.reactions.dislike || 0,
      happy: reply.reactions.happy || 0
    };
  }

  // Handle userReactions
  if (Array.isArray(reply.userReactions)) {
    baseReply.userReactions = reply.userReactions.map((ur: any) => ({
      userId: typeof ur.userId === 'string' ? {
        _id: ur.userId,
        firstName: ur.username || 'User',
        lastName: '',
        username: ur.username || 'user',
        avatar: '',
        email: '',
        createdAt: serializeDate(new Date()),
        updatedAt: serializeDate(new Date())
      } : ur.userId,
      username: ur.username || (typeof ur.userId === 'object' ? ur.userId.username : 'user'),
      reaction: ur.reaction || 'like',
      createdAt: serializeDate(ur.createdAt)
    }));
  }

  return baseReply;
};

// ✅ Fetch replies for a specific comment
export const fetchReplies = createAsyncThunk<Reply[], string>(
  'comments/fetchReplies',
  async (parentCommentId) => {
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
      return []; // Return empty array on error to prevent UI breaking
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
        state.comments = [...existingComments, ...action.payload];
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
          parentComment.replies = action.payload;
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
