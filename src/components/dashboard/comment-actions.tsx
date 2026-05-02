"use client";

import { Check, LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteComment, moderateComment } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";

interface CommentActionsProps {
  commentId: string;
}

export function CommentActions({ commentId }: CommentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = (status: "APPROVED" | "REJECTED" | "SPAM") => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await moderateComment({ commentId, status });
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  const runDelete = () => {
    if (!window.confirm("هل تريد حذف التعليق نهائياً؟")) {
      return;
    }

    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحذف...");
      const result = await deleteComment(commentId);
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
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => runAction("APPROVED")}
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
        {isPending ? "جارٍ الحفظ..." : "اعتماد"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => runAction("REJECTED")}
        className="w-full sm:w-auto"
      >
        <X className="size-4" />
        إخفاء
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => runAction("SPAM")}
        className="w-full sm:w-auto"
      >
        سبام
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={runDelete}
        className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
      >
        <Trash2 className="size-4" />
        حذف
      </Button>
    </div>
  );
}
