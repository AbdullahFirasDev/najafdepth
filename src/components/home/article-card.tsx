import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, getSafeImageSrc } from "@/lib/utils";

interface ArticleCardProps {
  article: Record<string, any>;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const slug = String(article.slug ?? "");
  const title = String(article.title ?? "مقال");
  const excerpt = article.excerpt
    ? String(article.excerpt)
    : article.subtitle
      ? String(article.subtitle)
      : "";
  const coverImage = getSafeImageSrc(
    article.coverImage ? String(article.coverImage) : null,
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80",
  );
  const categoryName = article.category?.name
    ? String(article.category.name)
    : "مقال";
  const authorName = article.author?.name
    ? String(article.author.name)
    : "هيئة التحرير";
  const readingTimeMinutes = Number(article.readingTimeMinutes ?? 5);
  const publishedAt = article.publishedAt
    ? formatDate(article.publishedAt)
    : "حديثًا";

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl p-0">
      <Link
        href={`/articles/${slug}`}
        aria-label={`قراءة ${title}`}
        className="relative block aspect-[16/10] overflow-hidden bg-muted/30"
      >
        <Image
          src={coverImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className="max-w-full truncate">{categoryName}</Badge>
          <time className="text-muted-foreground text-xs">{publishedAt}</time>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-lg leading-8 font-bold sm:text-xl">
            <Link
              href={`/articles/${slug}`}
              className="hover:text-primary focus-visible:ring-ring rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              {title}
            </Link>
          </h3>
          {excerpt ? (
            <p className="text-muted-foreground line-clamp-3 text-sm leading-7">
              {excerpt}
            </p>
          ) : null}
        </div>

        <div className="text-muted-foreground flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="max-w-[12rem] truncate">{authorName}</span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-4" />
              {readingTimeMinutes} د
            </span>
          </div>
          <Link
            href={`/articles/${slug}`}
            className="text-primary inline-flex min-h-10 items-center gap-2 font-semibold"
          >
            قراءة
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
