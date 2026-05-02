"use client";

import { LoaderCircle, Save, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteUser, upsertUser } from "@/actions/platform-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoleKey } from "@/types";

const roleOptions: Array<{ value: RoleKey; label: string }> = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "WRITER", label: "Writer" },
  { value: "READER", label: "Reader" },
];

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  status: string;
  isActive: boolean;
};

interface UserManagementPanelProps {
  users: UserRecord[];
  currentUserId: string;
  canAssignSuperAdmin: boolean;
}

function runWithToast(
  startTransition: ReturnType<typeof useTransition>[1],
  action: () => Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }>,
  onSuccess: () => void,
) {
  startTransition(async () => {
    const loadingToast = toast.loading("جارٍ الحفظ...");
    const result = await action();
    toast.dismiss(loadingToast);

    if (!result.success) {
      toast.error(result.errors?.[0] ?? result.message ?? "حدث خطأ");
      return;
    }

    toast.success(result.message);
    onSuccess();
  });
}

export function UserManagementPanel({
  users,
  currentUserId,
  canAssignSuperAdmin,
}: UserManagementPanelProps) {
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "READER" as RoleKey,
    password: "",
    isActive: true,
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runWithToast(
      startCreateTransition,
      () => upsertUser(createForm),
      () => {
        setCreateForm({
          name: "",
          email: "",
          role: "READER",
          password: "",
          isActive: true,
        });
        router.refresh();
      },
    );
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <form className="grid gap-4 lg:grid-cols-5" onSubmit={handleCreate}>
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="new-user-name">الاسم</Label>
            <Input
              id="new-user-name"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="new-user-email">البريد</Label>
            <Input
              id="new-user-email"
              dir="ltr"
              type="email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-role">الدور</Label>
            <select
              id="new-user-role"
              className="border-border bg-input h-12 w-full rounded-2xl border px-4 text-sm outline-none"
              value={createForm.role}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  role: event.target.value as RoleKey,
                }))
              }
            >
              {roleOptions.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                  disabled={
                    role.value === "SUPER_ADMIN" && !canAssignSuperAdmin
                  }
                >
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-password">كلمة المرور</Label>
            <Input
              id="new-user-password"
              type="password"
              value={createForm.password}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  password: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={isCreating}>
              {isCreating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {isCreating ? "جارٍ الحفظ..." : "إنشاء مستخدم"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {users.length ? (
          users.map((user) => (
            <UserEditor
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              canAssignSuperAdmin={canAssignSuperAdmin}
            />
          ))
        ) : (
          <Card className="text-muted-foreground text-center text-sm">
            لا توجد حسابات مطابقة.
          </Card>
        )}
      </div>
    </div>
  );
}

function UserEditor({
  user,
  currentUserId,
  canAssignSuperAdmin,
}: {
  user: UserRecord;
  currentUserId: string;
  canAssignSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    password: "",
    isActive: user.isActive,
  });
  const isSelf = user.id === currentUserId;
  const isLockedSuperAdmin =
    user.role === "SUPER_ADMIN" && !canAssignSuperAdmin;

  const handleSave = () => {
    runWithToast(
      startTransition,
      () => upsertUser(form),
      () => router.refresh(),
    );
  };

  const handleDelete = () => {
    if (!window.confirm("هل تريد حذف هذا المستخدم نهائياً؟")) {
      return;
    }

    runWithToast(
      startTransition,
      () => deleteUser(user.id),
      () => router.refresh(),
    );
  };

  return (
    <Card className="space-y-4 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="font-bold">{user.name}</h3>
          <Badge>{user.role}</Badge>
          <Badge variant={user.isActive ? "default" : "outline"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">{user.status}</Badge>
        </div>
        <div
          className="text-muted-foreground min-w-0 text-sm break-all"
          dir="ltr"
        >
          {user.email}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor={`name-${user.id}`}>الاسم</Label>
          <Input
            id={`name-${user.id}`}
            disabled={isLockedSuperAdmin}
            value={form.name}
            onChange={(event) =>
              setForm((value) => ({ ...value, name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`email-${user.id}`}>البريد</Label>
          <Input
            id={`email-${user.id}`}
            dir="ltr"
            type="email"
            disabled={isLockedSuperAdmin}
            value={form.email}
            onChange={(event) =>
              setForm((value) => ({ ...value, email: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`role-${user.id}`}>الدور</Label>
          <select
            id={`role-${user.id}`}
            className="border-border bg-input h-12 w-full rounded-2xl border px-4 text-sm outline-none"
            disabled={isLockedSuperAdmin}
            value={form.role}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                role: event.target.value as RoleKey,
              }))
            }
          >
            {roleOptions.map((role) => (
              <option
                key={role.value}
                value={role.value}
                disabled={role.value === "SUPER_ADMIN" && !canAssignSuperAdmin}
              >
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`password-${user.id}`}>كلمة مرور جديدة</Label>
          <Input
            id={`password-${user.id}`}
            type="password"
            disabled={isLockedSuperAdmin}
            value={form.password}
            onChange={(event) =>
              setForm((value) => ({ ...value, password: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <label className="border-border bg-input flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
          <input
            type="checkbox"
            disabled={isLockedSuperAdmin}
            checked={form.isActive}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                isActive: event.target.checked,
              }))
            }
          />
          الحساب مفعّل
        </label>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            size="sm"
            disabled={isPending || isLockedSuperAdmin}
            onClick={handleSave}
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending || isSelf || isLockedSuperAdmin}
            onClick={handleDelete}
            className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        </div>
      </div>
    </Card>
  );
}
