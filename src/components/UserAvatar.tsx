'use client'

import Image from 'next/image';
import { useState } from 'react';
import { User } from '@/types/user';

interface UserAvatarProps {
  user: User | null;
  size?: number;
  className?: string;
  showFallback?: boolean;
}

export default function UserAvatar({ 
  user, 
  size = 40, 
  className = "rounded-full object-cover border-2",
  showFallback = true 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If no user or no avatar, show default
  if (!user || (!user.avatar && showFallback)) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-sm font-medium">
          {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
        </span>
      </div>
    );
  }

  // If image failed to load, show fallback
  if (imageError && showFallback) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-sm font-medium">
          {user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isLoading && (
        <div 
          className={`bg-muted animate-pulse ${className}`}
          style={{ width: size, height: size }}
        />
      )}
      <Image
        src={user.avatar || '/user.png'}
        alt={`${user.firstName || user.username || 'User'} avatar`}
        width={size}
        height={size}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={false}
        unoptimized={false}
      />
    </div>
  );
}
