// src/components/ReadMore.tsx
'use client'

import React, { useState } from 'react'

interface ReadMoreProps {
  text: string
  maxLength?: number
  readMoreText?: string
  readLessText?: string
  className?: string
  render?: (text: string) => React.ReactNode
}

const ReadMore: React.FC<ReadMoreProps> = ({
  text,
  maxLength = 150,
  readMoreText = 'Read More',
  readLessText = 'Read Less',
  className = '',
  render
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) return null

  const canTruncate = text.length > maxLength
  const displayText = isExpanded || !canTruncate 
    ? text 
    : `${text.substring(0, maxLength)}...`

  return (
    <div className={`${className}`}>
      <div className="whitespace-pre-line">
        {render ? render(displayText) : displayText}
      </div>
      {canTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-block text-primary hover:underline mt-1 text-sm font-medium cursor-pointer"
        >
          {isExpanded ? readLessText : readMoreText}
        </button>
      )}
    </div>
  )
}

export default ReadMore