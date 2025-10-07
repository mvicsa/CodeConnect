import { Skeleton } from "@/components/ui/skeleton"

interface ChatWindowSkeletonProps {
  messageCount?: number
}

export default function ChatWindowSkeleton({ messageCount = 8 }: ChatWindowSkeletonProps) {
  return (
    <div className="flex flex-col h-full border-s">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Messages area skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {Array.from({ length: messageCount }).map((_, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className="max-w-xs">
              {index % 2 === 0 && (
                <Skeleton className="h-3 w-16 mb-1" />
              )}
              <div className="flex items-end gap-2">
                {index % 2 === 0 && (
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                )}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
                {index % 2 !== 0 && (
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                )}
              </div>
              {index % 2 !== 0 && (
                <Skeleton className="h-3 w-16 mt-1 ml-auto" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input area skeleton */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  )
}
