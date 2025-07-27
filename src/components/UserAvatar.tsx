import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function UserAvatar({ firstName, src, size = 13, className = '' }: { firstName?: string | null, src?: string | null, size?: number, className?: string }) {
  return (
    <Avatar className={`flex items-center justify-center size-${size} border-2 border-primary rounded-full bg-primary flex-shrink-0 ${className}`}>
        <AvatarImage className='rounded-full object-cover w-full h-full' src={src || '/user.png'} />
        <AvatarFallback>{firstName && firstName.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}