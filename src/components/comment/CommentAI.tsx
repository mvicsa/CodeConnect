'use client'

import UserAvatar from '../UserAvatar'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import AIBadge from '../AiBadge'
import MarkdownWithCode from '../MarkdownWithCode'
import { AIEvaluation, AISuggestion } from '@/types/ai'
import { formatDate } from 'date-fns'
import CommentSkeleton from './CommentSkeleton'

export default function CommentAI({
  suggestion,
  evaluation,
  postId,
  isLoading = false
}: {
  evaluation?: AIEvaluation | null
  suggestion?: AISuggestion
  postId: string
  isLoading?: boolean
}) {
  const { loading } = useSelector((state: RootState) => state.aiSuggestions)

  // If no suggestion/evaluation and not loading, don't render anything
  if (!suggestion && !evaluation?.evaluation && !loading[postId] && !isLoading) {
    return null
  }

  // Show loading state for post-level AI suggestions or comment-level AI evaluation
  if (loading[postId] || isLoading) {
    return (
      <CommentSkeleton count={1} />
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <UserAvatar src="/ai.png" firstName="AI" />

      <div className="flex-1 overflow-hidden">
        <div className="bg-accent p-3 rounded-xl relative">
          <div className="font-semibold text-sm">
            <span className='me-1'>
              AI Assistant
            </span>
            <AIBadge role="ai-assistant" size='xs' />
          </div>
          <div className="mt-2 text-sm space-y-2">
            {/* Show AI evaluation if present */}
            {evaluation && (
              <MarkdownWithCode 
                content={evaluation?.evaluation}
              />
            )}
            {suggestion?.suggestions && (
                <MarkdownWithCode 
                  content={suggestion.suggestions}
                />
            )}
          </div>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-2 items-center">
          <span>
            {suggestion?.createdAt ? formatDate(suggestion.createdAt, 'MMM d, yyyy hh:mm a') : ''}
            {evaluation?.createdAt ? formatDate(evaluation.createdAt, 'MMM d, yyyy hh:mm a') : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
