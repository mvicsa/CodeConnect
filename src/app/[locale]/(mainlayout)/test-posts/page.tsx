'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchPosts } from '@/store/slices/postsSlice'
import Post from '@/components/Post'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestPostsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { posts, loading, error } = useSelector((state: RootState) => state.posts)
  const { postReactions } = useSelector((state: RootState) => state.reactions)

  useEffect(() => {
    dispatch(fetchPosts())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(fetchPosts())
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Posts Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div>
                <h3 className="font-semibold">Status:</h3>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Error: {error || 'None'}</p>
                <p>Total Posts: {posts.length}</p>
                <p>Post Reactions in Store: {Object.keys(postReactions).length}</p>
              </div>
              <Button onClick={handleRefresh}>Refresh Posts</Button>
            </div>

            <div>
              <h3 className="font-semibold">Posts Data:</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(posts, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Post Reactions State:</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(postReactions, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Posts with Reactions</h2>
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
} 