"use client";

import { LoaderCircle, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteArticle, setFeaturedArticle } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";

interface ArticleDashboardActionsProps {
  articleId: string;
  isFeatured: boolean;
  canFeature: boolean;
  canDelete: boolean;
}

export function ArticleDashboardActions({
  articleId,
  isFeatured,
  canFeature,
  canDelete,
}: ArticleDashboardActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleFeatured = () => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await setFeaturedArticle({
        articleId,
        featured: !isFeatured,
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

  const removeArticle = () => {
    if (!window.confirm("هل تريد حذف هذا المقال نهائياً؟")) {
      return;
    }

    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحذف...");
      const result = await deleteArticle(articleId);
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
      {canFeature ? (
        <Button
          type="button"
          size="sm"
          variant={isFeatured ? "default" : "outline"}
          disabled={isPending}
          onClick={toggleFeatured}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Star className="size-4" />
          )}
          {isFeatured ? "مميز" : "تعيين كمميز"}
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={removeArticle}
          className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
        >
          <Trash2 className="size-4" />
          حذف
        </Button>
      ) : null}
    </div>
  );
}
