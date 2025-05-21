import * as React from "react";

import { cn } from "@/shared/utils/cn";

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        className
      )}
      {...props}
    />
  );
});
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
