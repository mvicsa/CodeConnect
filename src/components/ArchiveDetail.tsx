'use client';

import { useEffect, useState } from 'react';
import { useArchive } from '@/hooks/useArchive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import CodeBlock from '@/components/code/CodeBlock';
import MarkdownWithCode from '@/components/MarkdownWithCode';
import Container from './Container';
import ArchiveSkeleton from './ArchiveSkeleton';
import { formatDate } from 'date-fns';

interface ArchiveDetailProps {
  id: string;
}

export default function ArchiveDetail({ id }: ArchiveDetailProps) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [archiveNotFound, setArchiveNotFound] = useState(false);
  
  const {
    items,
    loading,
    error,
    loadArchiveItems,
  } = useArchive();

  // Find the item in the store or fetch it if not available
  const item = items.find(item => item._id === id);

  useEffect(() => {
    if (id) {
      // If we have items in the store, check if the item exists
      if (items.length > 0) {
        const foundItem = items.find(item => item._id === id);
        if (foundItem) {
          setArchiveNotFound(false);
        } else {
          setArchiveNotFound(true);
        }
        setInitialLoading(false);
        return;
      }
      
      // If no items in store, load all items
      loadArchiveItems();
      // The loading state will be handled by the Redux store
      // We'll check for the item in the next render cycle
    }
  }, [id, items, loadArchiveItems]);

  // Handle loading state changes
  useEffect(() => {
    if (!loading && items.length > 0) {
      const foundItem = items.find(item => item._id === id);
      if (foundItem) {
        setArchiveNotFound(false);
      } else {
        setArchiveNotFound(true);
      }
      setInitialLoading(false);
    }
  }, [loading, items, id]);

  const isLoading = loading || initialLoading;

  // Show skeleton while loading
  if (isLoading) {
    return (
        <Container>
            <ArchiveSkeleton count={1} showHeader={true} />
        </Container>
    );
  }

  // Show error if there's an error
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading archive item: {error}</p>
              <Link href="/archive">
                <Button variant="outline">Back to Archive</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show "not found" only after initial loading is complete and item is not found
  if (!initialLoading && archiveNotFound) {
    return (
        <Container>
            <div className="space-y-6">
            <Card>
            <CardContent className="pt-6">
                <div className="text-center">
                <p className="text-muted-foreground mb-4">Archive item not found</p>
                <Link href="/archive">
                    <Button variant="outline">Back to Archive</Button>
                </Link>
                </div>
            </CardContent>
            </Card>
            </div>    
        </Container>
    );
  }

  // If we don't have an item yet, show skeleton
  if (!item) {
    return (
        <Container>
            <ArchiveSkeleton count={1} showHeader={true} />
        </Container>
    );
  }

  return (
    <Container>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex gap-4">
              <Link href="/archive">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Archive Item</h1>
                <p className="text-muted-foreground">Detailed view of archived content</p>
              </div>
            </div>

            {/* Main Content */}
            <Card className="shadow-none dark:border-transparent">
                <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex gap-3">
                    <Avatar className="h-13 w-13">
                        <AvatarImage src={item.createdBy?.avatar} alt={item.createdBy?.firstName} />
                        <AvatarFallback>
                        {item.createdBy?.firstName ? item.createdBy.firstName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl">{item.text || 'No title'}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.createdAt, 'MMM d, yyyy hh:mm a')}</span>
                        </div>
                    </div>
                    </div>
                    <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                        {item.codeLang}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {item.comments?.length || 0} comments
                    </Badge>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Post Content */}
                {item.text && (
                    <div>
                    <h3 className="text-lg font-semibold mb-3">Content</h3>
                    <MarkdownWithCode 
                        content={item.text} 
                        maxLength={500}
                        className="text-muted-foreground leading-relaxed"
                    />
                    </div>
                )}

                {/* Code */}
                {item.code && (
                    <div>
                    <h3 className="text-lg font-semibold mb-3">Code</h3>
                    <CodeBlock 
                        code={item.code} 
                        language={item.codeLang || 'javascript'}
                        showCopyButton={true}
                        maxHeight="400px"
                        showExpandButton={true}
                    />
                    </div>
                )}

                {/* Comments with AI Evaluations */}
                {item.comments && item.comments.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Comments & AI Evaluations</h3>
                        <div className="space-y-4">
                            {item.comments.map((comment) => (
                            <Card key={comment._id} className="bg-background/50 shadow-none dark:border-transparent">
                                <CardContent>
                                <div className="flex items-center gap-2 mb-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={comment.createdBy?.avatar} alt={comment.createdBy?.firstName} />
                                    <AvatarFallback>
                                        {comment.createdBy?.firstName ? comment.createdBy.firstName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <Link href={`/profile/${comment.createdBy?.username}`} className="hover:underline">
                                      <span className="font-medium">
                                        {comment.createdBy?.firstName} {comment.createdBy?.lastName}
                                      </span>
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {formatDate(comment.createdAt, 'MMM d, yyyy hh:mm a')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {comment.text && (
                                  <p className="text-muted-foreground mb-3">{comment.text}</p>
                                )}
                                {comment.code && (
                                  <div className="mb-3">
                                    <h4 className="font-medium mb-2">Code</h4>
                                    <CodeBlock 
                                        code={comment.code} 
                                        language={comment.codeLang || 'javascript'}
                                        showCopyButton={true}
                                        maxHeight="200px"
                                        showExpandButton={true}
                                    />
                                  </div>
                                )}
                                {comment.aiComment && (
                                  <div className="border-l-4 border-primary pl-4 bg-primary/5 p-3 rounded-lg">
                                    <h4 className="font-medium mb-2 text-primary">AI Evaluation</h4>
                                    <p className="text-sm text-muted-foreground">{comment.aiComment.evaluation}</p>
                                  </div>
                                )}
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                            Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                            <Badge key={tag} className="bg-background/50">
                            {tag}
                            </Badge>
                            ))}
                        </div>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    </Container>
  );
} 