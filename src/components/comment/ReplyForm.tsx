'use client'

import { useState } from 'react'
import CommentEditor from './CommentEditor'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

interface ReplyFormProps {
  initialValue: string
  onSubmit: (text: string) => void
  onCancel?: () => void
  placeholder?: string
  className?: string
}

export default function ReplyForm({ 
  initialValue, 
  onSubmit, 
  onCancel,
  placeholder = "Write a reply...",
  className = ''
}: ReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (content: { text: string; code: string; codeLang: string }) => {
    if (!content.text.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(content.text)
    } catch (error) {
      console.error('Failed to submit reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
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