'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestAPIPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testFetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔍 Testing API connection...')
      const response = await fetch('http://localhost:3001/posts')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('✅ Posts fetched successfully:', data)
      setPosts(data)
    } catch (err) {
      console.error('❌ Failed to fetch posts:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testFetchPost = async (postId: string) => {
    try {
      console.log(`🔍 Testing fetch for post ${postId}...`)
      const response = await fetch(`http://localhost:3001/posts/${postId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log(`✅ Post ${postId} fetched successfully:`, data)
      return data
    } catch (err) {
      console.error(`❌ Failed to fetch post ${postId}:`, err)
      throw err
    }
  }

  const testUpdatePost = async (postId: string) => {
    try {
      console.log(`🔍 Testing update for post ${postId}...`)
      const currentPost = await testFetchPost(postId)
      
      const updatedReactions = {
        ...currentPost.reactions,
        like: (currentPost.reactions?.like || 0) + 1
      }
      
      const updatedUserReactions = [
        ...(currentPost.userReactions || []),
        {
          userId: 'test-user',
          username: 'test_user',
          reaction: 'like',
          createdAt: new Date().toISOString()
        }
      ]
      
      const response = await fetch(`http://localhost:3001/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reactions: updatedReactions,
          userReactions: updatedUserReactions
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Post ${postId} updated successfully:`, data)
      return data
    } catch (err) {
      console.error(`❌ Failed to update post ${postId}:`, err)
      throw err
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testFetchPosts} disabled={loading}>
                {loading ? 'Testing...' : 'Test Fetch Posts'}
              </Button>
              {posts.length > 0 && (
                <Button onClick={() => testUpdatePost(posts[0].id)}>
                  Test Update First Post
                </Button>
              )}
            </div>
            
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {posts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Posts Data:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(posts, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 