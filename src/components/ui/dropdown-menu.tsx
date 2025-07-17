"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

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

  // Add RTL style to document
  React.useEffect(() => {
    if (typeof document !== 'undefined' && isRtl) {
      // Add RTL style to handle text alignment
      const style = document.createElement('style')
      style.innerHTML = `
        .rtl * {
          text-align: right;
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isRtl])

  return isRtl
}

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const isRtl = useRtlDetection()
  
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        isRtl ? "data-[side=left]:slide-in-from-left-2 data-[side=right]:slide-in-from-right-2 rtl" : "",
        className
      )}
      {...props}
    />
  )
})
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, align = "start", ...props }, ref) => {
  const isRtl = useRtlDetection()
  
  // Flip alignment for RTL
  const rtlAlign = isRtl && align !== "center" ? (align === "start" ? "end" : "start") : align
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={rtlAlign}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          isRtl ? "data-[side=left]:slide-in-from-left-2 data-[side=right]:slide-in-from-right-2 rtl" : "",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName



function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  const isRtl = useRtlDetection()
  
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full">
      <DropdownMenuPrimitive.Item
        data-slot="dropdown-menu-item"
        data-inset={inset}
        data-variant={variant}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-full",
          className
        )}
        {...props}
      />
    </div>
  )
}



function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  const isRtl = useRtlDetection()
  
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full">
      <DropdownMenuPrimitive.RadioItem
        data-slot="dropdown-menu-radio-item"
        className={cn(
          "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-full",
          isRtl ? "pr-8 pl-2" : "pr-2 pl-8",
          className
        )}
        {...props}
      >
        <span className={cn(
          "pointer-events-none absolute flex size-3.5 items-center justify-center", 
          isRtl ? "right-2" : "left-2"
        )}>
          <DropdownMenuPrimitive.ItemIndicator>
            <Circle className="size-2 fill-current" />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.RadioItem>
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioItem,
}
