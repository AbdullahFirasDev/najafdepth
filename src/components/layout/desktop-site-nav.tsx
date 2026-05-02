"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNavigation } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DesktopSiteNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
      {mainNavigation.map((item) => {
        const itemPath = item.href.split("#")[0].split("?")[0] || "/";
        const isHashLink = item.href.includes("#");
        const isActive =
          isHashLink
            ? false
            : itemPath === "/"
            ? pathname === "/"
            : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
