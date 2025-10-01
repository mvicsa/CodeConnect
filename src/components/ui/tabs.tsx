"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

// Add RTL detection hook
function useRtlDetection() {
  const [isRtl, setIsRtl] = React.useState(false)

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRtl(document.documentElement.dir === 'rtl')
      
      // Optional: Add mutation observer to detect dir attribute changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'dir') {
            setIsRtl(document.documentElement.dir === 'rtl')
          }
        })
      })
      
      observer.observe(document.documentElement, { attributes: true })
      
      return () => observer.disconnect()
    }
  }, [])

  return isRtl
}

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const isRtl = useRtlDetection()
  
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      dir={isRtl ? "rtl" : "ltr"}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const isRtl = useRtlDetection()
  
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      dir="ltr"
      className={cn(
        "bg-card text-card-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        isRtl ? "flex-row-reverse" : "",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const isRtl = useRtlDetection()
  
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
        isRtl ? "rtl-tab-trigger" : "",
        className
      )}
      {...props}
    >
      <span dir={isRtl ? "rtl" : "ltr"} className={cn(
        "flex items-center justify-center gap-1.5 w-full",
        isRtl ? "text-right" : "text-left"
      )}>
        {children}
      </span>
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  const isRtl = useRtlDetection()
  
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex-1">
      <TabsPrimitive.Content
        data-slot="tabs-content"
        className={cn("flex-1 outline-none", className)}
        {...props}
      />
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
