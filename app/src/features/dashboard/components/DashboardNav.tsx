'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { MenuSection, dashboardNavigation } from '@/shared/components/permissions/RoleConfig';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { PermissionIndicator } from '@/shared/components/permissions/PermissionIndicator';
import * as Icons from 'lucide-react';
import { UserRole } from '@/domain/enums/UserEnums';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { getIconComponent } from '@/shared/utils/icon-utils';

// Interface for navigation item
interface NavigationItemProps {
  name: string;
  path: string;
  icon?: string; // Make icon optional to match MenuItem
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  permission?: string | string[];
  children?: NavigationItemProps[];
}

/**
 * Main dashboard navigation that displays menu items based on user role and permissions
 */
export function DashboardNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  if (!user) return null;
  
  // Default to user role if somehow the user object doesn't have a role
  const userRole = user.role || UserRole.USER;
  
  // Get navigation config for the user's role - ensuring we have a valid UserRole
  const userRoleEnum = Object.values(UserRole).includes(userRole as UserRole) ? 
    userRole as UserRole : 
    UserRole.USER;
    
  const navigation = dashboardNavigation[userRoleEnum] || dashboardNavigation[UserRole.USER];
  
  return (
    <ScrollArea className="h-[calc(100vh-14rem)] px-1">
      <div className="space-y-6 py-2">
        {navigation.map((section: MenuSection, i: number) => (
          <NavigationSection key={i} section={section} pathname={pathname} />
        ))}
      </div>
    </ScrollArea>
  );
}

function NavigationSection({ section, pathname }: { section: MenuSection; pathname: string }) {
  return (
    <div className="px-3 py-2">
      <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
        {section.title}
      </h3>
      <div className="space-y-1">
        {section.items.map((item, index) => (
          <div key={index}>
            {/* Use PermissionIndicator to conditionally render menu items based on permissions */}
            <PermissionIndicator
              permission={typeof item.permission === 'string' ? item.permission : ''}
              anyPermission={Array.isArray(item.permission) ? item.permission : undefined}
            >
              <NavigationItem item={item} pathname={pathname} />
            </PermissionIndicator>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavigationItem({ item, pathname }: { item: NavigationItemProps; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
  
  // Use our new utility for type-safe icon handling
  const IconComponent = getIconComponent(item.icon as keyof typeof Icons) || Icons.Circle;

  if (item.children) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-between px-2", 
              isActive && "bg-accent font-medium"
            )}
          >
            <span className="flex items-center">
              <IconComponent className="mr-2 h-4 w-4" />
              {item.name}
            </span>
            <Icons.ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform", 
                isOpen && "rotate-90"
              )} 
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-1">
          {item.children.map((child: NavigationItemProps, index: number) => (
            <PermissionIndicator
              key={index}
              permission={typeof child.permission === 'string' ? child.permission : ''}
              anyPermission={Array.isArray(child.permission) ? child.permission : undefined}
            >
              <NavigationItem item={child} pathname={pathname} />
            </PermissionIndicator>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link href={item.path} className={cn("block")}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start px-2", 
          isActive && "bg-accent font-medium"
        )}
      >
        <IconComponent className="mr-2 h-4 w-4" />
        <span>{item.name}</span>
        {item.badge && (
          <span className={cn(
            "ml-auto inline-flex h-5 items-center justify-center rounded-full px-2 text-xs",
            item.badge.variant === "default" ? "bg-primary text-primary-foreground" :
            item.badge.variant === "secondary" ? "bg-secondary text-secondary-foreground" :
            item.badge.variant === "destructive" ? "bg-destructive text-destructive-foreground" :
            "bg-muted text-muted-foreground"
          )}>
            {item.badge.text}
          </span>
        )}
      </Button>
    </Link>
  );
}