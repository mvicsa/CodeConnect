export interface CreateRatingDto {
  overallRating: number;
  technicalKnowledge: number;
  communication: number;
  organization: number;
  helpfulness: number;
  comment: string;
  isAnonymous: boolean;
}

export interface RatingResponseDto {
  _id: string;
  sessionId: string;
  roomId: string;
  roomName?: string;
  roomDescription?: string;
  creatorId: string;
  creatorUsername?: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  raterId: string;
  raterUsername?: string;
  raterFirstName?: string;
  raterLastName?: string;
  overallRating: number;
  technicalKnowledge: number;
  communication: number;
  organization: number;
  helpfulness: number;
  comment: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorRatingSummaryDto {
  creatorId: string;
  creatorUsername: string;
  totalRatings: number;
  averageOverallRating: number;
  averageTechnicalKnowledge: number;
  averageCommunication: number;
  averageOrganization: number;
  averageHelpfulness: number;
  ratingDistribution: {
    [key: string]: number; // "1", "2", "3", "4", "5"
  };
}
