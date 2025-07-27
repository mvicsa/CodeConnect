import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function UserAvatar({ firstName, src }: { firstName?: string | null, src?: string | null }) {
  return (
    <Avatar className='flex items-center justify-center size-13 border-2 border-primary rounded-full bg-primary flex-shrink-0'>
        <AvatarImage className='rounded-full object-cover w-full h-full' src={src || '/user.png'} />
        <AvatarFallback>{firstName && firstName.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}