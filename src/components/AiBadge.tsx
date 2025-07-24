import { HoverCard } from "@/components/ui/hover-card";
import { HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {  Bot } from "lucide-react";

export default function AIBadge({ role, size = 'sm' }: { role: string, size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    xs: '4',
    sm: '5',
    md: '6',
    lg: '7'
  }

  return (
    <HoverCard> 
        <HoverCardTrigger>
          <Bot className={`size-${sizeMap[size]} inline-flex text-primary mb-1`} />
        </HoverCardTrigger>
        <HoverCardContent className={`text-${size} w-auto p-2 uppercase`}>
            {role || ''}
        </HoverCardContent>
    </HoverCard>
  )

}
