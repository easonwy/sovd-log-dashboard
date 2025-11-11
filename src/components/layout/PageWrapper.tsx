import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

/**
 * A structural component that provides the overall page layout.
 * It ensures a consistent flexbox structure with a non-scrolling
 * header and footer, and a scrollable main content area.
 */
export const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans">
      {children}
    </div>
  );
};