"use client";

import { LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { dashboardNavigation, siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RoleKey } from "@/types";

interface DashboardSidebarProps {
  role: RoleKey;
}

const navigationAccess: Record<string, RoleKey[]> = {
  "/dashboard/users": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/settings": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/writer-requests": ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  "/dashboard/comments": ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  "/dashboard/categories": ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  "/dashboard/tags": ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  "/dashboard/analytics": ["SUPER_ADMIN", "ADMIN", "EDITOR"],
};

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const visibleNavigation = dashboardNavigation.filter((item) => {
    const allowedRoles = navigationAccess[item.href];
    return !allowedRoles || allowedRoles.includes(role);
  });

  const activeItem =
    visibleNavigation.find((item) =>
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? visibleNavigation[0];

  const renderLink = (item: (typeof visibleNavigation)[number]) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        onClick={() => setIsOpen(false)}
        className={cn(
          "focus-visible:ring-ring flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
          isActive
            ? "bg-primary text-primary-foreground shadow-soft"
            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
        )}
      >
        {item.title}
      </Link>
    );
  };

  return (
    <aside className="border-border/70 bg-card/85 shadow-card rounded-2xl border p-3 md:sticky md:top-24 md:h-fit md:p-4">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
            <LayoutDashboard className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-black">{siteConfig.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {activeItem?.title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="border-border bg-background/80 focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
          aria-label="فتح تنقل لوحة التحكم"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <div className="hidden md:block">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
            <LayoutDashboard className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-black">{siteConfig.name}</p>
            <p className="text-muted-foreground text-sm">لوحة الإدارة</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2" aria-label="تنقل لوحة التحكم">
          {visibleNavigation.map(renderLink)}
        </nav>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="إغلاق تنقل لوحة التحكم"
            onClick={() => setIsOpen(false)}
          />
          <div className="bg-card shadow-soft absolute inset-y-0 right-0 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <LayoutDashboard className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black">{siteConfig.name}</p>
                  <p className="text-muted-foreground text-sm">لوحة الإدارة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="border-border bg-background/80 focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
                aria-label="إغلاق تنقل لوحة التحكم"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="grid gap-2" aria-label="تنقل لوحة التحكم">
              {visibleNavigation.map(renderLink)}
            </nav>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
