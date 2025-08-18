import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Server-side RTL utility
export function getDirection(locale: string) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function formatTime(dateString: string): string {
    try {
        if (!dateString) {
            return 'Unknown time';
        }
        let date: Date;
        if (!isNaN(Number(dateString))) {
            date = new Date(Number(dateString));
        } else {
            date = new Date(dateString);
        }
        if (isNaN(date.getTime())) {
            return 'Unknown time';
        }
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        if (diffInMs < 0) {
            return 'Just now';
        }
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    } catch {
        return 'Unknown time';
    }
}

export function totalTimeSpent(totalTimeSpent: number): string {
    const totalTimeSpentInSeconds = Math.round(totalTimeSpent / 1000);
    if (totalTimeSpentInSeconds < 60) {
        return `${totalTimeSpentInSeconds}s`;
    } else if (totalTimeSpentInSeconds < 3600) {
        return `${Math.round(totalTimeSpentInSeconds / 60)}m ${totalTimeSpentInSeconds % 60}s`;
    } else {
        return `${Math.round(totalTimeSpentInSeconds / 3600)}h ${Math.round((totalTimeSpentInSeconds % 3600) / 60)}m ${totalTimeSpentInSeconds % 60}s`;
    }
}