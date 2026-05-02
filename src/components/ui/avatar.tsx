/* eslint-disable @next/next/no-img-element */

import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");

  return (
    <div
      className={cn(
        "bg-muted text-primary relative flex size-12 items-center justify-center overflow-hidden rounded-full text-sm font-bold",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
