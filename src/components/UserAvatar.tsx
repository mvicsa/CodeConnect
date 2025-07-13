import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function UserAvatar() {
  return (
    <Avatar className='flex items-center justify-center size-13 border-2 border-primary rounded-full bg-primary'>
        <AvatarImage className='rounded-full' src="https://github.com/shadcn.png" />
        <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
