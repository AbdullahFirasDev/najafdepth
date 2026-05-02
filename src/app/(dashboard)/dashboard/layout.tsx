import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (
    !session?.user ||
    !session.user.isActive ||
    session.user.status !== "ACTIVE" ||
    !canAccessDashboard(session)
  ) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 overflow-x-hidden px-3 py-3 sm:px-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6 md:px-6 md:py-6">
      <DashboardSidebar role={session.user.role} />
      <div className="min-w-0 space-y-5 overflow-hidden">
        <div className="border-border/70 bg-card/85 shadow-card flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="min-w-0">
            <h1 className="text-xl font-black sm:text-2xl">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm leading-7">
              مرحبًا {session.user.name}. يمكنك إدارة المحتوى من هنا.
            </p>
          </div>
          <div className="grid w-full sm:w-auto">
            <SignOutButton />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
