'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchPosts, fetchPostsByUser } from '../../store/slices/postsSlice'
import PostsList from './PostsList'
import { Loader2 } from 'lucide-react'

interface PostsProfileProps {
  userId?: string;
  limit?: number;
  page?: number;
  title?: string;
}

export default function PostsProfile({ userId: propUserId, limit = 10, page: initialPage = 1, title='Posts' }: PostsProfileProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { posts, loading, error, hasMore, page } = useSelector((state: RootState) => state.posts)
  const { user } = useSelector((state: RootState) => state.auth)
  const initialFetchDone = useRef(false)
  const userId = propUserId || user?._id
  
  // Initial load - only fetch once when user ID is available
  useEffect(() => {
    if (userId && !initialFetchDone.current) {
      dispatch(fetchPostsByUser({ userId, page: initialPage, limit, refresh: true }))
      initialFetchDone.current = true
    }
  }, [dispatch, initialPage, limit, userId])

  // Reset initialFetchDone when user changes
  useEffect(() => {
    initialFetchDone.current = false
  }, [userId])

  const loadMorePosts = useCallback(() => {
    if (hasMore && !loading && userId) {
      dispatch(fetchPostsByUser({ userId, page: page + 1, limit, refresh: false }))
    }
  }, [dispatch, hasMore, loading, page, limit, userId])

  // Working infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      if (scrollPosition > documentHeight - 1000) {
        if (hasMore && !loading) {
          loadMorePosts()
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, loadMorePosts])

  const handleRefresh = () => {
    if (userId) {
      initialFetchDone.current = true
      dispatch(fetchPostsByUser({ userId, page: 1, limit, refresh: true }))
    }
}

  return (
    <>
      <PostsList
        posts={posts}
        loading={loading}
        error={error}
        title={title}
        onRefresh={handleRefresh}
      />
      {loading && posts.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You've reached the end of the posts</p>
        </div>
      )}
    </>
  )
} 