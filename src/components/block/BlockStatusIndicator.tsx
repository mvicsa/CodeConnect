'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { checkBlockStatus } from '@/store/slices/blockSlice';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserX, Shield } from 'lucide-react';

interface BlockStatusIndicatorProps {
  userId: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const BlockStatusIndicator: React.FC<BlockStatusIndicatorProps> = ({
  userId,
  className = '',
  showTooltip = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  // Use a stable selector for blockStatuses
  const blockStatuses = useSelector((state: RootState) => state.block.blockStatuses);

  const blockStatus = blockStatuses[userId];
  const isBlocked = blockStatus?.isBlocked || false;
  const isBlockedBy = blockStatus?.isBlockedBy || false;

  useEffect(() => {
    if (userId && currentUser?._id !== userId) {
      dispatch(checkBlockStatus(userId));
    }
  }, [userId, currentUser?._id, dispatch]);

  if (!isBlocked && !isBlockedBy) {
    return null;
  }

  const getBadgeVariant = () => {
    if (isBlocked) return 'destructive';
    if (isBlockedBy) return 'outline';
    return 'default';
  };

  const getIcon = () => {
    if (isBlocked) return <UserX className="h-3 w-3" />;
    if (isBlockedBy) return <Shield className="h-3 w-3" />;
    return null;
  };

  const getText = () => {
    if (isBlocked) return 'Blocked';
    if (isBlockedBy) return 'Blocked by';
    return '';
  };

  const getTooltipText = () => {
    if (isBlocked) return 'You have blocked this user';
    if (isBlockedBy) return 'This user has blocked you';
    return '';
  };

  const badge = (
    <Badge variant={getBadgeVariant()} className={`flex items-center gap-1 ${className}`}>
      {getIcon()}
      {getText()}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}; 