'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchComments } from '@/store/slices/commentsSlice'
import { fetchReactionTypes } from '@/store/slices/reactionsSlice'
import { useReactions } from '@/hooks/useReactions'
import ReactionMenu from './Reacts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

export default function ReactionsDemo() {
  const dispatch = useDispatch<AppDispatch>()
  const { comments, loading: commentsLoading } = useSelector((state: RootState) => state.comments)
  const { reactionTypes, loading: reactionsLoading } = useSelector((state: RootState) => state.reactions)
  const { handlePostReaction, handleCommentReaction, handleReplyReaction } = useReactions()

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchComments())
    dispatch(fetchReactionTypes())
  }, [dispatch])

  const handleDemoPostReaction = async () => {
    const result = await handlePostReaction('1', 'user1', 'demo_user', 'like')
    console.log('Post reaction result:', result)
  }

  const handleDemoCommentReaction = async () => {
    if (comments.length > 0) {
      const result = await handleCommentReaction(comments[0].id.toString(), 'user1', 'demo_user', 'love')
      console.log('Comment reaction result:', result)
    }
  }

  const handleDemoReplyReaction = async () => {
    if (comments.length > 0 && comments[0].replies.length > 0) {
      const parentComment = comments[0]
      const reply = parentComment.replies[0]
      const result = await handleReplyReaction(parentComment.id, reply.id, 'user1', 'demo_user', 'wow')
      console.log('Reply reaction result:', result)
    }
  }

  if (commentsLoading || reactionsLoading) {
    return <div className="p-4">Loading reactions demo...</div>
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Redux Reactions Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Available Reaction Types:</h3>
            <div className="flex gap-2 flex-wrap">
              {reactionTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                  <span>{type.name}</span>
                  <span className="text-xs text-muted-foreground">({type.icon})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Demo Post Reactions:</h3>
              <div className="flex items-center gap-4">
                <ReactionMenu 
                  postId="demo-post-1"
                  reactions={{ like: 5, love: 3, wow: 1, funny: 2, dislike: 0, happy: 0 }}
                  userReactions={[
                    { userId: 'user1', username: 'demo_user', reaction: 'like', createdAt: new Date().toISOString() }
                  ]}
                  currentUserId="user1"
                  currentUsername="demo_user"
                />
                <Button onClick={handleDemoPostReaction} size="sm">
                  Add Demo Post Reaction
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Demo Comment Reactions:</h3>
              {comments.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ReactionMenu 
                    commentId={comments[0].id.toString()}
                    reactions={{ ...comments[0].reactions }}
                    userReactions={comments[0].userReactions}
                    currentUserId="user1"
                    currentUsername="demo_user"
                  />
                  <Button onClick={handleDemoCommentReaction} size="sm">
                    Add Demo Comment Reaction
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No comments available for demo</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Demo Reply Reactions:</h3>
              {comments.length > 0 && comments[0].replies.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ReactionMenu 
                    parentCommentId={comments[0].id}
                    replyId={comments[0].replies[0].id}
                    reactions={{
                      like: 0,
                      love: 0,
                      wow: 0,
                      funny: 0,
                      dislike: 0,
                      happy: 0,
                      ...comments[0].replies[0].reactions
                    }}
                    userReactions={comments[0].replies[0].userReactions}
                    currentUserId="user1"
                    currentUsername="demo_user"
                  />
                  <Button onClick={handleDemoReplyReaction} size="sm">
                    Add Demo Reply Reaction
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No replies available for demo</p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Redux State Info:</h3>
            <div className="text-sm space-y-1">
              <p>Total Comments: {comments.length}</p>
              <p>Available Reaction Types: {reactionTypes.length}</p>
              <p>Comments with Reactions: {comments.filter(c => Object.values(c.reactions).some(v => v > 0)).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 