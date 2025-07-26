import { useEffect, useRef, useCallback } from 'react'

interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  children: React.ReactNode
  className?: string
}

export function InfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200, // Distance from bottom to trigger load (in pixels)
  children,
  className = ""
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [hasMore, isLoading, onLoadMore]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: `${threshold}px`,
      threshold: 0.1
    })

    observerRef.current.observe(sentinel)

    return () => {
      if (observerRef.current && sentinel) {
        observerRef.current.unobserve(sentinel)
      }
    }
  }, [handleIntersect, threshold])

  return (
    <div className={className}>
      {children}
      {/* Sentinel element to trigger intersection */}
      {hasMore && (
        <div 
          ref={sentinelRef} 
          className="h-1 w-full"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Hook for infinite scroll functionality
export function useInfiniteScroll(
  hasMore: boolean,
  isLoading: boolean,
  loadMore: () => void
) {
  const loadMoreRef = useRef(loadMore)
  loadMoreRef.current = loadMore

  const handleScroll = useCallback(() => {
    if (isLoading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    const threshold = 300 // pixels from bottom

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMoreRef.current()
    }
  }, [isLoading, hasMore])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { handleScroll }
} 