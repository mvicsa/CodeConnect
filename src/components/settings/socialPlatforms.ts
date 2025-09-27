import { 
  Github, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Youtube, 
  Dribbble, 
  Globe, 
  MessageSquare, 
  ExternalLink
} from 'lucide-react';

// Define platform colors
export const PLATFORM_COLORS = {
  github: '#171515',
  linkedin: '#0077B5',
  x: '#000000',      // X (formerly Twitter)
  facebook: '#1877F2',
  instagram: '#E4405F',
  youtube: '#FF0000',
  dribbble: '#EA4C89',
  behance: '#1769FF',
  medium: '#000000',
  stackoverflow: '#F48024',
  website: '#4285F4'
};

// Social platforms configuration with icons
export const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'x', label: 'X', icon: ExternalLink },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'dribbble', label: 'Dribbble', icon: Dribbble },
  { value: 'behance', label: 'Behance', icon: ExternalLink },
  { value: 'medium', label: 'Medium', icon: MessageSquare },
  { value: 'stackoverflow', label: 'Stack Overflow', icon: ExternalLink },
  { value: 'website', label: 'Personal Website', icon: Globe }
];

export interface SocialLink {
  platform: string;
  title?: string;
  url: string;
}

