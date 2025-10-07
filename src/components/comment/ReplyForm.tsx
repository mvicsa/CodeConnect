'use client'

import CommentEditor from './CommentEditor'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { forwardRef, Ref } from 'react'
import { toast } from 'sonner'

interface ReplyFormProps {
  initialValue: string
  onSubmit: (text: string) => void
  placeholder?: string
  className?: string
  ref?: Ref<HTMLDivElement>
}

export default forwardRef(function ReplyForm({ 
  initialValue, 
  onSubmit, 
  placeholder = "Write a reply...",
  className = ''
}: ReplyFormProps, forwardedRef: Ref<HTMLDivElement>) {
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (content: { text: string; code: string; codeLang: string }) => {
    if (!content.text.trim()) return
    
    try {
      await onSubmit(content.text)
    } catch {
      toast.error('Failed to submit reply');
    }
  }

  return (
    user && (
      <div ref={forwardedRef} className={`mt-3 space-y-3 ${className}`} data-reply-form="true">
        <CommentEditor
          initialValue={{ text: initialValue, code: '', codeLang: '' }}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          showCodeToggle={false}
        />
      </div>
    )
  )
}) 