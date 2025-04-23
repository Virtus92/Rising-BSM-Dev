import React, { ReactNode, useState } from 'react';

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children?: ReactNode;
}

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children?: ReactNode;
}

interface CollapsibleContentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Collapsible component for toggling visibility of content
 */
export const Collapsible: React.FC<CollapsibleProps> = ({ 
  open, 
  onOpenChange, 
  className, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(open || false);

  // Update internal state when props change
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  return <div className={className}>{children}</div>;
};

/**
 * Trigger component for the Collapsible
 */
export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ 
  asChild, 
  children 
}) => {
  return <div style={{ cursor: 'pointer' }}>{children}</div>;
};

/**
 * Content component for the Collapsible
 */
export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ 
  className, 
  children 
}) => {
  return <div className={className}>{children}</div>;
};