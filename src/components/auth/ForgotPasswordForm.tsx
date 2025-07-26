'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState } from 'react';
import axios from '@/lib/axios';
import { isAxiosError } from "axios"

// Validation function
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

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setValidationError(null);

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email and we will send you a link to reset your password.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            value={email}
            onChange={handleEmailChange}
            className={validationError ? 'border-red-500 focus:border-red-500' : ''}
          />
          {validationError && (
            <div className="flex items-start gap-2 p-2 text-xs text-red-500 border border-red-500 rounded-md">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
        {message && (
          <div className="flex items-start gap-2 p-3 text-primary text-primary border border-primary rounded-md">
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
          {loading ? 'Sending...' : 'Send reset link'}
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