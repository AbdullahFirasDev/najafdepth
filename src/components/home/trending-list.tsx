import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface TrendingListProps {
  articles: ReadonlyArray<Record<string, any>>;
}

export function TrendingList({ articles }: TrendingListProps) {
  return (
    <Card className="h-full rounded-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold sm:text-2xl">الأكثر قراءة</h3>
        <Badge variant="accent">اتجاهات</Badge>
      </div>
      {articles.length ? (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <Link
              key={String(article.id ?? article.slug)}
              href={`/articles/${String(article.slug ?? "")}`}
              className="border-border/70 hover:border-primary/30 hover:bg-muted/20 focus-visible:ring-ring flex items-start gap-3 rounded-2xl border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 sm:px-4"
            >
              <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                {index + 1}
              </div>
              <div className="min-w-0 space-y-2">
                <Badge variant="outline" className="w-fit max-w-full truncate">
                  {String(article.category?.name ?? "مقال")}
                </Badge>
                <h4 className="line-clamp-2 text-sm leading-7 font-bold sm:text-base">
                  {String(article.title ?? "")}
                </h4>
                <p className="text-muted-foreground text-xs">
                  {formatNumber(Number(article.viewsCount ?? 0))} قراءة
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-2xl border p-5 text-center text-sm">
          لا توجد نتائج
        </p>
      )}
    </Card>
  );
}
