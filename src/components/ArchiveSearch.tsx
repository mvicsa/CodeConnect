'use client';

import { useEffect } from 'react';
import { useArchive } from '@/hooks/useArchive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, Calendar, User, Tag, Eye } from 'lucide-react';
import Link from 'next/link';
import CodeBlock from '@/components/code/CodeBlock';
import MarkdownWithCode from '@/components/MarkdownWithCode';
import Container from './Container';
import { formatDate } from 'date-fns';

export default function ArchiveSearch() {
  const {
    filteredItems,
    loading,
    error,
    searchQuery,
    filters,
    allTags,
    loadArchiveItems,
    search,
    filterByTags,
    clearAllFilters,
    clearSearchQuery,
  } = useArchive();

  // Load archive items on component mount
  useEffect(() => {
    loadArchiveItems();
  }, [loadArchiveItems]);

  // Show skeleton if loading or if no items are loaded yet
  const showSkeleton = loading && !error;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };

  const handleTagFilter = (tag: string) => {
    const currentTags = filters.tags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    filterByTags(newTags);
  };

  if (error) {
    return (
        <Container>
            <div className="space-y-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                        <p className="text-red-600 mb-4">Error loading archive items: {error}</p>
                        <Button onClick={() => loadArchiveItems()} variant="outline">
                            Try Again
                        </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
  }

  return (
    <Container>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Archive</h1>
                        <p className="text-muted-foreground">
                            Search through archived posts with AI comments
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <X className="h-4 w-4" />
                    Clear Filters
                </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-none dark:border-transparent gap-4">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search & Filters
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                    placeholder="Search by name, problem, description, solution, or tags..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-10"
                    />
                    {searchQuery && (
                    <Button
                        onClick={clearSearchQuery}
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    )}
                </div>

                {/* Active Filters Summary */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Active Filters</label>
                    <div className="text-sm text-muted-foreground">
                    {filters.tags.length > 0 && <div>Tags: {filters.tags.join(', ')}</div>}
                    {filters.tags.length === 0 && (
                        <div>No filters applied</div>
                    )}
                    </div>
                </div>

                {/* Tags Filter */}
                {allTags.length > 0 && (
                    <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                        <Badge
                            key={tag}
                            variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => handleTagFilter(tag)}
                        >
                            {tag}
                        </Badge>
                        ))}
                    </div>
                    </div>
                )}
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                Showing {filteredItems.length} of {filteredItems.length} archive items
                </p>
                {showSkeleton && (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
                )}
            </div>

            {/* Archive Items */}
            <div className="grid gap-4">
                {showSkeleton ? (
                // Loading skeletons
                Array.from({ length: 1 }).map((_, index) => (
                    <Card key={index} className="shadow-none dark:border-transparent">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                        {/* Header skeleton */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <div className="flex items-center gap-2">
                                <Skeleton className="h-3 w-3" />
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-3" />
                                <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                        
                        {/* Content skeleton */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        
                        {/* Code block skeleton */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <div className="bg-muted/50 p-4 rounded-lg">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/5" />
                            </div>
                        </div>
                        
                        {/* Tags skeleton */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                            </div>
                            <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                            </div>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                ))
                ) : filteredItems.length === 0 && !showSkeleton ? (
                <Card>
                    <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No archive items found</h3>
                        <p className="text-muted-foreground mb-4">
                        Try adjusting your search terms or filters
                        </p>
                        <Button onClick={clearAllFilters} variant="outline">
                        Clear All Filters
                        </Button>
                    </div>
                    </CardContent>
                </Card>
                ) : (
                            // Archive items
                filteredItems.map((item) => (
                    <Card key={item._id} className="shadow-none dark:border-transparent">
                    <CardContent>
                        <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={item.createdBy?.avatar} alt={item.createdBy?.firstName} />
                                    <AvatarFallback>
                                        {item.createdBy?.firstName ? item.createdBy.firstName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Link href={`/archive/${item._id}`} className="hover:underline">
                                        <h3 className="font-semibold mb-1">
                                            {item.text || 'No title'}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        <Link href={`/profile/${item.createdBy?.username}`} className="hover:underline">
                                            <span>
                                                {item.createdBy?.firstName} {item.createdBy?.lastName}
                                            </span>
                                        </Link>
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(item.createdAt, 'MMM d, yyyy hh:mm a')}</span>
                                    </div>
                                </div>
                            </div>
                            <Link href={`/archive/${item._id}`}>
                            <Button variant="outline" size="sm" className="hidden sm:flex">
                                <Eye className="h-3 w-3" />
                                <span>View Details</span>
                            </Button>
                            </Link>
                        </div>

                        {/* Post Content */}
                        {item.text && (
                            <div>
                            <h4 className="font-medium mb-2">Content</h4>
                            <MarkdownWithCode 
                                content={item.text} 
                                maxLength={200}
                                className="text-sm text-muted-foreground"
                            />
                            </div>
                        )}

                        {/* Code */}
                        {item.code && (
                            <div>
                            <h4 className="font-medium mb-2">Code</h4>
                            <CodeBlock 
                                code={item.code} 
                                language={item.codeLang || 'javascript'}
                                showCopyButton={true}
                                maxHeight="200px"
                                showExpandButton={true}
                            />
                            </div>
                        )}

                        {/* AI Comments Count */}
                        {item.comments && item.comments.length > 0 && (
                            <div>
                            <h4 className="font-medium mb-2">AI Evaluations</h4>
                            <p className="text-sm text-muted-foreground">
                                {item.comments.filter(comment => comment.hasAiEvaluation).length} AI evaluations available
                            </p>
                            </div>
                        )}

                        {/* Tags and Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                            {item.tags && item.tags.length > 0 && (
                                <>
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                    {item.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                                    ))}
                                </div>
                                </>
                            )}
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
                        </div>
                    </CardContent>
                    </Card>
                ))
                )}
            </div>
        </div>
    </Container>
  );
} 