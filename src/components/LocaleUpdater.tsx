'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export default function LocaleUpdater() {
  const locale = useLocale();

  useEffect(() => {
    // Update HTML attributes when locale changes
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return null;
}
