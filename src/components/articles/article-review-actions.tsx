"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { reviewArticle } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ArticleReviewActionsProps {
  articleId: string;
  initialNotes?: string | null;
}

export function ArticleReviewActions({
  articleId,
  initialNotes,
}: ArticleReviewActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  const handleReview = (
    status: "APPROVED" | "NEEDS_REVISION" | "REJECTED" | "PUBLISHED",
  ) => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await reviewArticle({
        articleId,
        status,
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
    <div className="border-border/80 bg-muted/15 space-y-3 rounded-[1.5rem] border p-4">
      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="bg-background min-h-24"
        placeholder="ملاحظات المراجعة أو طلب التعديلات - اختياري"
      />
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleReview("APPROVED")}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          اعتماد
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => handleReview("PUBLISHED")}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          نشر مباشر
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleReview("NEEDS_REVISION")}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          طلب تعديل
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleReview("REJECTED")}
          disabled={isPending}
          className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <XCircle className="size-4" />
          )}
          رفض
        </Button>
      </div>
    </div>
  );
}
