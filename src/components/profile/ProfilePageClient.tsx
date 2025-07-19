'use client'

import PostsProfile from '@/components/post/PostsProfile';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { RootState } from '@/store/store';
import { CalendarIcon } from 'lucide-react';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { followUser, unfollowUser, fetchFollowers, fetchFollowing, fetchSuggestedUsers, resetFollowers, resetFollowing, resetSuggested } from '@/store/slices/followSlice';
import { useEffect, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { fetchProfile, updateProfile, updateFollowing } from '@/store/slices/authSlice';
import ProfileHeader from './ProfileHeader';
import UserListDialog from './UserListDialog';
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
  followers?: any[];
  following?: any[];
  bio?: string;
  birthdate?: string;
  gender?: string;
  city?: string;
  country?: string;
  socialLinks?: { platform: string; url: string }[];
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
  socialLinks: { platform: string; url: string }[];
}

const ProfilePageClient = ({ user: userProp }: ProfilePageClientProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const user = userProp || reduxUser;
  const currentUser = reduxUser;
  const { followers, following } = useSelector((state: RootState) => state.follow);
  const { suggested } = useSelector((state: RootState) => state.follow);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const hasFetchedProfile = React.useRef(false);

  // Force re-render when followers count changes
  const [followersCount, setFollowersCount] = useState(user?.followers?.length || 0);
  // Add local following count state
  const [followingCount, setFollowingCount] = useState(user?.following?.length || 0);
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
    updateFollowersCount(user?.followers?.length || 0);
  }, [user?.followers?.length, updateFollowersCount]);

  // Update following count when user data changes
  useEffect(() => {
    setFollowingCount(user?.following?.length || 0);
  }, [user?.following?.length]);

  // Profile edit form state
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    cover: user?.cover || '',
    skills: user?.skills || [],
    birthdate: user?.birthdate ? new Date(user.birthdate) : null,
    gender: user?.gender || null,
    city: user?.city || '',
    country: user?.country || '',
    socialLinks: user?.socialLinks || []
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        cover: user.cover || '',
        skills: user.skills || [],
        birthdate: user.birthdate ? new Date(user.birthdate) : null,
        gender: user.gender || null,
        city: user.city || '',
        country: user.country || '',
        socialLinks: user.socialLinks || []
      });
    }
  }, [user]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
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

  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const addSocialLink = () => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: '', url: '' }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateAvatar = async (url: string) => {
    try {
      setEditLoading(true);
      const payload = {
        ...editForm,
        avatar: url
      };
      
      await dispatch(updateProfile(payload)).unwrap();
      await dispatch(fetchProfile()); // Refresh user data
      
      // Update local form state
      setEditForm(prev => ({
        ...prev,
        avatar: url
      }));
    } catch (error: any) {
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
      await dispatch(fetchProfile()); // Refresh user data
      
      // Update local form state
      setEditForm(prev => ({
        ...prev,
        cover: url
      }));
    } catch (error: any) {
      console.error('Cover update error:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // Update handleEditSubmit to close dialog before API call
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    // Prepare data for API
    const payload = {
      ...editForm,
      birthdate: editForm.birthdate ? editForm.birthdate.toISOString().split('T')[0] : null,
    };

    console.log('Submitting profile update:', payload);
    
    // Close dialog immediately
    setEditDialogOpen(false);

    try {
      await dispatch(updateProfile(payload)).unwrap();
      await dispatch(fetchProfile()); // Refresh user data
    } catch (error: any) {
      console.error('Profile update error:', error);
      setEditError(error?.message || 'Failed to update profile');
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
        dispatch(fetchFollowing({ userId: user._id }));
      } else {
        // If viewing someone else's profile:
        // - Fetch their followers list (to see if we're in it)
        dispatch(fetchFollowers({ userId: user._id }));
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
        console.log('Fetching profile data...');
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
  
  // Update local isFollowing state when server state changes
  useEffect(() => {
    setIsFollowing(serverIsFollowing);
  }, [serverIsFollowing]);

  // Helper: get current user ID (should be the logged-in user's _id)
  const currentUserId = reduxUser?._id;
  // Helper: get following IDs for the logged-in user (for button state)
  const followingIds = useMemo(() => (reduxUser?.following ?? []), [reduxUser?.following]);
  // Helper: get following IDs for the profile user (for dialog user list)
  const profileFollowingIds = useMemo(() => (user?.following ?? []), [user?.following]);

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
        await dispatch(followUser(user._id)).unwrap();
        
        // Update local following state for the current user
        // This avoids needing to call fetchProfile() which causes re-renders
        if (reduxUser && !reduxUser.following?.includes(user._id)) {
          dispatch(updateFollowing([...(reduxUser.following || []), user._id]));
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
        await dispatch(unfollowUser(user._id)).unwrap();
        
        // Update local following state for the current user
        // This avoids needing to call fetchProfile() which causes re-renders
        if (reduxUser && reduxUser.following?.includes(user._id)) {
          dispatch(updateFollowing((reduxUser.following || []).filter((id: string) => id !== user._id)));
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
      dispatch(fetchFollowers({ userId: user._id, limit: 20, skip: 0 }));
    }
  };

  // Open following dialog and fetch first page
  const handleOpenFollowing = () => {
    setFollowingOpen(true);
    if (user?._id) {
      dispatch(fetchFollowing({ userId: user._id, limit: 20, skip: 0 }));
    }
  };

  // Load more followers
  const handleLoadMoreFollowers = () => {
    if (user?._id && followers.hasMore && !followers.loading) {
      dispatch(fetchFollowers({ userId: user._id, limit: followers.limit, skip: followers.skip }));
    }
  };

  // Load more following
  const handleLoadMoreFollowing = () => {
    if (user?._id && following.hasMore && !following.loading) {
      dispatch(fetchFollowing({ userId: user._id, limit: following.limit, skip: following.skip }));
    }
  };

  // Load more suggestions
  const handleLoadMoreSuggestions = () => {
    if (suggested.hasMore && !suggested.loading) {
      dispatch(fetchSuggestedUsers({ limit: suggested.limit, skip: suggested.skip }));
    }
  };

  // Close dialogs
  const handleCloseFollowers = () => {
    setFollowersOpen(false);
    dispatch(resetFollowers());
  };
  const handleCloseFollowing = () => {
    setFollowingOpen(false);
    dispatch(resetFollowing());
  };

  // Add state to track dialog follow/unfollow loading
  const [dialogFollowLoading, setDialogFollowLoading] = useState(false);

  // DRY follow/unfollow handler for dialogs
  const handleDialogFollowToggle = async (userObj: any, isFollowing: boolean) => {
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
        if (isFollowing && reduxUser.following?.includes(userObj._id)) {
          // Remove from following list
          dispatch(updateFollowing((reduxUser.following || []).filter((id: string) => id !== userObj._id)));
        } else if (!isFollowing && !reduxUser.following?.includes(userObj._id)) {
          // Add to following list
          dispatch(updateFollowing([...(reduxUser.following || []), userObj._id]));
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

  return (
    <div className='max-w-screen-lg mx-auto px-4'>
      <div className='space-y-4 w-full'>
        {authLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        ) : (
          <>
            <ProfileHeader
              user={user}
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
              onEditProfile={() => setEditDialogOpen(true)}
            />
            {/* Edit Profile Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogTitle>Edit Profile</DialogTitle>
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
                            {editForm.birthdate ? format(editForm.birthdate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={editForm.birthdate || undefined}
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
                          <SelectItem value="other">Other</SelectItem>
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

                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="space-y-3">
                      {editForm.socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Platform (e.g., Twitter)"
                              value={link.platform}
                              onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="URL"
                              value={link.url}
                              onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                            />
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
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSocialLink}
                        className="w-full mt-2"
                      >
                        Add Social Link
                      </Button>
                    </div>
                  </div>

                  {editError && <div className="text-red-500 text-sm">{editError}</div>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" disabled={editLoading}>
                      {editLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
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
              followingIds={followingIds}
              currentUserId={currentUserId}
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
              followingIds={followingIds}
              currentUserId={currentUserId}
              loadingButton={dialogFollowLoading}
              emptyText='Not following anyone yet.'
              userLink
            />
            <div className='grid grid-cols-16 gap-4'>
              <div className='hidden md:block col-span-5'>
                <Card className='w-full dark:border-0 shadow-none'>
                  <CardHeader>
                    <CardTitle  className='text-xl font-bold mb-3' >About me</CardTitle>
                      <p className='text-sm'>
                        {user?.bio || 'No bio yet'}
                      </p>
                    <div className='flex flex-row mt-4'>
                        <span className='text-sm text-muted-foreground w-19'>City</span>
                        <span className='text-sm'>
                          {user?.city || 'No city yet'}
                        </span>
                    </div>
                    <div className='flex flex-row'>
                        <span className='text-sm text-muted-foreground w-19'>Country</span>
                        <span className='text-sm'>
                            {user?.country || 'No country yet'}
                        </span>
                    </div>
                    <div className='flex flex-row'>
                        <span className='text-sm text-muted-foreground w-19'>Age</span>
                        <span className='text-sm'>
                          {user?.birthdate ? calculateAge(user.birthdate) : 'No age yet'}
                        </span>
                    </div>
                  </CardHeader>
                </Card>
                {user?.skills?.length > 0 && (
                  <div className='mt-8'>
                    <h4 className='mb-4 text-2xl font-bold'>Skills</h4>
                  <div className='flex flex-wrap gap-2'>
                    {/* loop through user skills */}
                    {user?.skills?.map((skill: string, index: number) => (
                      <span key={index} className='bg-card border dark:border-0 px-3 py-1 rounded-full text-sm'>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className='col-span-12 md:col-span-11'>
                <PostsProfile userId={user?._id} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePageClient; 