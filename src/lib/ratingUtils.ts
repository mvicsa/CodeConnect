/**
 * Utility functions for rating-related operations
 */

export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 3.5) return "text-yellow-600";
  if (rating >= 2.5) return "text-orange-600";
  return "text-red-600";
};

export const getRatingColorClass = (rating: number): string => {
  if (rating >= 4.5) return "text-green-600 border-green-600";
  if (rating >= 3.5) return "text-yellow-600 border-yellow-600";
  if (rating >= 2.5) return "text-orange-600 border-orange-600";
  return "text-red-600 border-red-600";
};

export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Average";
  if (rating >= 1.5) return "Below Average";
  return "Poor";
};

export const formatRatingText = (rating: number): string => {
  return `${rating} Star${rating !== 1 ? 's' : ''}`;
};

export const calculateAverageRating = (ratings: { overallRating: number }[]): number => {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating.overallRating, 0);
  return total / ratings.length;
};

export const getSatisfactionRate = (rating: number): number => {
  return ((rating / 5) * 100);
};

export const formatSatisfactionRate = (rating: number): string => {
  return `${getSatisfactionRate(rating).toFixed(0)}%`;
};
