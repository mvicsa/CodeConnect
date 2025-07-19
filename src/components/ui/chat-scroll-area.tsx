import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChatScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-y-auto",
        "scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ChatScrollArea.displayName = "ScrollArea";

export { ChatScrollArea };
