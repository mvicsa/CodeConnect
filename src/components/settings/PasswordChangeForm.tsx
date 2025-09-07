'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import { getAuthToken } from '@/lib/cookies';
import { isAxiosError } from 'axios';

// Validation functions
const validatePassword = (value: string): string | null => {
  if (!value.trim()) {
    return 'Password is required';
  }
  
  if (value.trim().length === 0) {
    return 'Password cannot be only spaces';
  }
  
  if (value.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  if (value.length > 20) {
    return 'Password cannot exceed 20 characters';
  }
  
  return null;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword.trim()) {
    return 'Please confirm your password';
  }
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return null;
};

interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const PasswordChangeForm = () => {
  const [formData, setFormData] = useState<PasswordChangeFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleInputChange = (field: keyof PasswordChangeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear global error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate current password
    if (!formData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    // Validate new password
    const newPasswordError = validatePassword(formData.newPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }
    
    // Check if new password is different from current password
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    // Validate confirm password
    const confirmPasswordError = validateConfirmPassword(formData.newPassword, formData.confirmPassword);
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully!', {
        duration: 3000,
        description: 'Your password has been updated.'
      });
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (err) {
      console.error('Password change error:', err);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (isAxiosError(err)) {
        if (err.response?.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid current password';
        } else if (err.response?.status === 401) {
          errorMessage = 'Current password is incorrect';
        } else {
          errorMessage = err.response?.data?.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      
      toast.error('Failed to change password', {
        duration: 5000,
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPasswords.currentPassword ? "text" : "password"}
            value={formData.currentPassword}
            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
            placeholder="Enter your current password"
            className={validationErrors.currentPassword ? "border-red-500" : ""}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('currentPassword')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords.currentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {validationErrors.currentPassword && (
          <p className="text-sm text-red-500">{validationErrors.currentPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.newPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            placeholder="Enter your new password"
            className={validationErrors.newPassword ? "border-red-500" : ""}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('newPassword')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords.newPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {validationErrors.newPassword && (
          <p className="text-sm text-red-500">{validationErrors.newPassword}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Password must be 6-20 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your new password"
            className={validationErrors.confirmPassword ? "border-red-500" : ""}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirmPassword')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords.confirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {validationErrors.confirmPassword && (
          <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Changing Password...' : 'Change Password'}
      </Button>
    </form>
  );
};

export default PasswordChangeForm;
