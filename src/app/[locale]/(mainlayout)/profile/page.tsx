import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import { EllipsisVerticalIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';


const Page = () => {
  return (
    <div className='space-y-4 w-full py-6'>
      <Card className='pt-0 relative gap-0 border-0'>
        <CardHeader className='p-0 gap-0'>
          <Image src="https://images.pexels.com/photos/1448721/pexels-photo-1448721.jpeg" alt="Test" className='w-full h-[300px] object-cover rounded-t-xl' width={1000} height={1000} />
          <CardAction>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className='absolute top-3 right-3 cursor-pointer'>
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
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className='flex flex-col gap-1 mt-5'>
            <h1 className='text-2xl font-bold'>Abdelrhman</h1>
            <p className='text-lg text-muted-foreground'>@Abdelrhman</p>
            <p className='text-sm text-muted-foreground'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
        </CardContent>
      </Card>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-4 w-70'>
          <Card className='w-full border-0'>
            <CardHeader>
              <CardTitle  className='text-2xl font-bold' >About me</CardTitle>
                <p className='text-sm text-white'>Hi! My name is Abdelrhman! I have a Twitch channel where I stream, play and review all the newest games.</p>
              <div className='flex flex-row gap-8 mt-4'>
                  <span className='text-sm text-muted-foreground'>Location</span>
                  <span className='text-sm text-white'>
                  Kafr El Sheikh, El Hamoul</span>
              </div>
              <div className='flex flex-row gap-9'>
                  <span className='text-sm text-muted-foreground'>Country</span>
                  <span className='text-sm text-white'>Egypt</span>
              </div>
              <div className='flex flex-row gap-16'>
                  <span className='text-sm text-muted-foreground'>Age</span>
                  <span className='text-sm text-white'>
                  23</span>
              </div>
            </CardHeader>
          </Card>
          <h4 className='mt-10  mb-4 text-2xl font-bold'>Skills</h4>
          <div>
                <div className='flex flex-wrap gap-2'>
                  <span className='bg-card  px-3 py-1 rounded-full text-sm'>JavaScript</span>
                  <span className='bg-card  px-3 py-1 rounded-full text-sm'>React</span>
                  <span className='bg-card  px-3 py-1 rounded-full text-sm'>Node.js</span>
                  <span className='bg-card  px-3 py-1 rounded-full text-sm'>CSS</span>
                  <span className='bg-card  px-3 py-1 rounded-full text-sm'>Html</span>
                </div>
              </div>
        </div>
        <div className='col-span-8'>
          <Card className='w-full border-0'>
            <CardHeader>
              <CardTitle>Posts</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Page;
