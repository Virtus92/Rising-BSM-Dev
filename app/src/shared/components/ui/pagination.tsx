import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { cn } from "@/shared/utils/cn"
import { ButtonProps, Button, buttonVariants } from "@/shared/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  href?: string
} & Pick<ButtonProps, "size"> &
  Omit<React.ComponentProps<typeof Button>, "href">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  href,
  children,
  ...props
}: PaginationLinkProps) => {
  // Simple direct rendering of either anchor or button
  // This avoids any nesting issues with buttons inside buttons
  const commonClassNames = cn(
    buttonVariants({
      variant: isActive ? "outline" : "ghost",
      size,
    }),
    "w-9 h-9",
    isActive && "bg-accent pointer-events-none",
    className
  );
  
  const ariaCurrent = isActive ? "page" : undefined;
  
  if (href) {
    // Only pass specific props that are valid for anchor tags
    return (
      <a
        href={href}
        className={commonClassNames}
        aria-current={ariaCurrent}
        aria-label={props["aria-label"]}
      >
        {children}
      </a>
    );
  }
  
  return (
    <button
      type="button"
      className={commonClassNames}
      aria-current={ariaCurrent}
      {...props}
    >
      {children}
    </button>
  );
}
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationFirst = ({
  className,
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to first page"
    size="icon"
    className={cn("", className)}
    {...props}
  >
    <ChevronsLeft className="h-4 w-4" />
  </PaginationLink>
)
PaginationFirst.displayName = "PaginationFirst"

const PaginationLast = ({
  className,
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to last page"
    size="icon"
    className={cn("", className)}
    {...props}
  >
    <ChevronsRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationLast.displayName = "PaginationLast"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
}
