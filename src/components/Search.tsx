
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Filter, Calendar, User as UserIcon, Star, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState, AppDispatch } from '@/store/store';
import { searchAll, clearSearch, loadMoreSearch } from '@/store/slices/searchSlice';
import { PostType } from '@/types/post';
import { User } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PostsList, { PostSkeleton } from '@/components/post/PostsList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AdminBadge from '@/components/AdminBadge';
import Link from 'next/link';

interface SearchResultsProps {
  posts: PostType[];
  users: User[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

// Loading skeleton component
const SearchResultSkeleton = () => (
    <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="h-6 bg-muted rounded-lg w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
            <div className="h-6 bg-muted rounded-full w-16 ml-4"></div>
        </div>
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
            </div>
            <div className="flex items-center space-x-2">
                <div className="h-4 bg-muted rounded w-12"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
            </div>
        </div>
    </div>
);

// Search result card component
const SearchResultCard: React.FC<{ result: PostType; onResultClick: (id: string) => void }> = ({ result, onResultClick }) => (
    <div
        className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
        onClick={() => onResultClick(result._id)}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {result.text}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                    {result.code || result.image || result.video || ''}
                </p>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium ml-4 whitespace-nowrap">
                Post
            </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{result.createdBy?.username}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    </div>
);

const UserSearchResultCard: React.FC<{ user: User }> = ({ user }) => (
  <Card className="flex flex-col p-6 gap-3 h-full border dark:border-transparent shadow-none transition-all duration-200 group">
    <CardHeader className="flex flex-col items-center text-center p-0 mb-1">
      <Avatar className="h-20 w-20 mb-2 ring-2 ring-primary group-hover:ring-4 transition-all duration-200">
        <AvatarImage src={user.avatar} alt={user.username} />
        <AvatarFallback className="text-2xl">
          {user.firstName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors flex items-center gap-2 justify-center">
        {user.firstName} {user.lastName}
        {user.role === 'admin' && <AdminBadge role="admin" size="sm" />}
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground">@{user.username}</CardDescription>
    </CardHeader>
    {user.bio && <CardContent className="text-sm text-muted-foreground text-center p-0 mb-2 line-clamp-3">{user.bio}</CardContent>}
    <CardContent className="w-full mt-auto p-0">
      <Button asChild variant="outline" className="w-full">
        <Link href={`/profile/${user.username}`}>View Profile</Link>
      </Button>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted rounded-full p-6 mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground max-w-md">
            Try adjusting your search query or filters to find what you're looking for.
        </p>
    </div>
);

// Memoized component for search results to prevent full rerenders
const SearchResults = React.memo(function SearchResults({ 
  posts, 
  users, 
  loading, 
  error, 
  hasMore
}: SearchResultsProps) {
  return (
    <>
      {users?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {users.map(user => (
              <UserSearchResultCard key={user._id || user.username} user={user} />
            ))}
          </div>
        </div>
      )}
      
      {posts?.length > 0 && (
        <>
          <PostsList
            posts={posts}
            loading={loading && posts.length === 0}
            error={error}
            title="Posts"
          />
          {loading && posts.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="size-6 animate-spin" />
              </div>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="text-center pb-8 text-muted-foreground">
              <p>You've reached the end of the posts</p>
            </div>
          )}
        </>
      )}
      
      {!loading && !error && posts?.length === 0 && users?.length === 0 && <EmptyState />}
    </>
  );
});

export default function SearchPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, users, loading, error, hasMore, page, lastQuery } = useSelector((state: RootState) => state.search);
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const loadingRef = useRef(false);

  useEffect(() => {
      loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
      setInputValue(query);
      if (query.trim()) {
          dispatch(searchAll({ query }));
      } else {
          dispatch(clearSearch());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      setInputValue(e.target.value);
      if (e.target.value.trim() === '') {
          router.push('/search');
          dispatch(clearSearch());
      }
  }

  // Debounced search effect
  useEffect(() => {
      const trimmed = inputValue.trim();
      if (trimmed === query) return;
      if (!trimmed) return;
      const handler = setTimeout(() => {
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }, 400);
      return () => clearTimeout(handler);
  }, [inputValue, query, router]);

  // Infinite scroll for posts
  useEffect(() => {
      function handleScroll() {
          const scrollPosition = window.scrollY + window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          if (
              scrollPosition > documentHeight - 1000 &&
              hasMore &&
              !loadingRef.current &&
              posts.length > 0
          ) {
              dispatch(loadMoreSearch({ query: lastQuery || query, page, limit: 10 }));
          }
      }
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch, hasMore, posts.length, lastQuery, query, page]);


  return (
    <div className={'min-h-screen bg-background transition-colors duration-300'}>
      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-8">
        {/* Search Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts and users..."
                value={inputValue}
                onChange={handleInputChange}
                className="w-full h-12 pl-10 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                aria-label="Search input"
              />
            </div>
          </div>

          {/* Search Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>
                {loading ? 'Searching...' : `${(Array.isArray(posts) ? posts.length : 0) + (Array.isArray(users) ? users.length : 0)} results found`}
              </span>
            </div>
            {query && (
              <div className="flex items-center space-x-2">
                <span>for</span>
                <span className="font-medium text-foreground">"{query}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Search Results - Memoized component */}
        <SearchResults
          posts={posts}
          users={users}
          loading={loading}
          error={error}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}