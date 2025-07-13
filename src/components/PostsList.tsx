'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import Post from './Post'
import { PostType } from '../types/post'
import { Button } from './ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

interface PostsListProps {
  posts?: PostType[]
  loading?: boolean
  error?: string | null
  onLoadMore?: () => void
  onRefresh?: () => void
  showLoadMore?: boolean
  className?: string
}

export default function PostsList({
  posts: propPosts,
  loading = false,
  error = null,
  onLoadMore,
  onRefresh,
  showLoadMore = true,
  className = ''
}: PostsListProps) {
  const [localPosts, setLocalPosts] = useState<PostType[]>([])
  
  // Use Redux posts if no props provided - memoize to prevent unnecessary re-renders
  const reduxPosts = useSelector((state: RootState) => state.posts.posts)
  const posts = useMemo(() => propPosts || reduxPosts, [propPosts, reduxPosts])

  useEffect(() => {
    setLocalPosts(posts)
  }, [posts])

  // Mock posts for demo if no posts available
  const demoPosts: PostType[] = [
    {
      id: "1",
      text: "أول بوست لينا عن React و Redux Toolkit.",
      code: "const a = 5;",
      codeLang: "javascript",
      createdBy: "mohamed_dev",
      createdAt: "2025-07-01T10:00:00.000Z",
      updatedAt: "2025-07-01T10:00:00.000Z",
      tags: ["react", "redux", "javascript"],
      reactions: { like: 12, love: 5, wow: 2, funny: 1, dislike: 0 },
      userReactions: [
        {
          userId: "user1",
          username: "mohamed_dev",
          reaction: "like",
          createdAt: "2025-07-01T10:30:00.000Z"
        }
      ]
    },
    {
      id: "2",
      text: "ازاي تنفذ CRUD باستخدام json-server و Redux Toolkit",
      createdBy: "basent_coder",
      createdAt: "2025-07-05T15:30:00.000Z",
      updatedAt: "2025-07-05T15:30:00.000Z",
      tags: ["json-server", "redux-toolkit", "crud"],
      reactions: { like: 8, love: 3, wow: 1, funny: 0, dislike: 0 },
      userReactions: []
    },
    {
      id: "3",
      text: "مشاركة فيديو عن تحسين أداء React Apps",
      video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      createdBy: "nourr",
      createdAt: "2025-07-10T09:00:00.000Z",
      updatedAt: "2025-07-10T09:00:00.000Z",
      tags: ["react", "performance", "video"],
      reactions: { like: 15, love: 7, wow: 3, funny: 2, dislike: 1 },
      userReactions: []
    }
  ]

  const displayPosts = useMemo(() => 
    localPosts.length > 0 ? localPosts : demoPosts, 
    [localPosts]
  )

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

  if (loading && displayPosts.length === 0) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posts</h2>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {displayPosts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>

      {/* Load More */}
      {showLoadMore && onLoadMore && displayPosts.length > 0 && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Posts'
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {displayPosts.length === 0 && !loading && (
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