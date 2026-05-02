import { notFound } from "next/navigation";

import { UserManagementPanel } from "@/components/dashboard/user-management-panel";
import { auth } from "@/lib/auth";
import { canManageUsers, isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { RoleKey } from "@/types";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || !canManageUsers(session)) {
    notFound();
  }

  const users = await prisma.user
    .findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isActive: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black sm:text-3xl">المستخدمون</h2>
        <p className="text-muted-foreground text-sm">
          إدارة الحسابات والأدوار وحالة الوصول مع حماية حسابات الإدارة العليا.
        </p>
      </div>

      <UserManagementPanel
        currentUserId={session.user.id}
        canAssignSuperAdmin={isSuperAdmin(session)}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          isActive: user.isActive,
          role: user.role.name as RoleKey,
        }))}
      />
    </div>
  );
}
