import React, { ReactNode } from 'react';

interface ScrollAreaProps {
  className?: string;
  children?: ReactNode;
}

/**
 * ScrollArea component that provides a consistent scrollable container with a customizable scrollbar
 */
export const ScrollArea: React.FC<ScrollAreaProps> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={className} style={{ overflowY: 'auto' }}>
      {children}
    </div>
  );
};