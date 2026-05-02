import Link from "next/link";
import { PenSquare } from "lucide-react";

import { DesktopSiteNav } from "@/components/layout/desktop-site-nav";
import { MobileSiteNav } from "@/components/layout/mobile-site-nav";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { siteConfig } from "@/lib/constants";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-border/60 bg-background/95 sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2"
        >
          <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-black md:size-11">
            ع
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black md:text-lg">
              {siteConfig.name}
            </p>
            <p className="text-muted-foreground hidden text-xs sm:block">
              منصة ثقافية عربية
            </p>
          </div>
        </Link>

        <DesktopSiteNav />

        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />
          {session?.user ? (
            <Button asChild variant="outline">
              <Link href="/dashboard">لوحة التحكم</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/sign-in">تسجيل الدخول</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/dashboard/articles/new">
              <PenSquare className="size-4" />
              إنشاء مقال
            </Link>
          </Button>
        </div>

        <MobileSiteNav isAuthenticated={Boolean(session?.user)} />
      </div>
    </header>
  );
}
