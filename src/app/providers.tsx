'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '@/i18n/I18nProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
