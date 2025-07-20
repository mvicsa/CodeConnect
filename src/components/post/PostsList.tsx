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

export const PostSkeleton = () => (
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

  return (
    <div className={`${className} mb-10`}>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {loading && <PostSkeleton />}
      {!loading && localPosts.length === 0 && (
        <p className="text-center py-8">No posts yet. Be the first to create one!</p>
      )}
      {!loading && localPosts.length > 0 && (
        <div className="space-y-6">
          {localPosts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}