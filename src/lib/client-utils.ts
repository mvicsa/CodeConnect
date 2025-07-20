'use client';

import { useParams } from 'next/navigation';

// RTL support utilities
export function useIsRtl() {
  const params = useParams();
  const locale = params?.locale as string;
  return locale === 'ar';
}

// Function to conditionally flip CSS properties for RTL
export function flipRtl(ltrValue: string, rtlValue: string, isRtl: boolean) {
  return isRtl ? rtlValue : ltrValue;
}

// Function to add RTL specific classes
export function rtlClass(ltrClasses: string, rtlClasses: string, isRtl: boolean) {
  return isRtl ? rtlClasses : ltrClasses;
} 