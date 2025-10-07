'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import { isAxiosError } from "axios"

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

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setValidationErrors({});

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setValidationErrors(prev => ({ ...prev, password: passwordError }));
      setLoading(false);
      return;
    }

    // Validate confirm password
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/auth/reset-password', { 
        token, 
        password 
      });
      setMessage(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'password' | 'confirmPassword', value: string, setter: (value: string) => void) => {
    setter(value);
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-muted-foreground text-sm text-balance">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="flex items-start gap-2 p-3 text-sm text-red-500 border border-red-500 rounded-md">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Invalid reset link. Please request a new password reset.</span>
        </div>
        <div className="text-center">
          <Link href="/forgotpassword" className="underline underline-offset-4">
            Request new password reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your new password below.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={e => handleInputChange('password', e.target.value, setPassword)}
            className={validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}
          />
          {validationErrors.password && (
            <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{validationErrors.password}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            required 
            value={confirmPassword}
            onChange={e => handleInputChange('confirmPassword', e.target.value, setConfirmPassword)}
            className={validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}
          />
          {validationErrors.confirmPassword && (
            <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{validationErrors.confirmPassword}</span>
            </div>
          )}
        </div>
        {message && (
          <div className="flex items-start gap-2 p-3 text-sm text-primary border border-primary rounded-md">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-red-500 border border-red-500 rounded-md">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </div>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    </form>
  )
} 