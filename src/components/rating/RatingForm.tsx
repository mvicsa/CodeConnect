"use client";

import React, { useState } from 'react';
import { CreateRatingDto } from '@/types/rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp } from 'lucide-react';
import { useRating } from '@/hooks/useRating';
import { cn } from '@/lib/utils';

interface RatingFormProps {
  sessionId: string;
  creatorName: string;
  onSubmit: (rating: CreateRatingDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const RatingForm: React.FC<RatingFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}) => {
  const { error, clearError } = useRating();
  const [rating, setRating] = useState<CreateRatingDto>({
    overallRating: 0,
    technicalKnowledge: 0,
    communication: 0,
    organization: 0,
    helpfulness: 0,
    comment: '',
    isAnonymous: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating.overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }
    onSubmit(rating);
  };

  const renderStarRating = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    required: boolean = false
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={cn(
              "transition-all duration-200 hover:scale-110 cursor-pointer",
              star <= value 
                ? "text-yellow-500 hover:text-yellow-600" 
                : "text-gray-300 hover:text-yellow-400"
            )}
            onClick={() => onChange(star)}
            onMouseEnter={(e) => {
              // Highlight stars on hover for better UX
              const stars = e.currentTarget.parentElement?.children;
              if (stars) {
                Array.from(stars).forEach((starEl, index) => {
                  if (index < star) {
                    starEl.classList.add('text-yellow-400');
                  }
                });
              }
            }}
            onMouseLeave={(e) => {
              // Reset to actual rating on mouse leave
              const stars = e.currentTarget.parentElement?.children;
              if (stars) {
                Array.from(stars).forEach((starEl, index) => {
                  if (index < value) {
                    starEl.classList.remove('text-yellow-400');
                    starEl.classList.add('text-yellow-500');
                  } else {
                    starEl.classList.remove('text-yellow-400');
                    starEl.classList.add('text-gray-300');
                  }
                });
              }
            }}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
      {value > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {value} out of 5 stars
          </span>
          {value === 5 && (
            <div className="flex items-center gap-1 text-green-600">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-medium">Excellent!</span>
            </div>
          )}
          {value === 4 && (
            <div className="flex items-center gap-1 text-blue-600">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-medium">Very Good!</span>
            </div>
          )}
          {value === 3 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <span className="font-medium">Good</span>
            </div>
          )}
          {value <= 2 && (
            <div className="flex items-center gap-1 text-orange-600">
              <span className="font-medium">Needs Improvement</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="space-y-6">
        {renderStarRating('Overall Rating', rating.overallRating, (value) =>
          setRating({ ...rating, overallRating: value }), true
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderStarRating('Technical Knowledge', rating.technicalKnowledge, (value) =>
            setRating({ ...rating, technicalKnowledge: value })
          )}
          
          {renderStarRating('Communication', rating.communication, (value) =>
            setRating({ ...rating, communication: value })
          )}
          
          {renderStarRating('Organization', rating.organization, (value) =>
            setRating({ ...rating, organization: value })
          )}
          
          {renderStarRating('Helpfulness', rating.helpfulness, (value) =>
            setRating({ ...rating, helpfulness: value })
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="comment" className="text-sm font-medium">
          Additional Comments (Optional)
        </Label>
        <Textarea
          id="comment"
          value={rating.comment}
          onChange={(e) => setRating({ ...rating, comment: e.target.value })}
          maxLength={500}
          placeholder="Share your thoughts about the session, what went well, or suggestions for improvement..."
          rows={4}
          className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Share your experience to help improve future sessions</span>
          <span className={cn(
            "font-mono",
            rating.comment.length > 400 ? "text-orange-600" : "text-muted-foreground"
          )}>
            {rating.comment.length}/500
          </span>
        </div>
      </div>

      {/* <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border">
        <Checkbox
          id="anonymous"
          checked={rating.isAnonymous}
          onCheckedChange={(checked) => 
            setRating({ ...rating, isAnonymous: checked === true })
          }
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="anonymous" className="text-sm cursor-pointer">
          Rate anonymously (your username won't be visible to the creator)
        </Label>
      </div> */}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2 h-auto p-1 text-destructive hover:bg-destructive/20"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || rating.overallRating === 0}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-2" />
              Submit Rating
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
