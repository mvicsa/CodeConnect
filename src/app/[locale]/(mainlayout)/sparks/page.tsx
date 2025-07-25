'use client'

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchAllSparks } from '@/store/slices/sparksSlice';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SparkCard, { SparkCardSkeleton } from '@/components/SparkCard';
import { useInfiniteScroll } from '@/components/ui/infinite-scroll';
import Container from '@/components/Container';

export default function SparksDashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    allSparks, 
    allSparksLoading, 
    allSparksHasMore, 
    allSparksPage 
  } = useSelector((state: RootState) => state.sparks);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchAllSparks({ page: 1, limit: 12 })).finally(() => {
      setInitialLoading(false);
    });
  }, [dispatch]);

  const handleLoadMore = () => {
    if (allSparksHasMore && !allSparksLoading) {
      dispatch(fetchAllSparks({ 
        page: allSparksPage + 1, 
        limit: 12, 
        loadMore: true 
      }));
    }
  };

  // Use infinite scroll hook
  useInfiniteScroll(allSparksHasMore, allSparksLoading, handleLoadMore);

  const isLoading = allSparksLoading || initialLoading;
  const isLoadingMore = allSparksLoading && !initialLoading;

  return (
    <Container>
      <div>
        <div className="flex items-center flex-wrap gap-2 justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Discover Sparks</h1>
            {allSparks.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {allSparks.length} sparks found
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/my-sparks">
              <Button variant="outline" className='cursor-pointer'>My Sparks</Button>
            </Link>
            <Link href="/playground">
              <Button variant="default">Create Spark</Button>
            </Link>
          </div>
        </div>
        
        {isLoading && allSparks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SparkCardSkeleton key={i} />
            ))}
          </div>
        ) : allSparks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No sparks found. Create the first one!
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allSparks.map((spark) => (
                <SparkCard key={spark._id} spark={spark} />
              ))}
            </div>
            
            {/* Loading More Skeletons */}
            {isLoadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SparkCardSkeleton key={`loading-${i}`} />
                ))}
              </div>
            )}
            
            {/* End of results indicator */}
            {!allSparksHasMore && allSparks.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">🎉 You&apos;ve seen all sparks!</p>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
} 