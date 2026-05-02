"use client";

import { Bookmark, Heart, LoaderCircle, Printer, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import {
  toggleArticleBookmark,
  toggleArticleLike,
} from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";

interface ArticleActionsProps {
  slug: string;
  likes: number;
  bookmarks: number;
}

export function ArticleActions({
  slug,
  likes,
  bookmarks,
}: ArticleActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticCounts, updateOptimisticCounts] = useOptimistic(
    { likes, bookmarks },
    (
      state,
      update: { type: "like" | "bookmark"; delta: 1 | -1 },
    ) => ({
      ...state,
      [update.type === "like" ? "likes" : "bookmarks"]: Math.max(
        0,
        state[update.type === "like" ? "likes" : "bookmarks"] + update.delta,
      ),
    }),
  );

  const runLike = () => {
    updateOptimisticCounts({ type: "like", delta: 1 });
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await toggleArticleLike(slug);
      toast.dismiss(loadingToast);

      if (!result.success) {
        updateOptimisticCounts({ type: "like", delta: -1 });
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  const runBookmark = () => {
    updateOptimisticCounts({ type: "bookmark", delta: 1 });
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await toggleArticleBookmark(slug);
      toast.dismiss(loadingToast);

      if (!result.success) {
        updateOptimisticCounts({ type: "bookmark", delta: -1 });
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" disabled={isPending} onClick={runBookmark}>
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Bookmark className="size-4" />
        )}
        {optimisticCounts.bookmarks} حفظ
      </Button>
      <Button variant="outline" disabled={isPending} onClick={runLike}>
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Heart className="size-4" />
        )}
        {optimisticCounts.likes} إعجاب
      </Button>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        طباعة
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          const url = `${window.location.origin}/articles/${slug}`;
          await navigator.clipboard.writeText(url);
          toast.success("تم نسخ رابط المقال للمشاركة.");
        }}
      >
        <Share2 className="size-4" />
        مشاركة
      </Button>
    </div>
  );
}
