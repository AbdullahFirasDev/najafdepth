import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "border-border bg-input placeholder:text-muted-foreground focus:border-primary focus:ring-ring/20 flex h-12 w-full rounded-2xl border px-4 py-2 text-sm transition-all outline-none focus:ring-2",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
