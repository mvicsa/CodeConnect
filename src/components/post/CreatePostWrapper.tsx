'use client'

import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchPosts } from '@/store/slices/postsSlice'
import PostForm from './PostForm'

export default function CreatePostWrapper() {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleCancel = () => {
    // Handle cancel if needed
  }

  const handleSuccess = () => {
    // Refresh posts to show the new post at the top
    dispatch(fetchPosts({ page: 1, limit: 10, refresh: true }))
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