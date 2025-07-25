'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchAllTags } from '@/store/slices/tagsSlice'
import { TrendingUp } from 'lucide-react'
import { Skeleton } from './ui/skeleton'
import { useTranslations } from 'next-intl'
import Tags from './Tags'

interface TrendingTagsProps {
  limit?: number
  className?: string
}

export default function TrendingTags({ limit = 5, className = '' }: TrendingTagsProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { allTags, loading } = useSelector((state: RootState) => state.tags)
  const t = useTranslations()

  useEffect(() => {
    if (allTags.length === 0) {
      dispatch(fetchAllTags())
    }
  }, [dispatch, allTags.length])

  // Sort tags by count and take the top ones
  const trendingTags = [...allTags]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  if (loading && allTags.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-muted-foreground">{t('tags.trending')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(limit)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (trendingTags.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-muted-foreground">{t('tags.trending')}</h3>
      </div>
      <Tags tags={trendingTags.map(tag => tag.name)} />
    </div>
  )
} 