'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useParams } from 'next/navigation'

interface RtlContextType {
  isRtl: boolean
  dir: 'rtl' | 'ltr'
}

const RtlContext = createContext<RtlContextType | undefined>(undefined)

export function useRtl() {
  const context = useContext(RtlContext)
  if (context === undefined) {
    throw new Error('useRtl must be used within a RtlProvider')
  }
  return context
}

interface RtlProviderProps {
  children: ReactNode
}

export function RtlProvider({ children }: RtlProviderProps) {
  const params = useParams()
  const locale = params?.locale as string
  const isRtl = locale === 'ar'
  const dir = isRtl ? 'rtl' : 'ltr'

  return (
    <RtlContext.Provider value={{ isRtl, dir }}>
      {children}
    </RtlContext.Provider>
  )
} 