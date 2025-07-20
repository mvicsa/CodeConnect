import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Server-side RTL utility
export function getDirection(locale: string) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}