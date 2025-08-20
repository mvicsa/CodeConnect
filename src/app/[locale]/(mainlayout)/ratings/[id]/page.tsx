"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, ArrowLeft, Calendar, User, MessageSquare, Eye } from "lucide-react";
import { ratingService } from "@/services/ratingService";
import { RatingResponseDto } from "@/types/rating";
import { toast } from "sonner";
import Link from "next/link";
import Container from "@/components/Container";
import axiosInstance from "@/lib/axios";

export default function RatingDetailPage() {
  const params = useParams();
  const ratingId = params.id as string;
  const t = useTranslations("ratings");
  
  const [rating, setRating] = useState<RatingResponseDto | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ 
    name: string; 
    description: string;
    creator?: {
      firstName: string;
      lastName: string;
      username?: string;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRatingDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Since we don't have a getRatingById method yet, we'll need to implement it
      // For now, this is a placeholder - you'll need to add this method to your ratingService
      const ratingData = await ratingService.getRatingById(ratingId);
      setRating(ratingData);
      
      // Set session info from rating data if available
      if (ratingData) {
        setSessionInfo({
          name: ratingData.roomName || 'Unknown Session',
          description: ratingData.roomDescription || 'No description available',
          creator: ratingData.creatorFirstName || ratingData.creatorLastName ? {
            firstName: ratingData.creatorFirstName || '',
            lastName: ratingData.creatorLastName || '',
            username: ratingData.creatorUsername
          } : null
        });
        
        // If we don't have complete session info, try to fetch it
        if (!ratingData.roomName || !ratingData.roomDescription) {
          await fetchSessionInfo(ratingData.sessionId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rating details:", error);
      setError("Failed to load rating details");
      toast.error("Failed to load rating details");
    } finally {
      setLoading(false);
    }
  }, [ratingId]);

  useEffect(() => {
    if (ratingId) {
      fetchRatingDetails();
    }
  }, [ratingId, fetchRatingDetails]);

  const fetchSessionInfo = async (sessionId: string) => {
    try {
      // Try to fetch from session history first
      const response = await axiosInstance.get(`/livekit/sessions/history/${sessionId}`);
      if (response.data) {
        setSessionInfo({
          name: response.data.roomName || 'Unknown Session',
          description: response.data.roomDescription || 'No description available',
          creator: response.data.createdBy ? {
            firstName: response.data.createdBy.firstName || '',
            lastName: response.data.createdBy.lastName || '',
            username: response.data.createdBy.username
          } : null
        });
        return;
      }
    } catch {
      console.log("Session not found in history, trying other endpoints...");
    }

    try {
      // Try to fetch from rooms
      const response = await axiosInstance.get(`/livekit/rooms/${sessionId}`);
      if (response.data) {
        setSessionInfo({
          name: response.data.name || 'Unknown Session',
          description: response.data.description || 'No description available',
          creator: response.data.createdBy ? {
            firstName: response.data.createdBy.firstName || '',
            lastName: response.data.createdBy.lastName || '',
            username: response.data.createdBy.username
          } : null
        });
        return;
      }
    } catch {
      console.log("Session not found in rooms...");
    }

    // If all else fails, set default values
    setSessionInfo({
      name: `Session ${sessionId.slice(-6)}`,
      description: 'Session details not available',
      creator: null
    });
  };

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6';
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
      <div className="flex items-center justify-center gap-1">
        {stars}
        <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'} text-muted-foreground`}>
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

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 3.5) return "Good";
    if (rating >= 2.5) return "Average";
    if (rating >= 1.5) return "Below Average";
    return "Poor";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-6">
        <Container>
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !rating) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-6">
        <Container>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">{t("ratingNotFound")}</h1>
            <p className="text-muted-foreground mb-6">
              {error || t("ratingNotFoundDesc")}
            </p>
            <div className="space-x-4">
              <Link href="/ratings">
                <Button variant="outline">{t("backToRatings")}</Button>
              </Link>
              <Link href="/">
                <Button>{t("goHome")}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Container>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-between gap-3 mb-4">
            <div className="flex gap-3">
              <Link href="/ratings">
                <Button variant="ghost" size="icon" className="p-2 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                  {/* Session Name */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-2"> Session Name: {sessionInfo?.name || rating.sessionId}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t("detailedView")}
                </p>
              </div>
            </div>
            <div>
              <Link href={`/meeting/${rating.sessionId}`}>
                <Button variant="outline">
                  <Eye className="h-4 w-4" />
                  View Session
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Rating Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                   <span>{t("ratingDetails")}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRatingColor(rating.overallRating)}>
                      {rating.overallRating} Star{rating.overallRating !== 1 ? 's' : ''}
                    </Badge>
                    {rating.isAnonymous && (
                      <Badge variant="secondary">Anonymous</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Rating Display */}
                <div className="text-center p-6 bg-accent rounded-lg">
                  <div className="mb-4">
                    {renderStarRating(rating.overallRating, 'lg')}
                  </div>
                  <div className={`text-2xl font-bold ${getRatingColor(rating.overallRating)}`}>
                    {getRatingLabel(rating.overallRating)}
                  </div>
                    <p className="text-sm text-muted-foreground mt-2">
                    {t("overallRating")} for this session
                   </p>
                </div>

                {/* Rating Categories Grid */}
                <div>
                   <h3 className="text-lg font-semibold mb-4">{t("ratingCategories")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">
                        {t("technicalKnowledge")}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-2xl font-semibold">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span>{rating.technicalKnowledge}</span>
                      </div>
                    </div>
                     <div className="text-center p-4 bg-accent rounded-lg">
                       <div className="text-sm text-muted-foreground mb-2">{t("communication")}</div>
                       <div className="flex items-center justify-center gap-1 text-2xl font-semibold">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span>{rating.communication}</span>
                      </div>
                     </div>
                     <div className="text-center p-4 bg-accent rounded-lg">
                       <div className="text-sm text-muted-foreground mb-2">{t("organization")}</div>
                       <div className="flex items-center justify-center gap-1 text-2xl font-semibold">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span>{rating.organization}</span>
                      </div>
                     </div>
                     <div className="text-center p-4 bg-accent rounded-lg">
                       <div className="text-sm text-muted-foreground mb-2">{t("helpfulness")}</div>
                       <div className="flex items-center justify-center gap-1 text-2xl font-semibold">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span>{rating.helpfulness}</span>
                      </div>
                     </div>
                  </div>
                </div>

                {/* Comment Section */}
                {rating.comment && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                     <MessageSquare className="h-5 w-5" />
                     {t("comment")}
                   </h3>
                    <div className="bg-accent p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">{rating.comment}</p>
                    </div>
                  </div>
                )}

                {/* Session Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t("sessionInformation")}</h3>
                  
                  {/* Session Name and Description */}
                  {sessionInfo && (
                    <div className="mb-3 space-y-3">
                      <div className="p-3 bg-accent rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Session Name</div>
                        <div className="font-medium text-lg">{sessionInfo.name}</div>
                      </div>
                      {sessionInfo.description && (
                        <div className="p-3 bg-accent rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Session Description</div>
                          <div className="font-medium">{sessionInfo.description}</div>
                        </div>
                      )}
                      {/* Show Session Creator if available */}
                      {(sessionInfo.creator || (rating.creatorFirstName && rating.creatorLastName)) && (
                        <div className="p-3 bg-accent rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Session Creator</div>
                          <div className="font-medium">
                            {sessionInfo.creator ? (
                              sessionInfo.creator.username ? (
                                <Link href={`/profile/${sessionInfo.creator.username}`} className="hover:underline">
                                  {sessionInfo.creator.firstName} {sessionInfo.creator.lastName}
                                </Link>
                              ) : (
                                `${sessionInfo.creator.firstName} ${sessionInfo.creator.lastName}`
                              )
                            ) : (
                              rating.creatorUsername ? (
                                <Link href={`/profile/${rating.creatorUsername}`} className="hover:underline">
                                  {rating.creatorFirstName} {rating.creatorLastName}
                                </Link>
                              ) : (
                                `${rating.creatorFirstName} ${rating.creatorLastName}`
                              )
                            )}
                            {sessionInfo.creator?.username && (
                              <span className="text-sm text-muted-foreground ml-2">(@{sessionInfo.creator.username})</span>
                            )}
                            {!sessionInfo.creator?.username && rating.creatorUsername && (
                              <span className="text-sm text-muted-foreground ml-2">(@{rating.creatorUsername})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                         <div className="text-sm text-muted-foreground">{t("ratedOn")}</div>
                         <div className="font-medium">{formatDate(rating.createdAt)}</div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                       <User className="h-5 w-5 text-muted-foreground" />
                       <div>
                         <div className="text-sm text-muted-foreground">{t("ratedBy")}</div>
                         <div className="font-medium">
                           {rating.isAnonymous ? t("anonymousUser") : <Link href={`/profile/${rating.raterUsername}`} className="hover:underline">{rating.raterFirstName} {rating.raterLastName}</Link>}
                         </div>
                       </div>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Stats */}
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-lg">{t("ratingSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">{t("technicalKnowledge")}</span>
                     <span className="font-medium">{rating.technicalKnowledge}/5</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">{t("communication")}</span>
                     <span className="font-medium">{rating.communication}/5</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">{t("organization")}</span>
                     <span className="font-medium">{rating.organization}/5</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">{t("helpfulness")}</span>
                     <span className="font-medium">{rating.helpfulness}/5</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">{t("overallScore")}</span>
                     <span className={`font-semibold ${getRatingColor(rating.overallRating)}`}>
                       {rating.overallRating}/5
                     </span>
                   </div>
                    <Separator className="my-4" />
                    <div className="text-center">
                     <div className="text-2xl font-bold text-green-600">
                       {((rating.overallRating / 5) * 100).toFixed(0)}%
                     </div>
                     <div className="text-sm text-muted-foreground">{t("satisfactionRate")}</div>
                   </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                                 <Link href={`/meeting`} className="w-full">
                   <Button className="w-full" variant="outline">
                     {t("joinNewSession")}
                   </Button>
                 </Link>
                 <Link href="/ratings" className="w-full">
                   <Button className="w-full" variant="outline">
                     {t("viewAllRatings")}
                   </Button>
                 </Link>
                 <Button className="w-full" variant="outline">
                   {t("shareRating")}
                 </Button>
              </CardContent>
            </Card> */}

            {/* Rating Metadata */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("metadata")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                                 <div className="flex justify-between">
                   <span className="text-muted-foreground">{t("ratingId")}</span>
                   <span className="font-mono text-xs">{rating._id}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">{t("sessionId")}</span>
                   <span className="font-mono text-xs">{rating.sessionId}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">{t("creatorId")}</span>
                   <span className="font-mono text-xs">{rating.creatorId}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">{t("created")}</span>
                   <span className="text-xs">{formatDate(rating.createdAt)}</span>
                 </div>
                 {rating.updatedAt !== rating.createdAt && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">{t("updated")}</span>
                     <span className="text-xs">{formatDate(rating.updatedAt)}</span>
                   </div>
                 )}
              </CardContent>
            </Card> */}
          </div>
        </div>
      </Container>
    </div>
  );
}
