import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { EllipsisVerticalIcon, FlagIcon, MessageCircleMore, PencilIcon, SendIcon, ShieldCheck, TrashIcon } from 'lucide-react'
import Image from 'next/image'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { useTranslations } from 'next-intl'
import ReactionMenu from './Reacts'
import VideoPlayer from './VideoPlayer'
import CodeBlock from './CodeBlock'
import { PostType } from '@/types/post'
import Tags from './Tags'
import UserAvatar from './UserAvatar'
import CommentSection from './CommentSection'
import { memo } from 'react'

const Post = memo(function Post({ post }: { post: PostType }) {
  const { id, text, image, video, code, codeLang, tags, createdBy, createdAt, updatedAt, reactions, userReactions } = post;
  const t = useTranslations();
  
  return (
    <Card className='w-full max-w-2xl my-8 gap-4 shadow-none dark:border-transparent'>
        <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Link href="#">
                <UserAvatar />
              </Link>
              <div>
                <div className='align-middle'>
                  <Link href="#" className='text-xl font-medium me-1'>Shadcn</Link>
                  <HoverCard>
                    <HoverCardTrigger>
                      <ShieldCheck className='size-5 text-primary inline-flex mb-1' />
                    </HoverCardTrigger>
                    <HoverCardContent className='text-sm w-auto p-2 uppercase'>
                      { t('admin') }
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <div className='flex items-center font-light gap-2'>
                  <Link href="#" className='text-sm text-muted-foreground'>@shadcn</Link>
                  <div className='w-1 h-1 bg-primary rounded-full' />
                  <p className='text-sm text-primary'>1 hour ago</p>
                </div>
              </div>
            </CardTitle>
            <CardAction>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className='cursor-pointer outline-none'>
                  <EllipsisVerticalIcon className='size-4 text-muted-foreground' />
                </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='cursor-pointer'>
                      <PencilIcon className='size-4' />
                      { t('edit') }
                    </DropdownMenuItem>
                    <DropdownMenuItem className='cursor-pointer'>
                      <TrashIcon className='size-4' />
                      { t('delete') }
                    </DropdownMenuItem>
                    <DropdownMenuItem className='cursor-pointer'>
                      <FlagIcon className='size-4' />
                      { t('report') }
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          { text && <p>{ text }</p> }
          { image && <Image src="https://github.com/shadcn.png" alt="Shadcn" width={500} height={500} className='w-full max-h-96 rounded-lg object-cover' /> }
          { video && <VideoPlayer source={video} /> }
          { code && <CodeBlock
            code={ code }
            language={ codeLang }
          /> }
          { tags && <Tags tags={ tags } /> }
        </CardContent>
        <CardFooter className='flex flex-col items-start gap-3'>
          <div className='flex items-center gap-4'>
            <ReactionMenu 
              postId={id}
              reactions={{
                like: 0,
                love: 0,
                wow: 0,
                funny: 0,
                dislike: 0,
                happy: 0,
                ...reactions
              }}
              userReactions={userReactions || []}
              currentUserId="user1"
              currentUsername="you"
            />
            <MessageCircleMore className='size-5 text-muted-foreground' />
            <SendIcon className='size-5 text-muted-foreground' />
          </div>
          <div className='border-t border-muted-foreground/20 w-full'>
            <CommentSection postId={id} />
          </div>
        </CardFooter>
    </Card>
  )
})

export default Post 