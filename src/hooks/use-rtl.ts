'use client'

import { useRtl } from '@/components/RtlProvider'

interface RtlHelpers {
  isRtl: boolean
  dir: 'rtl' | 'ltr'
  margin: (start: string, end: string) => string
  padding: (start: string, end: string) => string
  inset: (start: string, end: string) => string
  float: (direction: 'start' | 'end') => 'left' | 'right'
  rotate: (degree: number) => number
  flipClass: (ltrClass: string, rtlClass: string) => string
}

export function useRtlHelpers(): RtlHelpers {
  const { isRtl, dir } = useRtl()
  
  return {
    isRtl,
    dir,
    
    // For margin utilities
    margin: (start: string, end: string) => {
      return isRtl ? `me-${start} ms-${end}` : `ms-${start} me-${end}`
    },
    
    // For padding utilities
    padding: (start: string, end: string) => {
      return isRtl ? `pe-${start} ps-${end}` : `ps-${start} pe-${end}`
    },
    
    // For positioning utilities
    inset: (start: string, end: string) => {
      return isRtl ? `end-${start} start-${end}` : `start-${start} end-${end}`
    },
    
    // For float utilities
    float: (direction: 'start' | 'end') => {
      if (direction === 'start') {
        return isRtl ? 'right' : 'left'
      }
      return isRtl ? 'left' : 'right'
    },
    
    // For rotation utilities
    rotate: (degree: number) => {
      return isRtl ? -degree : degree
    },
    
    // For class name utilities
    flipClass: (ltrClass: string, rtlClass: string) => {
      return isRtl ? rtlClass : ltrClass
    }
  }
} 