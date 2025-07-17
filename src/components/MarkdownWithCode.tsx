// src/components/ReadMore.tsx
'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

interface ReadMoreProps {
  content: string
  maxLength?: number
  theme?: 'light' | 'dark'
  readMoreText?: string
  readLessText?: string
  className?: string
}

const ReadMore: React.FC<ReadMoreProps> = ({
  content,
  maxLength = 250,
  readMoreText = 'Read More...',
  readLessText = 'Read Less...',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  const canTruncate = content.length > maxLength
  const displayContent = isExpanded || !canTruncate 
    ? content 
    : `${content.substring(0, maxLength)}...`

  return (
    <div className={className}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          code: ({node, className, children, ...props}) => {
            return (
              <span className="px-1.5 py-0.5 my-0.5 rounded bg-background border border-border dark:border-transparent text-sm inline-block">
                {children}
              </span>
            )
          }
        }}
      >
        {displayContent}
      </ReactMarkdown>
      
      {canTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline text-primary hover:underline mt-2 text-sm font-medium cursor-pointer"
        >
          {isExpanded ? readLessText : readMoreText}
        </button>
      )}
    </div>
  )
}

export default ReadMore