'use client'

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchSparksByUser } from '@/store/slices/sparksSlice';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SparkCard, { SparkCardSkeleton } from '@/components/SparkCard';
import Container from '@/components/Container';

export default function MySparksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const userId = (useSelector((state: RootState) => state.auth.user?._id) || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)) as string | null;
  const { 
    sparks, 
    userSparksLoading, 
    userSparksHasMore, 
    userSparksPage 
  } = useSelector((state: RootState) => state.sparks);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (userId && typeof userId === 'string') {
      dispatch(fetchSparksByUser({ userId, page: 1, limit: 12 })).finally(() => {
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  }, [dispatch, userId]);

  const handleLoadMore = () => {
    if (userId && userSparksHasMore && !userSparksLoading) {
      dispatch(fetchSparksByUser({ 
        userId, 
        page: userSparksPage + 1, 
        limit: 12, 
        loadMore: true 
      }));
    }
  };

  const isLoading = userSparksLoading || initialLoading;
  const isLoadingMore = userSparksLoading && !initialLoading;

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Sparks</h1>
          {sparks.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {sparks.length} sparks created
            </p>
          )}
        </div>
        <Link href="/playground">
          <Button variant="default">Create Spark</Button>
        </Link>
      </div>
      
      {isLoading && sparks.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SparkCardSkeleton key={i} />
          ))}
        </div>
      ) : sparks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sparks found. Create your first one!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sparks.map((spark) => (
              <SparkCard 
                key={spark._id} 
                spark={spark} 
                showOwnerActions={true}
              />
            ))}
          </div>
          
          {/* Load More Section */}
          {userSparksHasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
              >
                {isLoadingMore ? 'Loading...' : 'Load More Sparks'}
              </Button>
            </div>
          )}
          
          {/* Loading More Skeletons */}
          {isLoadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SparkCardSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
} 