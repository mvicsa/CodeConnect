'use client'

import UserAvatar from '../UserAvatar'
import ReactionMenu from '../ReactionsMenu'
import { useTranslations } from 'next-intl'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { Comment } from '@/types/comments'
import AIBadge from '../AiBadge'
import CodeBlock from '../code/CodeBlock'
import MarkdownWithCode from '../MarkdownWithCode'
import { useTheme } from 'next-themes';

interface AISuggestion {
  suggestions: string
  postId: string
  _id: string
  createdAt: string
  updatedAt: string
}

export default function CommentAI({
  suggestion,
  postId
}: {
  suggestion?: AISuggestion
  postId: string
}) {
  const t = useTranslations()
  const { user } = useSelector((state: RootState) => state.auth)
  const { loading } = useSelector((state: RootState) => state.aiSuggestions)
  const { theme } = useTheme();

  // If no suggestion and not loading, don't render anything
  if (!suggestion && !loading[postId]) {
    return null
  }

  // Show loading state
  if (loading[postId]) {
    return (
      <div className="flex gap-3 items-start animate-pulse">
        <div className="w-10 h-10 rounded-full bg-accent"></div>
        <div className="flex-1">
          <div className="bg-accent p-3 rounded-xl h-24"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <UserAvatar src="/ai.avif" firstName="AI" />

      <div className="flex-1 overflow-hidden">
        <div className="bg-accent p-3 rounded-xl relative">
          <div className="font-semibold text-sm">
            <span className='me-1'>
              AI Assistant
            </span>
            <AIBadge role="ai-assistant" size='xs' />
          </div>
          <div className="mt-2 text-sm space-y-2">
            {suggestion?.suggestions && (
                <MarkdownWithCode 
                  content={suggestion.suggestions} 
                  theme={theme === 'dark' ? 'dark' : 'light'} 
                />
            )}
          </div>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-2 items-center">
          <span>{suggestion?.createdAt ? new Date(suggestion.createdAt).toLocaleString() : ''}</span>
        </div>
      </div>
    </div>
  )
}
