import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "border-border bg-input placeholder:text-muted-foreground focus:border-primary focus:ring-ring/20 flex min-h-32 w-full rounded-[1.5rem] border px-4 py-3 text-sm transition-all outline-none focus:ring-2",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
