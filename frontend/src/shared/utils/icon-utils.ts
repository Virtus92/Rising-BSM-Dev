import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

// Create a type-safe utility function to get icons
export function getIconComponent(iconName?: keyof typeof LucideIcons): React.FC<LucideProps> | undefined {
  if (!iconName) return undefined;
  
  // Type assertion needed because TypeScript can't infer that this is a React component
  return LucideIcons[iconName] as React.FC<LucideProps>;
}