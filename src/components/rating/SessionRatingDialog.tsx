"use client";

import React, { useState } from 'react';
import { CreateRatingDto } from '@/types/rating';
import { ratingService } from '@/services/ratingService';
import { RatingForm } from './RatingForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SessionRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  roomName: string;
  creatorName: string;
  creatorId: string;
  onRatingSubmitted?: () => void;
}

export const SessionRatingDialog: React.FC<SessionRatingDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  roomName,
  creatorName,
  onRatingSubmitted,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRating = async (ratingData: CreateRatingDto) => {
    try {
      setSubmitting(true);
      await ratingService.createRating(sessionId, ratingData);
      
      toast.success('Thank you for your rating!', {
        description: 'Your feedback helps improve the community experience.',
        duration: 4000,
      });
      
      // Call callback
      onRatingSubmitted?.();
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error(`Failed to submit rating: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !submitting) {
      // Reset form state when closing
      setShowForm(false);
    }
    onOpenChange(newOpen);
  };

  if (showForm) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Star className="h-5 w-5 text-yellow-500" />
              Rate This Session
            </DialogTitle>
            <DialogDescription className="text-base">
              Share your experience with <span className="font-medium text-primary">@{creatorName}</span>
            </DialogDescription>
          </DialogHeader>
          <RatingForm
            sessionId={sessionId}
            creatorName={creatorName}
            onSubmit={handleSubmitRating}
            onCancel={() => setShowForm(false)}
            isSubmitting={submitting}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Star className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            How was your session?
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            You recently participated in <strong className="text-foreground">{roomName}</strong> with{' '}
            <strong className="text-primary">{creatorName}</strong>. 
            <br />
            Please take a moment to rate your experience and help improve future sessions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-primary/10 p-6 rounded-xl border border-primary/50">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-semibold text-primary">Session Details</h4>
                <div className="space-y-1 text-sm text-primary">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Session:</span>
                    <span className="bg-white/50 dark:bg-primary/50 px-2 py-1 rounded text-xs font-mono">
                      {roomName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Creator:</span>
                    <span className="text-primary font-medium">
                      {creatorName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Your feedback helps creators improve and helps other users find great sessions
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowForm(true)}
                className="flex-1 h-10 text-base font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={submitting}
              >
                <Star className="h-5 w-5" />
                Rate Session
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={submitting}
                className="h-10 px-6 border-2 hover:bg-muted/50"
              >
                Maybe Later
              </Button>
            </div>
          </div>

          {/* <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-full">
              <Sparkles className="h-3 w-3" />
              <span>Your ratings are anonymous by default</span>
            </div>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
