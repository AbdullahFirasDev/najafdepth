"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setUserActive } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";

interface UserStatusToggleProps {
  userId: string;
  isActive: boolean;
}

export function UserStatusToggle({ userId, isActive }: UserStatusToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={isActive ? "outline" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const loadingToast = toast.loading("جارٍ الحفظ...");
          const result = await setUserActive({ userId, isActive: !isActive });
          toast.dismiss(loadingToast);

          if (!result.success) {
            toast.error(result.message);
            return;
          }

          toast.success(result.message);
          router.refresh();
        })
      }
    >
      {isPending ? "جارٍ الحفظ..." : isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
    </Button>
  );
}
