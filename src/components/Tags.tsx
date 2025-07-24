import { Badge } from './ui/badge'
import { Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TagsProps {
  tags: string[]
  className?: string
  clickable?: boolean
}

export default function Tags({ tags, className = '', clickable = true }: TagsProps) {
  const router = useRouter()

  if (!tags || tags.length === 0) {
    return null
  }

  const handleTagClick = (tag: string) => {
    if (clickable) {
      router.push(`/tags/${encodeURIComponent(tag)}`)
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className={`text-xs px-2 py-1 transition-colors ${
            clickable 
              ? 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80' 
              : 'bg-secondary text-secondary-foreground'
          }`}
          onClick={() => handleTagClick(tag)}
        >
          <Hash className="size-3" />
          {tag}
        </Badge>
      ))}
    </div>
  )
} 