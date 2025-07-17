'use client'

import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchCodeSuggestions } from '@/store/slices/aiSuggestionsSlice'
import PostForm from './PostForm'

export default function CreatePostWrapper() {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { posts } = useSelector((state: RootState) => state.posts)

  const handleCancel = () => {
    // Handle cancel if needed
  }

  const handleSuccess = (postData?: { code?: string }) => {
    // The Redux slice automatically adds the new post to the UI
    // If the post contains code, fetch AI suggestions
    if (postData?.code && postData.code.trim()) {
      // Get the latest post from the store (which should be the newly created one)
      const latestPost = posts[0] // Newest post is at the beginning
      
      if (latestPost && latestPost._id) {
        dispatch(fetchCodeSuggestions(latestPost._id))
      }
    }
  }

  return (
    user && (
      <PostForm 
        mode="create"
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    )
  )
} 