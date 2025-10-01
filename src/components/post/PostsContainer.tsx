'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchPosts, fetchPostsByUser } from '../../store/slices/postsSlice'
import PostsList from './PostsList'
import { Button } from '../ui/button'
import { PostSkeleton } from './PostSkeleton'
import { Loader2 } from 'lucide-react'

interface PostsContainerProps {
  // Common props
  limit?: number
  page?: number
  title?: string
  
  // Timeline posts props
  type?: string
  
  // Profile posts props
  userId?: string
}

export default function PostsContainer({ 
  type, 
  userId, 
  limit = 10, 
  page: initialPage = 1, 
  title
}: PostsContainerProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const initialFetchDone = useRef(false)
  
  // Determine if this is a profile view
  const isProfileView = !!userId
  const actualUserId = userId || user?._id
  
  // Select appropriate state based on view type
  const timelineState = useSelector((state: RootState) => state.posts)
  const profileState = {
    posts: timelineState.profilePosts,
    loading: timelineState.profileLoading,
    paginationLoading: timelineState.profilePaginationLoading,
    error: timelineState.profileError,
    hasMore: timelineState.profileHasMore,
    page: timelineState.profilePage
  }
  
  const currentState = isProfileView ? profileState : {
    posts: timelineState.posts,
    loading: timelineState.loading,
    paginationLoading: timelineState.paginationLoading,
    error: timelineState.error,
    hasMore: timelineState.hasMore,
    page: timelineState.page
  }
  
  const { posts, loading, paginationLoading, error, hasMore, page } = currentState
  

  // Initial load
  useEffect(() => {
    if (isProfileView) {
      // Profile view
      if (actualUserId && !initialFetchDone.current) {
        dispatch(fetchPostsByUser({ userId: actualUserId as string, page: initialPage, limit, refresh: true }))
        initialFetchDone.current = true
      }
    } else {
      // Timeline view
      dispatch(fetchPosts({ page: initialPage, limit, type, refresh: true }))
    }
  }, [dispatch, type, limit, initialPage, isProfileView, actualUserId])

  // Reset initialFetchDone when user changes (for profile view)
  useEffect(() => {
    if (isProfileView) {
      initialFetchDone.current = false
    }
  }, [actualUserId, isProfileView])

  const loadMorePosts = useCallback(() => {
    if (hasMore && !loading && !paginationLoading) {
      if (isProfileView && actualUserId) {
        dispatch(fetchPostsByUser({ userId: actualUserId as string, page: page + 1, limit, refresh: false }))
      } else {
        dispatch(fetchPosts({ page: page + 1, limit, type, refresh: false }))
      }
    }
  }, [dispatch, hasMore, loading, paginationLoading, page, limit, type, isProfileView, actualUserId])


  const handleRefresh = () => {
    if (isProfileView && actualUserId) {
      initialFetchDone.current = true
      dispatch(fetchPostsByUser({ userId: actualUserId as string, page: 1, limit, refresh: true }))
    } else {
      dispatch(fetchPosts({ page: 1, limit, type, refresh: true }))
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
      
      {/* Loading More Posts Skeleton */}
      {paginationLoading && posts.length > 0 && (
        <div className="space-y-5">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      
      {/* Load More Button */}
      {hasMore && posts.length > 0 && !paginationLoading && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMorePosts}
            variant="outline"
            className="min-w-[120px]"
          >
            <Loader2 className="h-4 w-4" />
            Load More
          </Button>
        </div>
      )}
      
      {/* End of posts message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center text-muted-foreground">
          <p>You&apos;ve reached the end of the posts</p>
        </div>
      )}
    </>
  )
}
