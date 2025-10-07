import { Skeleton } from "@/components/ui/skeleton"

interface ChatSkeletonProps {
  count?: number
}

export default function ChatSkeleton({ count = 5 }: ChatSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 rounded-lg"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  )
}
