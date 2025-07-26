'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { SocialAuthDivider } from "@/components/auth/SocialAuthDivider"
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { register, githubLogin } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { useRouter } from 'next/navigation';

// Validation functions
const validateName = (value: string, fieldName: string): string | null => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  
  if (value !== value.trim()) {
    return `${fieldName} cannot have leading or trailing spaces`;
  }
  
  if (value.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  
  if (value.length > 50) {
    return `${fieldName} cannot exceed 50 characters`;
  }
  
  if (/\d/.test(value)) {
    return `${fieldName} cannot contain numbers`;
  }
  
  if (!/^[a-zA-Z\s\-']+$/.test(value)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  
  if (/^[^a-zA-Z]+$/.test(value)) {
    return `${fieldName} cannot be only special characters`;
  }
  
  return null;
};

const validateLastName = (value: string): string | null => {
  if (!value.trim()) {
    return 'Last name is required';
  }
  
  if (value !== value.trim()) {
    return 'Last name cannot have leading or trailing spaces';
  }
  
  if (value.trim().length < 2) {
    return 'Last name must be at least 2 characters long';
  }
  
  if (value.length > 150) {
    return 'Last name cannot exceed 150 characters';
  }
  
  if (/\d/.test(value)) {
    return 'Last name cannot contain numbers';
  }
  
  if (!/^[a-zA-Z\s\-']+$/.test(value)) {
    return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  if (/^[^a-zA-Z]+$/.test(value)) {
    return 'Last name cannot be only special characters';
  }
  
  return null;
};

const validateUsername = (value: string): string | null => {
  if (!value.trim()) {
    return 'Username is required';
  }
  
  if (value !== value.trim()) {
    return 'Username cannot have leading or trailing spaces';
  }
  
  if (value.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }
  
  if (value.length > 30) {
    return 'Username cannot exceed 30 characters';
  }
  
  if (/\s/.test(value)) {
    return 'Username cannot contain spaces';
  }
  
  if (value.length === 1 && /^\d$/.test(value)) {
    return 'Username cannot be a single number';
  }
  
  if (/^\d+$/.test(value)) {
    return 'Username cannot be only numbers';
  }
  
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value)) {
    return 'Username cannot contain Arabic characters';
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  
  if (/^[^a-zA-Z0-9]+$/.test(value)) {
    return 'Username cannot be only special characters';
  }
  
  return null;
};

const validateEmail = (value: string): string | null => {
  if (!value.trim()) {
    return 'Email is required';
  }
  
  if (value.toLowerCase().startsWith('mailto:')) {
    return 'Please enter a valid email address';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

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

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error, user } = useSelector((state: RootState) => state.auth);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    const firstNameError = validateName(firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateLastName(lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;
    
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setValidationErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    await dispatch(register({ firstName, lastName, username, email, password }));
  };

  const handleGitHubLogin = () => {
    dispatch(githubLogin());
  };

  const handleInputChange = (field: keyof ValidationErrors, value: string, setter: (value: string) => void) => {
    setter(value);
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your details below to register
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              type="text" 
              placeholder="First name" 
              required 
              value={firstName} 
              onChange={e => handleInputChange('firstName', e.target.value, setFirstName)}
              className={validationErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}
            />
            {validationErrors.firstName && (
              <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{validationErrors.firstName}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              type="text" 
              placeholder="Last name" 
              required 
              value={lastName} 
              onChange={e => handleInputChange('lastName', e.target.value, setLastName)}
              className={validationErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}
            />
            {validationErrors.lastName && (
              <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{validationErrors.lastName}</span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input 
            id="username" 
            type="text" 
            placeholder="yourusername" 
            required 
            value={username} 
            onChange={e => handleInputChange('username', e.target.value, setUsername)}
            className={validationErrors.username ? 'border-red-500 focus:border-red-500' : ''}
          />
          {validationErrors.username && (
            <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{validationErrors.username}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            value={email} 
            onChange={e => handleInputChange('email', e.target.value, setEmail)}
            className={validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
          />
          {validationErrors.email && (
            <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{validationErrors.email}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm Password</Label>
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
        {(localError || error) && (
          <div className="flex items-start gap-2 p-3 text-sm text-red-500 border border-red-500 rounded-md">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
        <SocialAuthDivider />
        <Button variant="outline" className="w-full" type="button" onClick={handleGitHubLogin} disabled={loading}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          Register with GitHub
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </form>
  )
} 