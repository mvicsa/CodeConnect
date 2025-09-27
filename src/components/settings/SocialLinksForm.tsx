'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLATFORM_COLORS, SOCIAL_PLATFORMS, SocialLink } from './socialPlatforms';

interface SocialLinksFormProps {
  socialLinks: SocialLink[];
  onSocialLinksChange: (socialLinks: SocialLink[]) => void;
  error?: string | null;
}

const SocialLinksForm: React.FC<SocialLinksFormProps> = ({
  socialLinks,
  onSocialLinksChange
}) => {
  // URL validation function
  const isValidUrl = (url: string): boolean => {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    const updatedLinks = socialLinks.map((link, i) => {
      if (i !== index) return link;
      
      // If changing platform, also update the title
      if (field === 'platform') {
        const platform = SOCIAL_PLATFORMS.find(p => p.value === value);
        return { 
          ...link, 
          [field]: value,
          title: platform?.label || value
        };
      }
      
      return { ...link, [field]: value };
    });
    
    onSocialLinksChange(updatedLinks);
  };

  const addSocialLink = () => {
    const usedPlatforms = socialLinks.map(link => link.platform);
    const availablePlatform = SOCIAL_PLATFORMS.find(p => !usedPlatforms.includes(p.value));
    
    if (availablePlatform) {
      const newLink = { 
        platform: availablePlatform.value, 
        title: availablePlatform.label,
        url: '' 
      };
      onSocialLinksChange([...socialLinks, newLink]);
    }
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = socialLinks.filter((_, i) => i !== index);
    onSocialLinksChange(updatedLinks);
  };

  return (
    <div className="space-y-2">
      <Label>Social Links</Label>
      <p className="text-sm text-muted-foreground mb-3">
        Add your social media profiles to help others connect with you.
      </p>
      <div className="space-y-4">
        {socialLinks.map((link, index) => {
          
          // Find the matching platform for this link
          const platformMatch = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
          const platformColor = PLATFORM_COLORS[link.platform as keyof typeof PLATFORM_COLORS] || '#6E6E6E';
          
          return (
            <div key={`${link.platform || 'empty'}-${link.url || 'nourl'}-${index}`} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Select
                  value={link.platform || ''}
                  onValueChange={(value) => handleSocialLinkChange(index, 'platform', value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select platform">
                      {platformMatch ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center justify-center rounded-sm p-1"
                            style={{ backgroundColor: platformColor }}
                          >
                            {platformMatch.icon && React.createElement(platformMatch.icon, { 
                              className: "h-3.5 w-3.5", 
                              color: "white" 
                            })}
                          </div>
                          <span>{platformMatch.label}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select platform</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_PLATFORMS.map(platform => {
                      const Icon = platform.icon;
                      const color = PLATFORM_COLORS[platform.value as keyof typeof PLATFORM_COLORS] || '#6E6E6E';
                      
                      return (
                        <SelectItem 
                          key={platform.value} 
                          value={platform.value}
                          disabled={socialLinks.some(
                            (l, i) => i !== index && l.platform === platform.value
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="flex items-center justify-center rounded-sm p-1"
                              style={{ backgroundColor: color }}
                            >
                              <Icon className="h-3.5 w-3.5" color="white" />
                            </div>
                            <span>{platform.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="https://example.com"
                  value={link.url}
                  onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                  className={link.url && !isValidUrl(link.url) ? "border-red-500" : ""}
                />
                {link.url && !isValidUrl(link.url) && (
                  <p className="text-xs text-red-500 mt-1">URL must start with http:// or https://</p>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeSocialLink(index)}
                className="shrink-0"
              >
                Remove
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={addSocialLink}
          className="w-full mt-1"
          disabled={socialLinks.length >= SOCIAL_PLATFORMS.length}
        >
          Add Social Link
        </Button>
        {socialLinks.length >= SOCIAL_PLATFORMS.length && (
          <p className="text-xs text-muted-foreground text-center">
            Maximum number of social links reached.
          </p>
        )}
      </div>
    </div>
  );
};

export default SocialLinksForm;
