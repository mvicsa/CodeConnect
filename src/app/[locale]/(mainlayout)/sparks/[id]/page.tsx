'use client'

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchSparkById, setCurrentSpark, forkSpark } from '@/store/slices/sparksSlice';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SandpackProvider, SandpackPreview, SandpackCodeEditor, SandpackLayout } from '@codesandbox/sandpack-react';
import { StarRating, StarRatingDisplay } from '@/components/ui/star-rating';
import Container from '@/components/Container';
import { Skeleton } from '@/components/ui/skeleton';
import { SparkRating } from '@/components/SparkCard';
import { toast } from 'sonner';

function SparkPageSkeleton() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="mt-6 flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

export default function SparkPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { currentSpark, loading, ratings } = useSelector((state: RootState) => state.sparks);
  const user = useSelector((state: RootState) => state.auth.user);
  const [sparkNotFound, setSparkNotFound] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [forking, setForking] = useState(false);

  const sparkId = params.id as string;

  useEffect(() => {
    if (sparkId) {
      dispatch(fetchSparkById(sparkId)).then((action: any) => {
        if (action.payload && action.payload.files) {
          dispatch(setCurrentSpark(action.payload));
          setSparkNotFound(false);
        } else {
          setSparkNotFound(true);
        }
        setInitialLoading(false);
      }).catch(() => {
        setSparkNotFound(true);
        setInitialLoading(false);
      });
    }
  }, [dispatch, sparkId]);

  const isLoading = loading || initialLoading;

  const handleFork = async () => {
    setForking(true);
    try {
      const action = await dispatch(forkSpark(sparkId));
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

  if (isLoading) {
    return <SparkPageSkeleton />;
  }

  if (sparkNotFound || !currentSpark) {
    return (
      <Container>
        <Card className="w-full mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Spark Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The spark you're looking for doesn't exist or has been deleted.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/sparks')}>
                Discover Sparks
              </Button>
              <Button variant="outline" onClick={() => router.push('/playground')} className='cursor-pointer'>
                Create New Spark
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Spark Details</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/sparks">Back to Sparks</Link>
            </Button>
          </div>
        </div>

        {/* Spark Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <CardTitle className="text-2xl mb-2">
                  {currentSpark.title || 'Untitled Spark'}
                </CardTitle>
                <div className='flex flex-wrap gap-2'>
                  {currentSpark.owner && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>Created by</span>
                      <Link 
                        href={`/profile/${currentSpark.owner.username}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {currentSpark.owner.username}
                      </Link>
                      <span>•</span>
                      <span>{new Date(currentSpark.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {currentSpark.forkedFrom && (
                    <>
                      <span className='text-muted-foreground'>-</span>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <span>Forked from</span>
                        <Link href={`/sparks/${currentSpark.forkedFrom._id}`} className="text-primary hover:underline font-medium">
                          {currentSpark.forkedFrom.owner?.username}&apos;s Spark
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {sparkId && ratings && ratings[sparkId] && (
                  <StarRatingDisplay
                    averageRating={ratings[sparkId].average || 0}
                    ratingsCount={ratings[sparkId].ratings?.length || 0}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sandpack Code Editor and Preview */}
            <div className="mb-6">
              <SandpackProvider 
                files={currentSpark.files} 
                template="react"
                theme="auto"
              >
                <SandpackLayout>
                  <SandpackCodeEditor 
                    showTabs 
                    showLineNumbers 
                    wrapContent 
                    closableTabs
                    style={{ height: '400px' }}
                  />
                  <SandpackPreview 
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                    style={{ height: '400px' }}
                  />
                </SandpackLayout>
              </SandpackProvider>
            </div>

            {/* Rating Section */}
            <div className="flex justify-between items-center pt-4 border-t">
              {
                currentSpark.owner?._id !== user?._id && (
                  <SparkRating 
                    sparkId={sparkId} 
                    sparkUserId={currentSpark.owner?._id || currentSpark.userId || ''} 
                  />
                )
              }
              
              <div className="flex gap-2 ms-auto">
                {currentSpark.owner?._id === user?._id && (
                <Button variant="outline" asChild>
                  <Link href={`/playground?spark=${sparkId}`}>
                    Edit Spark
                  </Link>
                </Button>
                )}
                <Button onClick={handleFork} disabled={forking}>
                  {forking ? 'Forking...' : 'Fork Spark'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
} 