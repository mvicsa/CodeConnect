import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, FileText, Star, Clock, ChevronDown, Moon, Sun } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { SearchAPI } from '@/services/searchAPI';

interface SearchResultCardProps {
    result: SearchResult;
    onResultClick: (id: number) => void;
}

const categories = ['All', 'Tutorial', 'Article', 'Guide', 'News'];

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
const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onResultClick }) => (
    <div
        className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
        onClick={() => onResultClick(result.id)}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {result.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                    {result.description}
                </p>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium ml-4 whitespace-nowrap">
                {result.category}
            </span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{result.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(result.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-warning fill-current" />
                    <span className="font-medium">{result.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{result.readTime}</span>
                </div>
            </div>
        </div>
    </div>
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

// Main Search Page Component
interface SearchPageProps {
    onResultClick: (id: number) => void;
}

export default function SearchPage({ onResultClick }: SearchPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [filteredResults, setFilteredResults] = useState(SearchAPI.mockResults);
    const [isLoading, setIsLoading] = useState(false);
    // Filter results based on search query and category
    useEffect(() => {
        setIsLoading(true);

        // Simulate API call delay
        const timer = setTimeout(() => {
            let results = SearchAPI.mockResults;

            // Filter by category
            if (selectedCategory !== 'All') {
                results = results.filter(result => result.category === selectedCategory);
            }

            // Filter by search query
            if (searchQuery.trim()) {
                results = results.filter(result =>
                    result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    result.author.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            setFilteredResults(results);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory]);


    return (
        <div className={'min-h-screen bg-background transition-colors duration-300'}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Controls */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search articles, tutorials, and guides..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                aria-label="Search input"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none bg-card border border-border rounded-2xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground min-w-[140px]"
                                aria-label="Filter by category"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Search Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4" />
                            <span>
                                {isLoading ? 'Searching...' : `${filteredResults.length} results found`}
                            </span>
                        </div>
                        {searchQuery && (
                            <div className="flex items-center space-x-2">
                                <span>for</span>
                                <span className="font-medium text-foreground">"{searchQuery}"</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                <div className="space-y-6">
                    {isLoading ? (
                        // Loading skeletons
                        Array.from({ length: 3 }).map((_, index) => (
                            <SearchResultSkeleton key={index} />
                        ))
                    ) : filteredResults.length > 0 ? (
                        // Search results
                        <div className="grid gap-6">
                            {filteredResults.map(result => (
                                <SearchResultCard
                                    key={result.id}
                                    result={result}
                                    onResultClick={onResultClick}
                                />
                            ))}
                        </div>
                    ) : (
                        // Empty state
                        <EmptyState />
                    )}
                </div>

                {/* Load More Button */}
                {!isLoading && filteredResults.length > 0 && (
                    <div className="flex justify-center mt-12">
                        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                            Load More Results
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}