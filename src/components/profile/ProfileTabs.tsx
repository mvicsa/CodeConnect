'use client';

  import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfilePosts from '@/components/post/ProfilePosts';
import UserRatingsDetailed from './UserRatingsDetailed';
import { ratingService } from '@/services/ratingService';

interface ProfileTabsProps {
  userId: string;
  forceLoading?: boolean;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ userId, forceLoading = false }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [loadingRatingCount, setLoadingRatingCount] = useState(true);

  useEffect(() => {
    const fetchRatingCount = async () => {
      try {
        setLoadingRatingCount(true);
        const response = await ratingService.getUserReceivedRatings(userId, 1, 1);
        setRatingCount(response.pagination.total || 0);
      } catch {
        setRatingCount(0);
      } finally {
        setLoadingRatingCount(false);
      }
    };

    if (userId) {
      fetchRatingCount();
    }
  }, [userId]);

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Show skeleton tabs while loading rating count or forced loading */}
        {(loadingRatingCount || forceLoading) ? (
          <div className="grid w-full grid-cols-2 mb-2 gap-1 p-1 rounded-lg bg-card">
            <div className="h-7 w-full rounded-md bg-accent animate-pulse" />
            <div className="h-7 w-full rounded-md bg-accent animate-pulse" />
          </div>
        ) : (
          ratingCount > 0 && (
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="ratings" className="relative">
                Ratings
              </TabsTrigger>
            </TabsList>
          )
        )}
        
        <TabsContent value="posts" className="space-y-4">
          <ProfilePosts userId={userId} />
        </TabsContent>
        
        <TabsContent value="ratings" className="space-y-4">
          <UserRatingsDetailed userId={userId} />
        </TabsContent>
      </Tabs>
    </> 
  );
};

export default ProfileTabs;
