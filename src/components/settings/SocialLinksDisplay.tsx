'use client'

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { PLATFORM_COLORS, SOCIAL_PLATFORMS, SocialLink } from './socialPlatforms';

interface SocialLinksDisplayProps {
  socialLinks: SocialLink[];
  className?: string;
}

const SocialLinksDisplay: React.FC<SocialLinksDisplayProps> = ({
  socialLinks,
  className = ''
}) => {
  if (!socialLinks || socialLinks.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {socialLinks.map((link: SocialLink, index: number) => {
        // Try to find platform by exact match first
        let platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
        
        // If not found, try case-insensitive match
        if (!platform) {
          platform = SOCIAL_PLATFORMS.find(p => 
            p.value.toLowerCase() === link.platform?.toLowerCase() ||
            p.label.toLowerCase() === link.platform?.toLowerCase()
          );
        }
        
        // If still not found, try matching by title
        if (!platform && link.title) {
          platform = SOCIAL_PLATFORMS.find(p => 
            p.label.toLowerCase() === (link.title || '').toLowerCase()
          );
        }
        
        const Icon = platform?.icon || ExternalLink;
        const displayTitle = link.title || platform?.label || link.platform;
        const platformColor = platform ? PLATFORM_COLORS[platform.value as keyof typeof PLATFORM_COLORS] : '#6E6E6E';
        
        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className='inline-flex items-center justify-center rounded-md transition-all duration-200 hover:opacity-90 hover:scale-110 shadow-sm transform'
            title={displayTitle}
            style={{ backgroundColor: platformColor }}
          >
            <div className="p-1.5">
              <Icon className="h-4 w-4 text-white" />
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinksDisplay;
