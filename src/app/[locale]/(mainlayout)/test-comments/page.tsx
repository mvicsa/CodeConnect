'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchComments } from '@/store/slices/commentsSlice'
import CommentSection from '@/components/CommentSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestCommentsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { comments, loading, error } = useSelector((state: RootState) => state.comments)
  const { commentReactions } = useSelector((state: RootState) => state.reactions)

  useEffect(() => {
    dispatch(fetchComments())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(fetchComments())
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comments Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div>
                <h3 className="font-semibold">Status:</h3>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>Error: {error || 'None'}</p>
                <p>Total Comments: {comments.length}</p>
                <p>Comment Reactions in Store: {Object.keys(commentReactions).length}</p>
              </div>
              <Button onClick={handleRefresh}>Refresh Comments</Button>
            </div>

            <div>
              <h3 className="font-semibold">Comments Data:</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(comments, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Comment Reactions State:</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(commentReactions, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment Section Test</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentSection postId="1" />
        </CardContent>
      </Card>
    </div>
  )
} 