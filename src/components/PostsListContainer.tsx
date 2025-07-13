'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store'
import { fetchPosts } from '../store/slices/postsSlice'
import PostsList from './PostsList'
import { Loader2 } from 'lucide-react'

export default function PostsListContainer() {
  const dispatch = useDispatch<AppDispatch>()
  const { posts, loading, error } = useSelector((state: RootState) => state.posts)

  useEffect(() => {
    dispatch(fetchPosts())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(fetchPosts())
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <PostsList
      posts={posts}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
    />
  )
} 