'use client'

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { updateProfile } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SocialLinksForm from './SocialLinksForm';
import { SOCIAL_PLATFORMS, SocialLink } from './socialPlatforms';

interface EditForm {
  firstName: string;
  lastName: string;
  bio: string;
  skills: string[];
  birthdate: Date | null;
  gender: string | null;
  city: string;
  country: string;
  socialLinks: SocialLink[];
}

const UserInfoForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  // Form state
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    bio: '',
    skills: [],
    birthdate: null,
    gender: null,
    city: '',
    country: '',
    socialLinks: []
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      // Map social links to ensure they have proper platform values
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
          return link;
        } else if (link.title) {
          // If platform doesn't exist but we have a title, try to find a matching platform
          const matchingPlatform = SOCIAL_PLATFORMS.find(
            p => p.label.toLowerCase() === link.title?.toLowerCase()
          );
          
          if (matchingPlatform) {
            return {
              ...link,
              platform: matchingPlatform.value
            };
          }
        }
        
        return link;
      });
      
      setEditForm({
        firstName: String(user.firstName || ''),
        lastName: String(user.lastName || ''),
        bio: String(user.bio || ''),
        skills: Array.isArray(user.skills) ? user.skills : [],
        birthdate: user.birthdate && typeof user.birthdate === 'string' ? new Date(user.birthdate) : null,
        gender: typeof user.gender === 'string' ? user.gender : null,
        city: String(user.city || ''),
        country: String(user.country || ''),
        socialLinks: mappedSocialLinks
      });
    }
  }, [user]);

  // Force update form when user data is available but form is not updated
  useEffect(() => {
    if (user && user.gender && !editForm.gender) {
      setEditForm(prev => ({ ...prev, gender: typeof user.gender === 'string' ? user.gender : null }));
    }
  }, [user?.gender, editForm.gender]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Prevent spaces in firstName and lastName fields
    if (name === 'firstName' || name === 'lastName') {
      const valueWithoutSpaces = value.replace(/\s/g, '');
      setEditForm(prev => ({ ...prev, [name]: valueWithoutSpaces }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

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

  const handleSocialLinksChange = (newSocialLinks: SocialLink[]) => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: newSocialLinks
    }));
  };

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check if there's text in the skill input that hasn't been added yet
    if (skillInput.trim()) {
      setError("Please press Enter to add the skill you typed, or clear the input field");
      setLoading(false);
      return;
    }

    // Validate social links URLs
    const invalidLinks = editForm.socialLinks.filter(
      link => link.platform && link.url && !isValidUrl(link.url)
    );

    if (invalidLinks.length > 0) {
      setError("Please enter valid URLs for your social links (must start with http:// or https://)");
      setLoading(false);
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
    
    const payload = {
      ...editForm,
      socialLinks: filteredSocialLinks,
      birthdate: birthdateValue,
    };

    try {
      await dispatch(updateProfile(payload)).unwrap();
      
      toast.success('Profile updated successfully!', {
        duration: 3000,
        description: 'Your profile information has been saved.'
      });
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Failed to update profile';
      setError(errorMessage);
      
      toast.error('Failed to update profile', {
        duration: 5000,
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" key={`user-form-${user?._id}-${editForm.gender}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={editForm.firstName}
            onChange={handleInputChange}
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
            onChange={handleInputChange}
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
          onChange={handleInputChange}
          placeholder="Tell us about yourself"
          rows={3}
        />
      </div>

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
                className="text-primary hover:text-primary/80 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleAddSkill}
          placeholder="Type a skill and press Enter"
        />
        <p className="text-sm text-muted-foreground">
          Press Enter to add a skill
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthdate">Birthdate</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="birthdate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !editForm.birthdate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editForm.birthdate && !isNaN(editForm.birthdate.getTime()) ? 
                  format(editForm.birthdate, "PPP") : 
                  <span>Pick a date</span>
                }
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
            key={`gender-select-${editForm.gender}-${user?._id}`}
            value={editForm.gender || ""}
            onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
          >
            <SelectTrigger id="gender" className="w-100">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={editForm.city}
            onChange={handleInputChange}
            placeholder="Enter your city"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={editForm.country}
            onChange={handleInputChange}
            placeholder="Enter your country"
          />
        </div>
      </div>

      <SocialLinksForm
        socialLinks={editForm.socialLinks}
        onSocialLinksChange={handleSocialLinksChange}
        error={error}
      />

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default UserInfoForm;
