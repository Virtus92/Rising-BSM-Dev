'use client';

import React from 'react';
import { Button, ButtonProps } from '@/shared/components/ui/button';
import { PermissionIndicator } from '@/shared/components/permissions/PermissionIndicator';
import { actionPermissions, ActionConfig } from '@/shared/components/permissions/RoleConfig';
import * as Icons from 'lucide-react';
import { getIconComponent } from '@/shared/utils/icon-utils';

type PermissionButtonProps = ButtonProps & {
  /**
   * The permission required to see this button
   */
  permission: string;
  
  /**
   * Icon to display (from Lucide icons)
   */
  icon?: keyof typeof Icons;
  
  /**
   * Children content
   */
  children?: React.ReactNode;
  
  /**
   * Whether to show the button in disabled state when permission is missing
   */
  showWhenDisabled?: boolean;
};

/**
 * Button that only appears when the user has the required permission
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  icon,
  children,
  showWhenDisabled = false,
  ...props
}) => {
  // Use our new utility for type-safe icon handling
  const IconComponent = getIconComponent(icon);
  
  return (
    <PermissionIndicator 
      permission={permission}
      showDisabled={showWhenDisabled}
      tooltipMessage={`You need the ${permission} permission to perform this action`}
    >
      <Button {...props}>
        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
        {children}
      </Button>
    </PermissionIndicator>
  );
};

type ActionButtonsProps = {
  /**
   * The area of the application (e.g., 'customers', 'appointments', etc.)
   */
  area: string;
  
  /**
   * Only show specific actions from this area
   */
  include?: string[];
  
  /**
   * Exclude specific actions from this area
   */
  exclude?: string[];
  
  /**
   * Callback for when an action button is clicked
   */
  onAction?: (action: string) => void;
  
  /**
   * Button size
   */
  size?: ButtonProps['size'];
  
  /**
   * Additional class for the container
   */
  className?: string;
};

/**
 * Renders a group of permission-aware action buttons for a specific area
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  area,
  include,
  exclude,
  onAction,
  size = 'sm',
  className,
}) => {
  // Get actions for the current area
  const actions = actionPermissions[area] || [];
  
  // Filter actions based on include/exclude
  const filteredActions = actions.filter(action => {
    if (include && !include.includes(action.name.toLowerCase())) {
      return false;
    }
    if (exclude && exclude.includes(action.name.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  if (filteredActions.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {filteredActions.map((action) => (
        <PermissionButton
          key={action.name}
          permission={action.permission}
          icon={action.icon as keyof typeof Icons}
          variant={action.variant || 'outline'}
          size={size}
          onClick={onAction ? () => onAction(action.name.toLowerCase()) : undefined}
        >
          {action.name}
        </PermissionButton>
      ))}
    </div>
  );
};