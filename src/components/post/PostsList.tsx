'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import Post from './Post'
import { PostType } from '../../types/post'
import { Button } from '../ui/button'
import { RefreshCw } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'

interface PostsListProps {
  posts?: PostType[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
  title?: string
}

export default function PostsList({
  posts: propPosts,
  loading = false,
  error = null,
  onRefresh,
  className = '',
  title = 'Timeline',
}: PostsListProps) {
  const [localPosts, setLocalPosts] = useState<PostType[]>([])
  const [initialLoad, setInitialLoad] = useState(true)

  // Use Redux posts if no props provided
  const reduxPosts = useSelector((state: RootState) => state.posts.posts)
  const posts = propPosts || reduxPosts

  useEffect(() => {
    setLocalPosts(posts)
    if (posts.length > 0 || !loading) {
      setInitialLoad(false)
    }
  }, [posts, loading])

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-500 mb-4">{error}</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  const PostSkeleton = () => (
    <div className="rounded-lg border dark:border-0 bg-card p-6 shadow-none">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-[180px] w-full mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )

  return (
    <div className={`${className}`}>
      {/* Header */}
      {!initialLoad && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeletons - Show during initial load */}
      {(loading || initialLoad) && localPosts.length === 0 && (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <PostSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Posts */}
      {!loading && localPosts.length > 0 && (
        <div className="space-y-4">
          {localPosts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}

      {/* Empty State - Only show when not loading and confirmed no posts */}
      {localPosts.length === 0 && !loading && !initialLoad && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <RefreshCw className="size-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p>Be the first to share something amazing!</p>
          </div>
        </div>
      )}
    </div>
  )
} 