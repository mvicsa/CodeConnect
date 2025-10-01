'use client'

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import UserRatingsStats from './UserRatingsStats';
import ProfileTabs from './ProfileTabs';
import { RootState } from '@/store/store';
import { CalendarIcon } from 'lucide-react';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { followUser, unfollowUser, fetchFollowers, fetchFollowing, fetchSuggestedUsers, resetSuggested } from '@/store/slices/followSlice';
import { useEffect, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { fetchProfile, updateProfile, updateFollowing } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import ProfileHeader from './ProfileHeader';
import UserListDialog from './UserListDialog';
import { ProfileSidebarSkeleton } from './ProfileSkeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateAge } from '@/lib/calculateAge';
import { 
  Github, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Youtube, 
  Dribbble, 
  Globe, 
  MessageSquare, 
  ExternalLink,
  X as XIcon  // Rename Twitter to X
} from 'lucide-react';
import { fetchUserByUsername } from '@/store/slices/userSlice';

// Define platform colors
const PLATFORM_COLORS = {
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

// Update the SOCIAL_PLATFORMS constant to change Twitter to X
const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'x', label: 'X', icon: XIcon },  // Changed from Twitter to X
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'dribbble', label: 'Dribbble', icon: Dribbble },
  { value: 'behance', label: 'Behance', icon: ExternalLink },
  { value: 'medium', label: 'Medium', icon: MessageSquare },
  { value: 'stackoverflow', label: 'Stack Overflow', icon: ExternalLink },
  { value: 'website', label: 'Personal Website', icon: Globe }
];

// Add user type
interface ProfileUser {
  _id: string;
  id?: string;
  name?: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  avatar: string;
  cover?: string;
  skills?: string[];
  role?: string;
  followers?: object[];
  following?: object[];
  bio?: string;
  birthdate?: string;
  gender?: string;
  city?: string;
  country?: string;
  socialLinks?: SocialLink[];
}

// Add a new interface for social links
interface SocialLink {
  platform: string;
  title?: string; // Add title field for display name
  url: string;
}

interface ProfilePageClientProps {
  user?: ProfileUser;
}

// Add edit form type
interface EditForm {
  firstName: string;
  lastName: string;
  bio: string;
  // Avatar and cover are managed through the image cropper component
  // but we keep them in the form state for API submission
  avatar: string;
  cover: string;
  skills: string[];
  birthdate: Date | null;
  gender: string | null;
  city: string;
  country: string;
  socialLinks: SocialLink[];
}

const ProfilePageClient = ({ user: userProp }: ProfilePageClientProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const user = userProp || reduxUser;
  const currentUser = reduxUser;
  const { followers, following } = useSelector((state: RootState) => state.follow);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasFetchedProfile = React.useRef(false);

  // Force re-render when followers count changes
  const [followersCount, setFollowersCount] = useState((user?.followers as object[])?.length || 0);
  // Add local following count state
  const [followingCount, setFollowingCount] = useState((user?.following as object[])?.length || 0);
  // Track if we're viewing our own profile or someone else's
  const isSelf = currentUser?._id === user?._id;
  
  // Function to safely update followers count
  const updateFollowersCount = useCallback((count: number) => {
    setFollowersCount(count);
  }, []);
  
  // Only update followers count from API when appropriate
  useEffect(() => {
    // When viewing someone else's profile, we need to update their followers count
    // from the API data
    updateFollowersCount((user?.followers as object[])?.length || 0);
  }, [user?.followers, updateFollowersCount]);

  // Update following count when user data changes
  useEffect(() => {
    setFollowingCount((user?.following as object[])?.length || 0);
  }, [user?.following]);

  // Update sidebar loading when user data is available
  useEffect(() => {
    if (user && !authLoading) {
      setSidebarLoading(false);
      setInitialLoading(false);
    } else {
      setSidebarLoading(true);
      setInitialLoading(true);
    }
  }, [user, authLoading]);

  // Set initial loading to false if no user data
  useEffect(() => {
    if (!user && !authLoading) {
      setInitialLoading(false);
    }
  }, [user, authLoading]);

  // Profile edit form state
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: user?.firstName as string || '',
    lastName: user?.lastName as string || '',
    bio: user?.bio as string || '',
    avatar: user?.avatar as string || '',
    cover: user?.cover as string || '',
    skills: user?.skills as string[] || [],
    birthdate: user?.birthdate ? new Date(user.birthdate as string) : null,
    gender: user?.gender as string || null,
    city: user?.city as string || '',
    country: user?.country as string || '',
    socialLinks: user?.socialLinks as SocialLink[] || []
  });

  // Update the useEffect that sets the initial form state to handle social links properly
  useEffect(() => {
    if (user) {
      // Map social links to ensure they have proper platform values that match our SOCIAL_PLATFORMS
      const mappedSocialLinks = ((user.socialLinks || []) as SocialLink[]).map(link => {
        // Handle Twitter to X migration
        if (link.platform === 'twitter') {
          return {
            ...link,
            platform: 'x',
            title: 'X'
          };
        }
        
        // Make sure the platform value exists in our SOCIAL_PLATFORMS
        const platformExists = SOCIAL_PLATFORMS.some(p => p.value === link.platform);
        
        if (platformExists) {
          // If platform exists, keep it as is
          return link;
        } else if (link.title) {
          // If platform doesn't exist but we have a title, try to find a matching platform
          const matchingPlatform = SOCIAL_PLATFORMS.find(
            p => p.label.toLowerCase() === link.title?.toLowerCase()
          );
          
          if (matchingPlatform) {
            // If we found a match, use that platform value
            return {
              ...link,
              platform: matchingPlatform.value
            };
          }
        }
        
        // If no match found, return as is
        return link;
      });
      
      setEditForm({
        firstName: user.firstName as string || '',
        lastName: user.lastName as string || '',
        bio: user.bio as string || '',
        avatar: user.avatar as string || '',
        cover: user.cover as string || '',
        skills: user.skills as string[] || [],
        birthdate: user.birthdate ? new Date(user.birthdate as string) : null,
        gender: user.gender as string || null,
        city: user.city as string || '',
        country: user.country as string || '',
        socialLinks: mappedSocialLinks
      });
      
    }
  }, [user]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Prevent spaces in firstName and lastName fields
    if (name === 'firstName' || name === 'lastName') {
      const valueWithoutSpaces = value.replace(/\s/g, '');
      setEditForm(prev => ({ ...prev, [name]: valueWithoutSpaces }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const [skillInput, setSkillInput] = useState('');

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!editForm.skills.includes(skillInput.trim())) {
        setEditForm(prev => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()]
        }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Add URL validation function
  const isValidUrl = (url: string): boolean => {
    try {
      // Check if URL starts with http:// or https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      
      // Try to create a URL object
      new URL(url);
      return true;
    } catch (e) {
      console.error(e)
      return false;
    }
  };

  // Update the handleSocialLinkChange function to set the title when platform changes
  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => {
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
      })
    }));
  };

  // Update the addSocialLink function to include title
  const addSocialLink = () => {
    // Find a platform that hasn't been used yet
    const usedPlatforms = editForm.socialLinks.map(link => link.platform);
    const availablePlatform = SOCIAL_PLATFORMS.find(p => !usedPlatforms.includes(p.value));
    
    setEditForm(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { 
        platform: availablePlatform?.value || '', 
        title: availablePlatform?.label || '',
        url: '' 
      } as SocialLink]
    }));
  };

  const removeSocialLink = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const refetchUser = async () => {
    if (userProp?.username) {
      await dispatch(fetchUserByUsername(userProp.username));
    } else {
      await dispatch(fetchProfile());
    }
    
    // Also fetch current user's profile to ensure following list is up to date
    await dispatch(fetchProfile());
    
    // Update local follow status after refetching user data
    // This ensures the unfollow button state is updated when blocking someone
    if (user?._id && currentUser?.following) {
      const updatedIsFollowing = Array.isArray(currentUser.following) && currentUser.following.includes(user._id);
      setIsFollowing(updatedIsFollowing);
    }
  };

  const handleUpdateAvatar = async (url: string) => {
    try {
      setEditLoading(true);
      const payload = {
        ...editForm,
        avatar: url
      };
      
      await dispatch(updateProfile(payload)).unwrap();
      await refetchUser(); // <-- use this instead of fetchProfile
      
      // Update local form state
      setEditForm(prev => ({
        ...prev,
        avatar: url
      }));
    } catch (error) {
      console.error('Avatar update error:', error);
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleUpdateCover = async (url: string) => {
    try {
      setEditLoading(true);
      const payload = {
        ...editForm,
        cover: url
      };
      
      await dispatch(updateProfile(payload)).unwrap();
      await refetchUser(); // <-- use this instead of fetchProfile
      
      // Update local form state
      setEditForm(prev => ({
        ...prev,
        cover: url
      }));
    } catch (error) {
      console.error('Cover update error:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // Update handleEditSubmit to add console logging
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    // Check if there's text in the skill input that hasn't been added yet
    if (skillInput.trim()) {
      setEditError("Please press Enter to add the skill you typed, or clear the input field");
      setEditLoading(false);
      return;
    }

    // Validate social links URLs
    const invalidLinks = editForm.socialLinks.filter(
      link => link.platform && link.url && !isValidUrl(link.url)
    );

    if (invalidLinks.length > 0) {
      setEditError("Please enter valid URLs for your social links (must start with http:// or https://)");
      setEditLoading(false);
      return;
    }

    // Filter out incomplete social links and ensure titles are set
    const filteredSocialLinks = editForm.socialLinks
      .filter(link => link.platform && link.url)
      .map(link => {
        // If title is missing, set it from SOCIAL_PLATFORMS
        if (!link.title) {
          const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
          return {
            ...link,
            title: platform?.label || link.platform
          };
        }
        return link;
      });
  
    // Prepare data for API
    const birthdateValue = editForm.birthdate ? 
      new Date(editForm.birthdate.getTime() - editForm.birthdate.getTimezoneOffset() * 60000)
        .toISOString().split('T')[0] : null;
    console.log('Birthdate debug:', {
      original: editForm.birthdate,
      formatted: birthdateValue,
      isoString: editForm.birthdate?.toISOString(),
      timezoneOffset: editForm.birthdate?.getTimezoneOffset()
    });
    
    const payload = {
      ...editForm,
      socialLinks: filteredSocialLinks,
      birthdate: birthdateValue,
    };
    
    console.log('Submitting profile update with payload:', payload);
    
    // Add a timeout to ensure dialog closes even if there are issues
    const timeoutId = setTimeout(() => {
      console.log('Force closing dialog due to timeout');
      setEditDialogOpen(false);
      setEditLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      // Actually dispatch the updateProfile action
      const result = await dispatch(updateProfile(payload)).unwrap();
      console.log('Profile update successful:', result);
      
      // Clear the timeout since we succeeded
      clearTimeout(timeoutId);
      
      // Show success toast
      toast.success('Profile updated successfully!', {
        duration: 3000,
        description: 'Your profile has been saved.'
      });
      
      // Close dialog after successful update
      setEditDialogOpen(false);
      console.log('Dialog closed successfully');
      
      // Then refetch user data to get the updated profile (don't block dialog closing)
      try {
        await refetchUser();
      } catch (refetchError) {
        console.warn('Error refetching user data:', refetchError);
        // Don't show this error to user since the update was successful
      }
    } catch (error) {
      console.error('Profile update error:', error);
      clearTimeout(timeoutId);
      const errorMessage = (error as Error)?.message || 'Failed to update profile';
      setEditError(errorMessage);
      
      // Show error toast
      toast.error('Failed to update profile', {
        duration: 5000,
        description: errorMessage
      });
      
      // Don't close dialog on error - let user see the error message
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch followers/following on mount (for the current user)
  useEffect(() => {
    if (user?._id) {
      if (isSelf) {
        // If viewing own profile:
        // - Fetch our following list (people we follow)
        dispatch(fetchFollowing({ userId: user._id as string }));
      } else {
        // If viewing someone else's profile:
        // - Fetch their followers list (to see if we're in it)
        dispatch(fetchFollowers({ userId: user._id as string }));
      }
    }
  }, [dispatch, user?._id, isSelf]);

  // Fetch suggestions on mount
  useEffect(() => {
    dispatch(resetSuggested());
    dispatch(fetchSuggestedUsers({ limit: 5, skip: 0 }));
  }, [dispatch]);

  // Fetch profile data once on mount or when auth state changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!reduxUser && !authLoading && !hasFetchedProfile.current) {
        hasFetchedProfile.current = true;
        try {
          await dispatch(fetchProfile());
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    
    fetchUserData();
  }, [authLoading, reduxUser, dispatch]);

  // Determine if the current user is following this profile
  const serverIsFollowing = !!(currentUser && user && currentUser.following && Array.isArray(currentUser.following) && currentUser.following.includes(user._id));
  // Add local state for follow status to prevent re-renders
  const [isFollowing, setIsFollowing] = useState(serverIsFollowing);
  
  // Update local isFollowing state when server state changes or when following list changes
  useEffect(() => {
    if (user?._id && currentUser?.following) {
      const updatedIsFollowing = Array.isArray(currentUser.following) && currentUser.following.includes(user._id);
      setIsFollowing(updatedIsFollowing);
    } else {
      setIsFollowing(serverIsFollowing);
    }
  }, [serverIsFollowing, user?._id, currentUser?.following]);

  // Helper: get current user ID (should be the logged-in user's _id)
  const currentUserId = reduxUser?._id;
  // Helper: get following IDs for the logged-in user (for button state)
  const followingIds = useMemo(() => (reduxUser?.following ?? []), [reduxUser?.following]);
  // Helper: get following IDs for the profile user (for dialog user list)

  // Follow/unfollow handlers
  const handleFollow = useCallback(async () => {
    if (user?._id) {
      setFollowActionLoading(true);
      try {
        // Update local follow status immediately
        setIsFollowing(true);
        
        // When viewing another user's profile and following them:
        // - Update THEIR followers count (not following count)
        // - Update OUR following count (handled in fetchProfile)
        if (!isSelf) {
          // Increment followers count when following another user
          setFollowersCount((prev: number) => prev + 1);
        } else {
          // When viewing our own profile and following someone:
          // - Update OUR following count
          setFollowingCount((prev: number) => prev + 1);
        }
        
        // Make API call
        await dispatch(followUser(user._id as string)).unwrap();
        
        // Update local following state for the current user
        // This avoids needing to call fetchProfile() which causes re-renders
        if (reduxUser && reduxUser.following && Array.isArray(reduxUser.following) && !reduxUser.following.includes(user._id as string)) {
          dispatch(updateFollowing([...(reduxUser.following as string[] || []), user._id as string]));
        }
        
        // No need to fetch followers/following again - we've already updated the counts locally
        // This prevents unnecessary re-renders
      } catch (error) {
        // Revert the local state if there was an error
        setIsFollowing(false);
        
        // Revert the count if there was an error
        if (!isSelf) {
          // Revert followers count
          setFollowersCount((prev: number) => Math.max(0, prev - 1));
        } else {
          // Revert following count
          setFollowingCount((prev: number) => Math.max(0, prev - 1));
        }
        console.error('Error following user:', error);
      } finally {
        setFollowActionLoading(false);
      }
    }
  }, [dispatch, user?._id, reduxUser, isSelf]);

  const handleUnfollow = useCallback(async () => {
    if (user?._id) {
      setFollowActionLoading(true);
      try {
        // Update local follow status immediately
        setIsFollowing(false);
        
        // When viewing another user's profile and unfollowing them:
        // - Update THEIR followers count (not following count)
        // - Update OUR following count (handled in fetchProfile)
        if (!isSelf) {
          // Decrement followers count when unfollowing another user
          setFollowersCount((prev: number) => Math.max(0, prev - 1));
        } else {
          // When viewing our own profile and unfollowing someone:
          // - Update OUR following count
          setFollowingCount((prev: number) => Math.max(0, prev - 1));
        }
        
        // Make API call
        await dispatch(unfollowUser(user._id as string)).unwrap();
        
        // Update local following state for the current user
        // This avoids needing to call fetchProfile() which causes re-renders
        if (reduxUser && reduxUser.following && Array.isArray(reduxUser.following) && reduxUser.following.includes(user._id as string)) {
          dispatch(updateFollowing((reduxUser.following as string[] || []).filter((id: string) => id !== user._id as string)));
        }
        
        // No need to fetch followers/following again - we've already updated the counts locally
        // This prevents unnecessary re-renders
      } catch (error) {
        // Revert the local state if there was an error
        setIsFollowing(true);
        
        // Revert the count if there was an error
        if (!isSelf) {
          // Revert followers count
          setFollowersCount((prev: number) => prev + 1);
        } else {
          // Revert following count
          setFollowingCount((prev: number) => prev + 1);
        }
        console.error('Error unfollowing user:', error);
      } finally {
        setFollowActionLoading(false);
      }
    }
  }, [dispatch, user?._id, reduxUser, isSelf]);

  // Open followers dialog and fetch first page
  const handleOpenFollowers = () => {
    setFollowersOpen(true);
    if (user?._id) {
      dispatch(fetchFollowers({ userId: user._id as string, limit: 20, skip: 0 }));
    }
  };

  // Open following dialog and fetch first page
  const handleOpenFollowing = () => {
    setFollowingOpen(true);
    if (user?._id) {
      dispatch(fetchFollowing({ userId: user._id as string, limit: 20, skip: 0 }));
    }
  };

  // Load more followers
  const handleLoadMoreFollowers = () => {
    if (user?._id && followers.hasMore && !followers.loading) {
      dispatch(fetchFollowers({ userId: user._id as string, limit: followers.limit, skip: followers.skip }));
    }
  };

  // Load more following
  const handleLoadMoreFollowing = () => {
    if (user?._id && following.hasMore && !following.loading) {
      dispatch(fetchFollowing({ userId: user._id as string, limit: following.limit, skip: following.skip }));
    }
  };

  // Add state to track dialog follow/unfollow loading
  const [dialogFollowLoading, setDialogFollowLoading] = useState(false);

  // DRY follow/unfollow handler for dialogs
  const handleDialogFollowToggle = async (userObj: ProfileUser, isFollowing: boolean) => {
    try {
      setDialogFollowLoading(true);
      
      // When following/unfollowing from dialog:
      // - We're always updating OUR following count
      // - We're not updating anyone's followers count directly
      // - This is because dialogs are used to follow/unfollow from our own profile view
      if (isFollowing) {
        // Decrement following count when unfollowing
        setFollowingCount((prev: number) => Math.max(0, prev - 1));
      } else {
        // Increment following count when following
        setFollowingCount((prev: number) => prev + 1);
      }
      
      // Make the API call
      await dispatch(isFollowing ? unfollowUser(userObj._id) : followUser(userObj._id)).unwrap();
      
      // Update local following state for the current user
      // This avoids needing to call fetchProfile() which causes re-renders
      if (reduxUser) {
        if (isFollowing && reduxUser.following && Array.isArray(reduxUser.following) && reduxUser.following.includes(userObj._id)) {
          // Remove from following list
          dispatch(updateFollowing((reduxUser.following as string[] || []).filter((id: string) => id !== userObj._id)));
        } else if (!isFollowing && reduxUser.following && Array.isArray(reduxUser.following) && !reduxUser.following.includes(userObj._id)) {
          // Add to following list
          dispatch(updateFollowing([...(reduxUser.following as string[] || []), userObj._id as string]));
        }
      }
      
      // We'll let the UserListDialog component handle the UI updates locally
    } catch (error) {
      console.error('Error toggling follow status:', error);
      // Revert the count if there was an error
      if (isFollowing) {
        setFollowingCount((prev: number) => prev + 1);
      } else {
        setFollowingCount((prev: number) => Math.max(0, prev - 1));
      }
    } finally {
      setDialogFollowLoading(false);
    }
  };

  // Add a debug log when the form is opened
  const handleOpenEditDialog = () => {
    console.log('Opening edit dialog');
    setEditDialogOpen(true);
  };

  return (
    <div className='max-w-screen-lg mx-auto px-4'>
      <div className='space-y-4 w-full'>
        <>
          <ProfileHeader
            user={user as ProfileUser}
            followersCount={followersCount}
            followingCount={followingCount}
            onFollowersClick={handleOpenFollowers}
            onFollowingClick={handleOpenFollowing}
            isFollowing={isSelf ? false : isFollowing}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            loading={followActionLoading}
            disabled={isSelf}
            isOwnProfile={isSelf}
            onUpdateAvatar={handleUpdateAvatar}
            onUpdateCover={handleUpdateCover}
            onEditProfile={handleOpenEditDialog}
            onBlockStatusChange={refetchUser}
          />
          {/* Edit Profile Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-h-[80vh] flex flex-col">
              {/* Fixed Header */}
              <div className="flex-shrink-0 border-b pb-4">
                <DialogTitle>Edit Profile</DialogTitle>
              </div>
              
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto py-3 px-6 -mx-6">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleEditChange}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleEditChange}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                {/* Avatar and Cover fields removed - now managed through image cropper */}

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editForm.skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-1 bg-primary/10 text-primary rounded-md px-2 py-1 text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-primary hover:text-primary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Type a skill and press Enter"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Press Enter to add a skill
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Birthdate</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="birthdate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editForm.birthdate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.birthdate && !isNaN(editForm.birthdate.getTime()) ? format(editForm.birthdate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={editForm.birthdate || undefined}
                          month={editForm.birthdate || undefined}
                          onSelect={(date) => setEditForm(prev => ({ 
                            ...prev, 
                            birthdate: date || null 
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editForm.gender || ""}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger id="gender" className='w-full'>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={editForm.city}
                    onChange={handleEditChange}
                    placeholder="Enter your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={editForm.country}
                    onChange={handleEditChange}
                    placeholder="Enter your country"
                  />
                </div>

                {/* Update the social links section in the edit form to show platform colors */}
                <div className="space-y-2">
                  <Label>Social Links</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add your social media profiles to help others connect with you.
                  </p>
                  <div className="space-y-3">
                    {editForm.socialLinks.map((link, index) => {
                      // Find the matching platform for this link
                      const platformMatch = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                      const platformColor = PLATFORM_COLORS[link.platform as keyof typeof PLATFORM_COLORS] || '#6E6E6E';
                      
                      return (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Select
                              value={link.platform || ''}
                              onValueChange={(value) => handleSocialLinkChange(index, 'platform', value)}
                            >
                              <SelectTrigger className='w-full'>
                                <SelectValue>
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
                                    <span>{link.title || 'Select platform'}</span>
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
                                      disabled={editForm.socialLinks.some(
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
                      className="w-full mt-2"
                      disabled={editForm.socialLinks.length >= SOCIAL_PLATFORMS.length}
                    >
                      Add Social Link
                    </Button>
                    {editForm.socialLinks.length >= SOCIAL_PLATFORMS.length && (
                      <p className="text-xs text-muted-foreground text-center">
                        Maximum number of social links reached.
                      </p>
                    )}
                  </div>
                </div>

                {editError && <div className="text-red-500 text-sm">{editError}</div>}
              </form>
              </div>
              
              {/* Fixed Footer */}
              <div className="flex-shrink-0 border-t pt-4">
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={editLoading} onClick={handleEditSubmit}>
                    {editLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Followers Dialog */}
          <UserListDialog
            open={followersOpen}
            onOpenChange={setFollowersOpen}
            title='Followers'
            users={followers.items as ProfileUser[]}
            loading={followers.loading}
            hasMore={followers.hasMore}
            onLoadMore={handleLoadMoreFollowers}
            onFollowToggle={handleDialogFollowToggle}
            followingIds={followingIds as string[]}
            currentUserId={currentUserId as string}
            loadingButton={dialogFollowLoading}
            emptyText='No followers yet.'
          />
          {/* Following Dialog */}
          <UserListDialog
            open={followingOpen}
            onOpenChange={setFollowingOpen}
            title='Following'
            users={following.items as ProfileUser[]}
            loading={following.loading}
            hasMore={following.hasMore}
            onLoadMore={handleLoadMoreFollowing}
            onFollowToggle={handleDialogFollowToggle}
            followingIds={followingIds as string[]}
            currentUserId={currentUserId as string}
            loadingButton={dialogFollowLoading}
            emptyText='Not following anyone yet.'
          />
          <div className='grid grid-cols-16 gap-4'>
              {sidebarLoading ? (
              <ProfileSidebarSkeleton />
            ) : (
              <div className='hidden md:block col-span-5'>
                <Card className='w-full dark:border-0 shadow-none'>
                  <CardHeader>
                    <CardTitle className='text-xl font-bold mb-3'>About me</CardTitle>
                      <p className='text-sm'>
                        {user?.bio as string || 'No bio yet'}
                      </p>
                    <div className='flex flex-row mt-4'>
                        <span className='text-sm text-muted-foreground w-19'>City</span>
                        <span className='text-sm'>
                          {user?.city as string || 'No city yet'}
                        </span>
                    </div>
                    <div className='flex flex-row'>
                        <span className='text-sm text-muted-foreground w-19'>Country</span>
                        <span className='text-sm'>
                            {user?.country as string || 'No country yet'}
                        </span>
                    </div>
                    <div className='flex flex-row'>
                        <span className='text-sm text-muted-foreground w-19'>Age</span>
                        <span className='text-sm'>
                          {user?.birthdate ? calculateAge(user.birthdate as string) : 'No age yet'}
                        </span>
                    </div>
                    <>
                      {user?.socialLinks && (user.socialLinks as SocialLink[]).length > 0 && (
                        <div className='mt-4'>
                          <h4 className='text-sm font-medium mb-2'>Connect</h4>
                          <div className='flex flex-wrap gap-2'>
                            {(user.socialLinks as SocialLink[]).map((link: SocialLink, index: number) => {
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
                        </div>
                      )}
                    </>
                  </CardHeader>
                </Card>

                  {/* User Ratings Stats */}
                  <UserRatingsStats userId={user?._id as string} forceLoading={sidebarLoading} />

                {(user?.skills as string[])?.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='mb-4 text-2xl font-bold'>Skills</h4>
                  <div className='flex flex-wrap gap-2'>
                    {/* loop through user skills */}
                    {(user?.skills as string[])?.map((skill: string, index: number) => (
                      <span key={index} className='bg-card border dark:border-0 px-3 py-1 rounded-full text-sm'>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
              <div className='col-span-16 md:col-span-11'>
                <ProfileTabs userId={user?._id as string} forceLoading={initialLoading} />
              </div>
          </div>
        </>
      </div>
    </div>
  );
};

export default ProfilePageClient; 