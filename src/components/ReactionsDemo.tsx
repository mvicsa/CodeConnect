'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store/store'
import { fetchReactionTypes } from '../store/slices/reactionsSlice'
import Reactions from './Reactions'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

// Example data structure
const examplePost = {
  id: "1",
  reactions: {
    like: 12,
    love: 5,
    wow: 2,
    funny: 1,
    dislike: 0
  },
  userReactions: [
    {
      userId: "user1",
      username: "mohamed_dev",
      reaction: "like",
      createdAt: "2025-07-01T10:30:00.000Z"
    },
    {
      userId: "user2", 
      username: "sarah_coder",
      reaction: "love",
      createdAt: "2025-07-01T11:00:00.000Z"
    }
  ]
}

const exampleComment = {
  id: "1",
  reactions: {
    like: 5,
    love: 2,
    wow: 1,
    funny: 0,
    dislike: 0
  },
  userReactions: [
    {
      userId: "user2",
      username: "sarah_coder",
      reaction: "like",
      createdAt: "2024-01-15T11:00:00Z"
    }
  ]
}

export default function ReactionsDemo() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Fetch reaction types on mount
    dispatch(fetchReactionTypes())
  }, [dispatch])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Reactions Demo</h1>
      
      {/* Post Reactions */}
      <Card>
        <CardHeader>
          <CardTitle>Post Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>This is an example post about React and Redux Toolkit.</p>
            <Reactions
              reactions={examplePost.reactions}
              userReactions={examplePost.userReactions}
              postId={examplePost.id}
              currentUserId="user1"
              currentUsername="you"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comment Reactions */}
      <Card>
        <CardHeader>
          <CardTitle>Comment Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>This is an example comment with reactions.</p>
            <Reactions
              reactions={exampleComment.reactions}
              userReactions={exampleComment.userReactions}
              commentId={exampleComment.id}
              currentUserId="user1"
              currentUsername="you"
              size="sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Different Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Different Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-2">Small size:</p>
              <Reactions
                reactions={examplePost.reactions}
                userReactions={examplePost.userReactions}
                postId={examplePost.id}
                currentUserId="user1"
                currentUsername="you"
                size="sm"
              />
            </div>
            <div>
              <p className="mb-2">Medium size (default):</p>
              <Reactions
                reactions={examplePost.reactions}
                userReactions={examplePost.userReactions}
                postId={examplePost.id}
                currentUserId="user1"
                currentUsername="you"
                size="md"
              />
            </div>
            <div>
              <p className="mb-2">Large size:</p>
              <Reactions
                reactions={examplePost.reactions}
                userReactions={examplePost.userReactions}
                postId={examplePost.id}
                currentUserId="user1"
                currentUsername="you"
                size="lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 