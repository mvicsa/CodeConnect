'use client'

import AdminBadge from '@/components/AdminBadge';
import PostsProfile from '@/components/post/PostsProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { RootState } from '@/store/store';
import { EllipsisVerticalIcon, ShieldCheck, UserPlusIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useSelector } from 'react-redux';


const Page = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  return (
    <div className='max-w-screen-lg mx-auto px-4'>
      <div className='space-y-4 w-full'>
        <Card className='pt-0 relative gap-0 dark:border-0 shadow-none'>
          <CardHeader className='p-0 gap-0'>
            <Image src={user?.cover || "https://images.unsplash.com/photo-1503264116251-35a269479413"} alt="Test" className='w-full h-[300px] object-cover rounded-t-xl' width={1000} height={1000} />
            <CardAction>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className='absolute top-3 right-3 cursor-pointer bg-accent p-1 rounded-sm'>
                <EllipsisVerticalIcon className='w-5 h-5' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </CardAction>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='flex items-end justify-center gap-4 -mt-15'>
              <div className='flex flex-col items-center justify-center order-1'>
                <span className='text-2xl font-bold'>3,000</span>
                <span className='text-sm text-muted-foreground'>Followers</span>
              </div>
              <div className='flex flex-col items-center justify-center order-3'>
                <span className='text-2xl font-bold'>3,001</span>
                <span className='text-sm text-muted-foreground'>Following</span>
              </div>
              <div className='order-2'>
                <Avatar className='w-35 h-35 border-6 border-card'>
                  <AvatarImage src={user?.avatar || "/user.png"} />
                  <AvatarFallback>{user?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className='flex flex-col gap-1 mt-5'>
              <div className='flex items-center justify-center gap-1'>
              <h1 className='text-2xl font-bold'>{user?.firstName} {user?.lastName}</h1>
                {user?.role === 'admin' && (
                  <AdminBadge role={user?.role} size='md' />
                )}
              </div>
              <p className='text-lg text-muted-foreground'>@{user?.username}</p>
              <Button className='cursor-pointer self-center !px-6'>
                <UserPlusIcon className='w-4 h-4' />
                Follow
            </Button>
            </div>
          </CardContent>
        </Card>
        <div className='grid grid-cols-12 gap-4'>
          <div className='hidden md:block col-span-3'>
            <Card className='w-full dark:border-0 shadow-none'>
              <CardHeader>
                <CardTitle  className='text-xl font-bold mb-3' >About me</CardTitle>
                  <p className='text-sm'>
                    Hi! My name is MOHAMED! I have a Twitch channel where I stream, play and review all the newest games.
                  </p>
                <div className='flex flex-row gap-8 mt-4'>
                    <span className='text-sm text-muted-foreground'>Location</span>
                    <span className='text-sm'>
                      Mansoura
                    </span>
                </div>
                <div className='flex flex-row gap-9'>
                    <span className='text-sm text-muted-foreground'>Country</span>
                    <span className='text-sm'>Egypt</span>
                </div>
                <div className='flex flex-row gap-16'>
                    <span className='text-sm text-muted-foreground'>Age</span>
                    <span className='text-sm'>
                      28
                    </span>
                </div>
              </CardHeader>
            </Card>
            <h4 className='mt-10  mb-4 text-2xl font-bold'>Skills</h4>
            <div>
              <div className='flex flex-wrap gap-2'>
                {/* loop through user skills */}
                {user?.skills?.map((skill: string, index: number) => (
                  <span key={index} className='bg-card border dark:border-0 px-3 py-1 rounded-full text-sm'>{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <div className='col-span-12 md:col-span-9'>
            <PostsProfile />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
