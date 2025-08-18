"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Search, Filter, Calendar, User, MessageSquare, ArrowLeft } from "lucide-react";
import { ratingService } from "@/services/ratingService";
import { RatingResponseDto } from "@/types/rating";
import { toast } from "sonner";
import Link from "next/link";
import Container from "@/components/Container";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { formatDate } from "date-fns";

export default function RatingsPage() {
  const t = useTranslations("ratings");
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<"received" | "submitted">("received");
  const [ratings, setRatings] = useState<RatingResponseDto[]>([]);
  const [receivedRatings, setReceivedRatings] = useState<RatingResponseDto[]>([]);
  const [totalRatings, setTotalRatings] = useState(0);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingsPerPage] = useState(5);

  const fetchReceivedRatingsForStats = async () => {
    try {
      const response = await ratingService.getMyReceivedRatings(1, 100); // Get more ratings for accurate stats
      setReceivedRatings(response.ratings || []);
      setTotalRatings(response.pagination.total || 0);
    } catch (error) {
      console.error("Failed to fetch received ratings for stats:", error);
    }
  };

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      
      let response;
      
      // Build query parameters for backend filtering
      const queryParams = {
        search: debouncedSearchQuery.trim() || undefined,
        rating: filterRating !== "all" ? filterRating : undefined,
        sortBy: sortBy
      };
      
      // Use appropriate endpoint based on active tab
      if (activeTab === "submitted") {
        if (!currentUser?._id) {
          setRatings([]);
          setTotalPages(1);
          return;
        }
        response = await ratingService.getMySubmittedRatings(currentPage, ratingsPerPage, queryParams);
      } else {
        // "received" tab - fetch ratings for your sessions
        if (!currentUser?._id) {
          setRatings([]);
          setTotalPages(1);
          return;
        }
        response = await ratingService.getMyReceivedRatings(currentPage, ratingsPerPage, queryParams);
      }
      
      setRatings(response.ratings || []);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
      toast.error("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, currentUser?._id, debouncedSearchQuery, filterRating, sortBy, ratingsPerPage]);

  // Fetch received ratings for stats (always the same data) - do this first
  useEffect(() => {
    if (currentUser?._id) {
      fetchReceivedRatingsForStats();
    }
  }, [currentUser?._id]);

  // Fetch ratings for the active tab
  useEffect(() => {
    if (currentUser?._id) {
      fetchRatings();
    }
  }, [fetchRatings]);



  // Reset to first page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Reset to first page when changing filters or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRating, sortBy]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filterRating, sortBy]);



  const renderStarRating = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <Star key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
        );
      } else if (i - 0.5 <= rating) {
        stars.push(
          <div key={i} className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <Star className={`${starSize} fill-yellow-400 text-yellow-400 absolute inset-0 overflow-hidden`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className={`${starSize} text-gray-300`} />
        );
      }
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className={`ml-1 text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 2.5) return "text-orange-600";
    return "text-red-600";
  };



  return (
    <div className="bg-background">
      <Container>
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 sm:gap-3">
          <Link href="/meeting">
              <Button variant="ghost" size="icon" className="p-2 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* My Stats Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                   <Star className="h-5 w-5 text-yellow-500" />
                   <span>My Session Ratings</span>
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground">Average Rating</span>
                   <div className="font-semibold text-lg">
                     {receivedRatings.length > 0 
                       ? renderStarRating(receivedRatings.reduce((sum, rating) => sum + rating.overallRating, 0) / receivedRatings.length, 'md')
                       : "N/A"}
                   </div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-primary">
                     {totalRatings}
                   </div>
                   <div className="text-sm text-muted-foreground">Total Ratings</div>
                 </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Session Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {String(currentUser?.firstName || '')} {String(currentUser?.lastName || '')}
                  </div>
                </div>
                  <div className="text-center">
                   <div className="text-sm text-muted-foreground">
                     Ratings for your sessions
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "received" | "submitted")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">

            <TabsTrigger value="received" disabled={!currentUser?._id}>Received Ratings</TabsTrigger>
            <TabsTrigger value="submitted" disabled={!currentUser?._id}>Submitted Ratings</TabsTrigger>
          </TabsList>
        </Tabs>

                 

         {/* Filters and Search */}
         <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filterAll")}</SelectItem>
                <SelectItem value="5">{t("filter5Stars")}</SelectItem>
                <SelectItem value="4">{t("filter4Stars")}</SelectItem>
                <SelectItem value="3">{t("filter3Stars")}</SelectItem>
                <SelectItem value="2">{t("filter2Stars")}</SelectItem>
                <SelectItem value="1">{t("filter1Stars")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
                <SelectItem value="highest">{t("sortHighest")}</SelectItem>
                <SelectItem value="lowest">{t("sortLowest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
           {/* Ratings List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          ) : ratings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t("noRatings")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {ratings.map((rating) => (
                <Card key={rating._id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {rating.roomName || "Session"}
                          </h3>
                          <Badge variant="outline" className={getRatingColor(rating.overallRating)}>
                            {rating.overallRating} Star{rating.overallRating !== 1 ? 's' : ''}
                          </Badge>
                          {rating.isAnonymous && (
                            <Badge variant="secondary">Anonymous</Badge>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(rating.createdAt, "MMM d, yyyy hh:mm a")}
                          </span>
                          {rating.raterUsername && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {rating.isAnonymous ? 'Anonymous User' : <Link href={`/profile/${rating.raterUsername}`} className="hover:underline">{rating.raterFirstName} {rating.raterLastName}</Link>}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        {renderStarRating(rating.overallRating, 'md')}
                      </div>
                    </div>

                    {/* Rating Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Technical</div>
                        <div className="flex items-center justify-center gap-1 font-semibold">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{rating.technicalKnowledge}</span>
                        </div>
                      </div>
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Communication</div>
                        <div className="flex items-center justify-center gap-1 font-semibold">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{rating.communication}</span>
                        </div>
                      </div>
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Organization</div>
                        <div className="flex items-center justify-center gap-1 font-semibold">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{rating.organization}</span>
                        </div>
                      </div>
                      <div className="text-center p-3 bg-accent rounded-lg">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">Helpfulness</div>
                        <div className="flex items-center justify-center gap-1 font-semibold">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{rating.helpfulness}</span>
                        </div>
                      </div>
                    </div>

                    {/* Comment */}
                    {rating.comment && (
                      <div className="bg-accent/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Comment</span>
                        </div>
                        <p className="text-sm">{rating.comment}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end mt-4">
                      <Link href={`/ratings/${rating._id}`}>
                        <Button variant="outline" size="sm">
                          {t("viewDetails")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

                             {/* Pagination */}
               {totalPages > 1 && (
                 <div className="flex justify-center mt-6">
                   <div className="flex gap-2">
                     {/* Previous Button */}
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                     >
                       {t("previous")}
                     </Button>
                     
                     {/* Page Numbers */}
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                       // Show first page, last page, current page, and pages around current page
                       const shouldShow = 
                         pageNum === 1 || 
                         pageNum === totalPages || 
                         Math.abs(pageNum - currentPage) <= 1;
                       
                       if (!shouldShow) {
                         // Show ellipsis for skipped pages
                         if (pageNum === 2 && currentPage > 3) {
                           return <span key={`ellipsis-${pageNum}`} className="px-3 py-2 text-sm">...</span>;
                         }
                         if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                           return <span key={`ellipsis-${pageNum}`} className="px-3 py-2 text-sm">...</span>;
                         }
                         return null;
                       }
                       
                       return (
                         <Button
                           key={pageNum}
                           variant={pageNum === currentPage ? "default" : "outline"}
                           size="sm"
                           onClick={() => setCurrentPage(pageNum)}
                           className={pageNum === currentPage ? "bg-primary text-primary-foreground" : ""}
                         >
                           {pageNum}
                         </Button>
                       );
                     })}
                     
                     {/* Next Button */}
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                       disabled={currentPage === totalPages}
                     >
                       {t("next")}
                     </Button>
                   </div>
                 </div>
               )}
              
              
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
