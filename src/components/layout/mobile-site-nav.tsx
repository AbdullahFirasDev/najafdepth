"use client";

import Link from "next/link";
import { Home, LayoutGrid, Search, UserCircle, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { ModeToggle } from "@/components/layout/mode-toggle";
import { cn } from "@/lib/utils";

interface MobileSiteNavProps {
  isAuthenticated: boolean;
}

export function MobileSiteNav({ isAuthenticated }: MobileSiteNavProps) {
  const pathname = usePathname();
  const accountHref = isAuthenticated ? "/dashboard" : "/sign-in";
  const items = [
    { title: "الرئيسية", href: "/", icon: Home },
    { title: "الأقسام", href: "/#categories", icon: LayoutGrid },
    { title: "البحث", href: "/search", icon: Search },
    { title: "الكتّاب", href: "/authors/sara-almousawi", icon: Users },
    { title: "حسابي", href: accountHref, icon: UserCircle },
  ];

  return (
    <>
      <div className="md:hidden">
        <ModeToggle />
      </div>

      <nav
        className="border-border/70 bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-12px_28px_rgba(40,24,12,0.12)] backdrop-blur-xl md:hidden"
        aria-label="التنقل السفلي"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
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
                  "focus-visible:ring-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
