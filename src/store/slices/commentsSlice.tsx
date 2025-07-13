import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { Comment, Reply, CommentContent } from '@/types/comments'

const API_URL = 'http://localhost:3001/comments'

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

// ✅ Fetch all comments
export const fetchComments = createAsyncThunk<Comment[]>(
  'comments/fetchComments',
  async () => {
    const response = await axios.get<Comment[]>(API_URL)
    return response.data
  }
)

// ✅ Add new comment
export const addCommentAsync = createAsyncThunk<Comment, Omit<Comment, 'id'>>(
  'comments/addCommentAsync',
  async (newComment) => {
    // Ensure the comment has the proper structure
    const commentToAdd = {
      ...newComment,
      content: newComment.content || { text: '' },
      replies: newComment.replies || [],
      createdAt: newComment.createdAt || new Date(),
      reactions: newComment.reactions || {}
    }
    
    const response = await axios.post<Comment>(API_URL, commentToAdd)
    return response.data
  }
)

// ✅ Add reply to comment
export const addReplyAsync = createAsyncThunk<Comment, Reply>(
  'comments/addReplyAsync',
  async (newReply, { getState }) => {
    const state = getState() as { comments: CommentsState }
    const parent = state.comments.comments.find(c => c.id === newReply.parentCommentId)
    if (!parent) throw new Error('Parent comment not found')

    // Ensure the reply has the proper structure
    const replyToAdd = {
      ...newReply,
      content: newReply.content || { text: '' },
      createdAt: newReply.createdAt || new Date(),
      reactions: newReply.reactions || {},
      replies: newReply.replies || []
    }

    const updatedReplies = [replyToAdd, ...parent.replies]
    const updatedComment = { ...parent, replies: updatedReplies }

    const response = await axios.put<Comment>(`${API_URL}/${parent.id}`, updatedComment)
    return response.data
  }
)

// ✅ Edit comment or reply
export const editCommentOrReplyAsync = createAsyncThunk<Comment, { id: number; content: CommentContent }>(
  'comments/editCommentOrReplyAsync',
  async ({ id, content }, { getState }) => {
    const state = getState() as { comments: CommentsState }
    const allComments = state.comments.comments
    
    // Check if it's a top-level comment
    const isComment = allComments.find(c => c.id === id)

    if (isComment) {
      // Edit top-level comment
      const response = await axios.patch<Comment>(`${API_URL}/${id}`, { content })
      return response.data
    }

    // If it's a reply, find the parent comment
    const parentComment = allComments.find(c => 
      c.replies && c.replies.some(r => r.id === id)
    )
    
    if (!parentComment) {
      throw new Error('Comment or reply not found')
    }

    // Update the reply within the parent comment
    const updatedReplies = parentComment.replies.map(r =>
      r.id === id ? { ...r, content } : r
    )

    const updatedComment = { ...parentComment, replies: updatedReplies }
    const response = await axios.put<Comment>(`${API_URL}/${parentComment.id}`, updatedComment)
    return response.data
  }
)

// ✅ Delete comment or reply
export const deleteCommentOrReplyAsync = createAsyncThunk<
  number,
  number,
  { state: { comments: CommentsState } }
>('comments/deleteCommentOrReplyAsync', async (idToDelete, { getState }) => {
  const state = getState()
  const allComments = state.comments.comments

  const isTopLevel = allComments.some((c) => c.id === idToDelete)

  if (isTopLevel) {
    // Delete top-level comment
    await axios.delete(`${API_URL}/${idToDelete}`)
    return idToDelete
  } else {
    // Delete a reply
    const parentComment = allComments.find((c) =>
      c.replies?.some((r) => r.id === idToDelete)
    )
    if (!parentComment) throw new Error('Parent comment not found')

    const updatedReplies = parentComment.replies.filter((r) => r.id !== idToDelete)
    const updatedComment = { ...parentComment, replies: updatedReplies }

    await axios.put(`${API_URL}/${parentComment.id}`, updatedComment)
    return idToDelete
  }
})


const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false
        state.comments = action.payload
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch comments'
      })
      .addCase(addCommentAsync.fulfilled, (state, action) => {
        state.comments.unshift(action.payload)
      })
      .addCase(addReplyAsync.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.comments.findIndex(c => c.id === updated.id)
        if (index !== -1) {
          state.comments[index] = updated
        }
      })
      .addCase(editCommentOrReplyAsync.fulfilled, (state, action) => {
        const updated = action.payload
        const index = state.comments.findIndex(c => c.id === updated.id)
        if (index !== -1) {
          state.comments[index] = updated
        }
      })
      .addCase(deleteCommentOrReplyAsync.fulfilled, (state, action) => {
        const idToDelete = action.payload
        state.comments = state.comments.filter((c) => c.id !== idToDelete)
        for (const comment of state.comments) {
          if (comment.replies) {
            comment.replies = comment.replies.filter((r) => r.id !== idToDelete)
          }
        }
      })
  }
})

export default commentsSlice.reducer
