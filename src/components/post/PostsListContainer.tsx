'use client'

import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchPosts } from '../../store/slices/postsSlice'
import PostsList from './PostsList'
import { Loader2 } from 'lucide-react'

interface PostsListContainerProps {
  type?: string;
  limit?: number;
  page?: number;
  title?: string;
}

export default function PostsListContainer({ type, limit = 10, page: initialPage = 1, title }: PostsListContainerProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { posts, loading, error, hasMore, page } = useSelector((state: RootState) => state.posts)

  // Initial load
  useEffect(() => {
    dispatch(fetchPosts({ page: initialPage, limit, type, refresh: true }))
  }, [dispatch, type, limit, initialPage])

  const loadMorePosts = useCallback(() => {
    if (hasMore && !loading) {
      dispatch(fetchPosts({ page: page + 1, limit, type, refresh: false }))
    }
  }, [dispatch, hasMore, loading, page, limit, type])

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
    dispatch(fetchPosts({ page: 1, limit, type, refresh: true }))
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
        <div className="text-center pb-8 text-muted-foreground">
          <p>You&apos;ve reached the end of the posts</p>
        </div>
      )}
    </>
  )
} 