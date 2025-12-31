import type { Metadata } from 'next';
import React from 'react';
import Providers from './providers';
import '../index.css';

export const metadata: Metadata = {
  title: 'Log Dashboard',
  description: 'Real-time log streaming and analysis dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
