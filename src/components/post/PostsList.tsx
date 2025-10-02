'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import Post from './Post'
import { PostType } from '../../types/post'
import { Button } from '../ui/button'
import { RefreshCw } from 'lucide-react'
import { useBlock } from '@/hooks/useBlock'
import { PostSkeleton } from './PostSkeleton'

interface PostsListProps {
  posts?: PostType[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
  title?: string
}


const PostsList = function PostsList({
  posts: propPosts,
  loading,
  error = null,
  onRefresh,
  className = '',
  title
}: PostsListProps) {
  const { checkBlockStatus } = useBlock()
  const checkBlockStatusRef = useRef(checkBlockStatus)
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

  // Update ref when checkBlockStatus changes
  useEffect(() => {
    checkBlockStatusRef.current = checkBlockStatus
  }, [checkBlockStatus])

  // Use Redux posts/loading if not provided via props
  const reduxPosts = useSelector((state: RootState) => state.posts.posts)
  const reduxLoading = useSelector((state: RootState) => state.posts.loading)
  const isLoading = (typeof loading === 'boolean') ? loading : reduxLoading
  const posts = (propPosts !== undefined) ? propPosts : reduxPosts

  // Track when we've fetched posts at least once
  useEffect(() => {
    // If we have posts or we're not loading (meaning a fetch completed), mark as fetched
    if (posts.length > 0 || (!isLoading && hasFetchedOnce === false)) {
      setHasFetchedOnce(true)
    }
  }, [posts.length, isLoading, hasFetchedOnce])

  // Check block status for all post authors when posts change
  useEffect(() => {
    if (posts.length > 0) {
      // Get unique author IDs from posts
      const authorIds = [...new Set(posts.map(post => post.createdBy._id).filter(Boolean))]
      
      // Check block status for each author immediately
      authorIds.forEach(authorId => {
        if (authorId) {
          // Check immediately without debouncing for better UX
          checkBlockStatusRef.current(authorId)
        }
      })
    }
  }, [posts])

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
    <div className={`${className} mb-6`}>
      { title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      
      {/* Show skeleton while loading */}
      {isLoading && (
        <div className="space-y-5">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>)
      }
      
      {/* Show "No posts" message when not loading, no posts, and we've fetched at least once */}
      {!isLoading && posts.length === 0 && hasFetchedOnce && (
        <p className="text-center py-8">No posts yet!</p>
      )}
      
      {/* Show posts when not loading and have posts */}
      {!isLoading && posts.length > 0 && (
        <div className="space-y-5">
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

export default PostsList;