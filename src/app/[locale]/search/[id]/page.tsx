'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, User, Star, Clock, FileText, Tag } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { SearchAPI } from '@/services/searchAPI';
const LoadingState = () => (
    <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
                <div className="h-8 bg-muted rounded-lg w-32 mb-8"></div>
                <div className="h-10 bg-muted rounded-lg w-3/4 mb-4"></div>
                <div className="h-6 bg-muted rounded w-full mb-2"></div>
                <div className="h-6 bg-muted rounded w-2/3 mb-8"></div>
                <div className="flex items-center space-x-6 mb-8">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-18"></div>
                </div>
                <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
            </div>
        </div>
    </div>
);

// Not found component
const NotFoundState = () => (
    <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted rounded-full p-6 mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Content Not Found</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    The content you're looking for doesn't exist or has been moved.
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    </div>
);

export default function SearchDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const id = parseInt(params.id as string);

        // Simulate API call
        const timer = setTimeout(() => {
            const foundResult = SearchAPI.mockResults.find(r => r.id === id);
            setResult(foundResult || null);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [params.id]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (!result) {
        return <NotFoundState />;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to search</span>
                </button>

                {/* Article header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                            <Tag className="h-3 w-3 inline mr-1" />
                            {result.category}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                        {result.title}
                    </h1>

                    <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                        {result.description}
                    </p>

                    {/* Meta information */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{result.author}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(result.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-warning fill-current" />
                            <span className="font-medium">{result.rating}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{result.readTime}</span>
                        </div>
                    </div>
                </div>

                {/* Article content */}
                <div className="bg-card border border-border rounded-2xl p-8">
                    <div className="prose prose-gray max-w-none">
                        <p className="text-lg text-foreground leading-relaxed">
                            {result.content}
                        </p>

                        {/* Placeholder for additional content */}
                        <div className="mt-8 p-6 bg-muted/50 rounded-xl">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Want to read more?
                            </h3>
                            <p className="text-muted-foreground">
                                This is a preview of the full article. The complete content would be displayed here in a real application.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-center mt-8 space-x-4">
                    <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                        Save Article
                    </button>
                    <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
}