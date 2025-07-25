import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface PaginationProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  totalItems?: number
  currentPage?: number
  itemsPerPage?: number
  loadMoreText?: string
  loadingText?: string
}

export function LoadMorePagination({
  hasMore,
  isLoading,
  onLoadMore,
  totalItems,
  loadMoreText = "Load More",
  loadingText = "Loading..."
}: PaginationProps) {
  if (!hasMore) return null

  return (
    <div className="flex flex-col items-center gap-4 pt-8">
      {totalItems && (
        <p className="text-sm text-muted-foreground">
          Showing {totalItems} items
        </p>
      )}
      <Button 
        onClick={onLoadMore} 
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="min-w-[150px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          loadMoreText
        )}
      </Button>
    </div>
  )
}

interface LoadingSkeletonsProps {
  isVisible: boolean
  count?: number
  children: React.ReactNode
  className?: string
}

export function LoadingSkeletons({ 
  isVisible, 
  count = 4, 
  children, 
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6" 
}: LoadingSkeletonsProps) {
  if (!isVisible) return null

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`loading-skeleton-${i}`}>
          {children}
        </div>
      ))}
    </div>
  )
} 