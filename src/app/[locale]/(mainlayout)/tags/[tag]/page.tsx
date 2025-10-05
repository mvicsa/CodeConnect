'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchPostsByTag, setCurrentTag, resetPostsByTag } from '@/store/slices/tagsSlice'
import PostsList from '@/components/post/PostsList'
import { PostSkeleton } from '@/components/post/PostSkeleton'
import { Hash } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function TagPage() {
  const params = useParams()
  const tag = decodeURIComponent(params.tag as string)
  const dispatch = useDispatch<AppDispatch>()
  const t = useTranslations()
  
  const { postsByTag, loading, error } = useSelector((state: RootState) => state.tags)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (tag) {
      dispatch(setCurrentTag(tag))
      dispatch(resetPostsByTag())
      dispatch(fetchPostsByTag({ tag, refresh: true }))
        .finally(() => setIsInitialLoad(false))
    }
  }, [tag, dispatch])

  const handleRefresh = () => {
    dispatch(fetchPostsByTag({ tag, refresh: true }))
  }

  if (isInitialLoad) {
    return (
      <div className="max-w-3xl mx-auto px-5">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{tag}</h1>
          </div>
          <div className="text-muted-foreground">
            <span className="inline-block w-24 h-4 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{tag}</h1>
        </div>
        <p className="text-muted-foreground">
          {postsByTag.length} {postsByTag.length === 1 ? t('tags.postFound') : t('tags.postsFound')}
        </p>
      </div>

      {postsByTag.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('tags.noPostsFound')} #{tag}</h3>
          <p className="text-muted-foreground">
            No posts have been tagged with this topic yet.
          </p>
        </div>
      ) : (
        <PostsList
          title=""
          posts={postsByTag}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
} 