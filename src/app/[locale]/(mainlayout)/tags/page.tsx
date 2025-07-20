'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchAllTags } from '@/store/slices/tagsSlice'
import { Skeleton } from '@/components/ui/skeleton'
import { Hash, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Container from '@/components/Container'

export default function TagsIndexPage() {
  const dispatch = useDispatch<AppDispatch>()
  const t = useTranslations()
  
  const { allTags, loading, error } = useSelector((state: RootState) => state.tags)

  useEffect(() => {
    dispatch(fetchAllTags())
  }, [dispatch])

  // Debug: Log the tags data
  console.log('allTags from store:', allTags)

  if (loading) {
    return (
      <Container>
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Container>
    )
  }

  // Sort tags by count (descending) and handle missing count
  const sortedTags = [...allTags]
    .map(tag => {
      if (typeof tag === 'string') {
        return { name: tag, count: 0 }
      }
      return {
        name: tag.name || '',
        count: tag.count || 0
      }
    })
    .sort((a, b) => b.count - a.count)

  console.log('sortedTags:', sortedTags)

  return (
    <Container>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('tags.popular')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('tags.discover')}
        </p>
      </div>

      {sortedTags.length === 0 ? (
        <div className="text-center py-12">
          <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('tags.noTags')}</h3>
          <p className="text-muted-foreground">
            {t('tags.noTagsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="block border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="font-medium text-lg">{tag.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{tag.count}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {tag.count} {tag.count === 1 ? t('tags.postFound') : t('tags.postsFound')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  )
} 