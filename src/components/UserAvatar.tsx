'use client'

import Image from 'next/image';
import { useState } from 'react';
import { User } from '@/types/user';

interface UserAvatarProps {
  user?: User | null;
  size?: number;
  aiSrc?: string;
  ai?: string;
  className?: string;
  showFallback?: boolean;
}

export default function UserAvatar({ 
  user, 
  size = 50, 
  aiSrc,
  ai,
  className = "rounded-full object-cover border-2 border-primary",
  showFallback = true 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const avatarSrc = aiSrc || user?.avatar || '/user.png';

  // Debug logging
  console.log('UserAvatar Debug:', {
    aiSrc,
    userAvatar: user?.avatar,
    avatarSrc,
    ai,
    user: user ? 'present' : 'null'
  });

  const handleImageError = () => {
    console.log('Image failed to load:', avatarSrc);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If no user or no avatar, show default (but allow aiSrc to override)
  if (!user && !aiSrc) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-sm font-medium">
          {ai || 'U'}
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
          {ai || user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
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
        src={aiSrc || user?.avatar || '/user.png'}
        alt={`${ai || user?.firstName || user?.username || 'User'} avatar`}
        width={size}
        height={size}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 object-cover h-full w-full`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={false}
        unoptimized={aiSrc?.includes('.avif') ? true : false}
      />
      
    </div>
  );
}
