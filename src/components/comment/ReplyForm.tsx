'use client'

import CommentEditor from './CommentEditor'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

interface ReplyFormProps {
  initialValue: string
  onSubmit: (text: string) => void
  placeholder?: string
  className?: string
}

export default function ReplyForm({ 
  initialValue, 
  onSubmit, 
  placeholder = "Write a reply...",
  className = ''
}: ReplyFormProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (content: { text: string; code: string; codeLang: string }) => {
    if (!content.text.trim()) return
    
    try {
      await onSubmit(content.text)
    } catch (error) {
      console.error('Failed to submit reply:', error)
    }
  }

  return (
    user && (
      <div className={`mt-3 space-y-3 ${className}`}>
        <CommentEditor
          initialValue={{ text: initialValue, code: '', codeLang: '' }}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          showCodeToggle={false}
        />
      </div>
    )
  )
} 