"use client";

import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateWriterApplicationStatus } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";

interface WriterRequestActionsProps {
  applicationId: string;
  status: string;
}

export function WriterRequestActions({
  applicationId,
  status,
}: WriterRequestActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isProcessed = status === "APPROVED" || status === "REJECTED";

  const runAction = (
    nextStatus: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
  ) => {
    const notes =
      nextStatus === "APPROVED"
        ? window.prompt("ملاحظة اختيارية للكاتب", "") || ""
        : window.prompt(
            nextStatus === "REJECTED"
              ? "سبب الرفض - اختياري"
              : "ما التعديلات المطلوبة من الكاتب؟",
            "",
          ) || "";

    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await updateWriterApplicationStatus({
        applicationId,
        status: nextStatus,
        notes,
      });
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:grid-cols-none sm:flex-wrap">
      <Button
        size="sm"
        disabled={isPending || isProcessed}
        onClick={() => runAction("APPROVED")}
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
        {isPending ? "جارٍ الحفظ..." : "قبول"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending || isProcessed}
        onClick={() => runAction("CHANGES_REQUESTED")}
        className="w-full sm:w-auto"
      >
        <RotateCcw className="size-4" />
        طلب تعديل
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending || isProcessed}
        onClick={() => runAction("REJECTED")}
        className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
      >
        <X className="size-4" />
        رفض
      </Button>
    </div>
  );
}
