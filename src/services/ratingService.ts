import { CreateRatingDto, RatingResponseDto, CreatorRatingSummaryDto } from '../types/rating';
import axiosInstance from '@/lib/axios';

export class RatingService {
  async createRating(sessionId: string, ratingData: CreateRatingDto): Promise<RatingResponseDto> {
    const response = await axiosInstance.post(`/livekit/ratings/sessions/${sessionId}`, ratingData);
    return response.data;
  }

  async getSessionRatings(sessionId: string): Promise<RatingResponseDto[]> {
    const response = await axiosInstance.get(`/livekit/ratings/sessions/${sessionId}`);
    return response.data;
  }

  async getCreatorRatings(creatorId: string): Promise<RatingResponseDto[]> {
    const response = await axiosInstance.get(`/livekit/ratings/creators/${creatorId}`);
    return response.data;
  }

  async getCreatorRatingSummary(creatorId: string): Promise<CreatorRatingSummaryDto> {
    const response = await axiosInstance.get(`/livekit/ratings/creators/${creatorId}/summary`);
    return response.data;
  }

  async getTopRatedCreators(limit: number = 10): Promise<CreatorRatingSummaryDto[]> {
    const response = await axiosInstance.get(`/livekit/ratings/top-rated?limit=${limit}`);
    return response.data;
  }

  async updateRating(ratingId: string, updateData: Partial<CreateRatingDto>): Promise<RatingResponseDto> {
    const response = await axiosInstance.put(`/livekit/ratings/${ratingId}`, updateData);
    return response.data;
  }

  async deleteRating(ratingId: string): Promise<void> {
    await axiosInstance.delete(`/livekit/ratings/${ratingId}`);
  }

  async getRatingById(ratingId: string): Promise<RatingResponseDto> {
    const response = await axiosInstance.get(`/livekit/ratings/${ratingId}`);
    return response.data;
  }

  async getAllRatings(page: number = 1, limit: number = 10): Promise<{
    ratings: RatingResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await axiosInstance.get(`/livekit/ratings?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getMySubmittedRatings(page: number = 1, limit: number = 10, queryParams?: {
    search?: string;
    rating?: string;
    sortBy?: string;
  }): Promise<{
    ratings: RatingResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (queryParams?.search) params.append('search', queryParams.search);
    if (queryParams?.rating) params.append('rating', queryParams.rating);
    if (queryParams?.sortBy) params.append('sortBy', queryParams.sortBy);
    
    const response = await axiosInstance.get(`/livekit/ratings/my-submitted?${params.toString()}`);
    return response.data;
  }

  async getMyReceivedRatings(page: number = 1, limit: number = 10, queryParams?: {
    search?: string;
    rating?: string;
    sortBy?: string;
  }): Promise<{
    ratings: RatingResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (queryParams?.search) params.append('search', queryParams.search);
    if (queryParams?.rating) params.append('rating', queryParams.rating);
    if (queryParams?.sortBy) params.append('sortBy', queryParams.sortBy);
    
    const response = await axiosInstance.get(`/livekit/ratings/my-received?${params.toString()}`);
    return response.data;
  }

  async getUserReceivedRatings(userId: string, page: number = 1, limit: number = 10): Promise<{
    ratings: RatingResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // TODO: Backend needs to implement this endpoint: /livekit/ratings/users/{userId}/received
    // For now, we'll use a workaround by fetching all ratings and filtering by creatorId
    // This is not ideal but will work until the proper endpoint is added
    
    try {
      // Try to use the new endpoint first (in case it gets implemented)
      const response = await axiosInstance.get(`/livekit/ratings/users/${userId}/received?${params.toString()}`);
      return response.data;
    } catch {
      // Fallback: fetch all ratings and filter by creatorId
      const allRatingsResponse = await axiosInstance.get(`/livekit/ratings?page=${page}&limit=${limit * 3}`);
      
      // Filter ratings where the profile user is the creator (received ratings)
      const filteredRatings = allRatingsResponse.data.ratings.filter((rating: RatingResponseDto) => {
        try {
          const creatorId = typeof rating.creatorId === 'string' ? rating.creatorId : JSON.parse(rating.creatorId)._id;
          return creatorId === userId;
        } catch {
          return false;
        }
      });
      
      // Calculate pagination manually
      const total = allRatingsResponse.data.total || 0;
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      return {
        ratings: filteredRatings.slice(0, limit),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      };
    }
  }
}

export const ratingService = new RatingService();
