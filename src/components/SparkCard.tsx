'use client'

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { rateSpark, fetchSparkRatings, Spark, forkSpark } from '@/store/slices/sparksSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { StarRating } from '@/components/ui/star-rating';
import { Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// SparkCard Skeleton Component
export function SparkCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card className={`shadow-none dark:border-transparent ${className}`}>
      <CardHeader className="flex-row items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent>
        <div className="mb-2 rounded-xl overflow-hidden border">
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="flex justify-between items-center mt-4 gap-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

interface SparkRatingProps {
  sparkId: string;
  sparkUserId: string;
}

function SparkRating({ sparkId, sparkUserId }: SparkRatingProps) {
  const dispatch = useDispatch<AppDispatch>();
  const ratings = useSelector((state: RootState) => state.sparks.ratings[sparkId]);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRating = ratings?.userRating || 0;
  const averageRating = ratings?.average;
  const ratingsCount = ratings?.ratings?.length || 0;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSparkRatings(sparkId));
  }, [dispatch, sparkId]);

  const handleRate = async (value: number) => {
    setSubmitting(true);
    try {
      await dispatch(rateSpark({ id: sparkId, value }));
      await dispatch(fetchSparkRatings(sparkId));
    } catch (error) {
      console.error('Failed to rate spark:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const canRate = !!user;

  return (
    <StarRating
      value={userRating}
      averageRating={averageRating}
      ratingsCount={ratingsCount}
      interactive={canRate}
      loading={submitting}
      disabled={!canRate}
      onRate={handleRate}
      showUserRating={!!(user && userRating > 0)}
      size="sm"
    />
  );
}

function SparkRatingSummary({ spark }: { spark: any }) {
  const averageRating = spark.averageRating || 0;
  const ratingsCount = spark.ratings?.length || 0;
  
  return (
    <StarRating
      averageRating={averageRating}
      ratingsCount={ratingsCount}
      interactive={false}
      size="sm"
    />
  );
}

interface SparkCardProps {
  spark: Spark;
  showRating?: boolean;
  showDate?: boolean;
  showOwnerActions?: boolean;
  className?: string;
}

export default function SparkCard({ 
  spark, 
  showRating = true, 
  showDate = true, 
  className = "" 
}: SparkCardProps) {
  
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [forking, setForking] = useState(false);

  const handleFork = async () => {
    setForking(true);
    try {
      const action = await dispatch(forkSpark(spark._id));
      if (forkSpark.fulfilled.match(action)) {
        toast.success('Forked successfully!');
        router.push(`/playground?spark=${action.payload._id}`);
      } else {
        toast.error('Failed to fork spark');
      }
    } catch (err) {
      toast.error('Failed to fork spark');
    } finally {
      setForking(false);
    }
  };

  return (
    <Card className={`shadow-none dark:border-transparent transition-shadow group ${className}`}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col flex-1 overflow-hidden">
          <CardTitle className="truncate text-lg">
            <Link href={`/sparks/${spark._id}`}>
              {spark.title || spark._id}
            </Link>
          </CardTitle>
        </div>
        {showDate && (
          <Badge className="bg-accent text-accent-foreground border-1 border-border">
            {new Date(spark.updatedAt).toLocaleDateString()}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-2 rounded-xl overflow-hidden border">
            <Image src={spark.previewImage || 'https://placehold.co/400x200?text=No+Preview'} className='h-40' alt={spark.title} width={500} height={500} />
        </div>
        <div className="flex justify-between items-center mt-4 gap-2">
          {showRating && <SparkRatingSummary spark={spark} />}
          <div className="flex gap-2">
            <Link href={`/sparks/${spark._id}`}>
              <Button size="icon" className='cursor-pointer'>
                <Eye />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleFork} disabled={forking} className="cursor-pointer">
              {forking ? 'Forking...' : 'Fork'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { SparkRating }; 