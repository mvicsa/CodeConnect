'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Code } from 'lucide-react'
import CodeBlock from '@/components/code/CodeBlock'
import { Message } from '@/types/chat'

interface CodeMessageProps {
  message: Message
  isCurrentUser: boolean
  onOpenCodeModal?: (code: string, language: string, originalMessage: Message) => void
}

export default function CodeMessage({
  message,
  isCurrentUser,
  onOpenCodeModal
}: CodeMessageProps) {

  return (
    <div className="space-y-3">
      {/* Text content if any */}
      {message.content && (
        <div className="text-sm">
          {message.content}
        </div>
      )}
      
      {/* Code display */}
      {message.codeData && (
        <div className="relative">
          <CodeBlock
            code={message.codeData.code}
            language={message.codeData.language}
            showCopyButton={true}
            maxHeight="300px"
            showExpandButton={true}
          />
          
          {/* Edit button for current user, Send Back button for others */}
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenCodeModal?.(message.codeData?.code || '', message.codeData?.language || 'javascript', message)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {isCurrentUser ? 'Edit' : 'Edit & Send Back'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
