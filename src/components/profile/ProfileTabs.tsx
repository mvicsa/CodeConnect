'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostsProfile from '@/components/post/PostsProfile';
import UserRatingsDetailed from './UserRatingsDetailed';

interface ProfileTabsProps {
  userId: string;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-2">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="ratings">Ratings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="posts" className="space-y-4">
        <PostsProfile userId={userId} />
      </TabsContent>
      
      <TabsContent value="ratings" className="space-y-4">
        <UserRatingsDetailed userId={userId} />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
