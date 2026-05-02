import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { ArticleActions } from "@/components/articles/article-actions";
import { CommentList } from "@/components/articles/comment-list";
import { RichTextRenderer } from "@/components/articles/rich-text-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getArticleBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { formatDate, formatNumber, getSafeImageSrc } from "@/lib/utils";
import type { ArticleSourceLink } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  return buildMetadata({
    title: article.title,
    description: article.excerpt || article.subtitle || article.title,
    path: `/articles/${slug}`,
    image: article.coverImage || undefined,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const tags = (article.tags || []) as Array<Record<string, any>>;
  const comments = ((article.comments || []) as Array<Record<string, any>>).map(
    (comment) => ({
      id: String(comment.id),
      content: String(comment.content ?? ""),
      createdAt: comment.createdAt as string | Date,
      author: {
        name: String(comment.author?.name ?? "قارئ"),
        image: comment.author?.image ? String(comment.author.image) : null,
      },
    }),
  );
  const sources = Array.isArray(article.sources)
    ? (article.sources as ArticleSourceLink[])
    : [];

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-5 md:px-6 md:py-8">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{article.category?.name ?? "مقال"}</Badge>
          {tags.map((entry) => (
            <Badge key={entry.tag?.slug ?? entry.tag?.name} variant="outline">
              {entry.tag?.name}
            </Badge>
          ))}
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl leading-tight font-black sm:text-4xl md:text-5xl">
            {article.title}
          </h1>
          <p className="text-muted-foreground text-base leading-8 md:text-lg">
            {article.subtitle || article.excerpt}
          </p>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          <span>{article.author?.name ?? "هيئة التحرير"}</span>
          <span aria-hidden="true">•</span>
          <span>
            {article.publishedAt
              ? formatDate(article.publishedAt)
              : "قيد التحرير"}
          </span>
          <span aria-hidden="true">•</span>
          <span>{article.readingTimeMinutes ?? 5} دقائق قراءة</span>
          <span aria-hidden="true">•</span>
          <span>{formatNumber(article.viewsCount ?? 0)} مشاهدة</span>
        </div>
      </header>

      <div className="border-border relative aspect-[16/10] overflow-hidden rounded-2xl border sm:aspect-[16/8]">
        <Image
          src={getSafeImageSrc(
            article.coverImage,
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1400&q=80",
          )}
          alt={article.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(220px,0.28fr)]">
        <div className="min-w-0 space-y-7">
          <ArticleActions
            slug={article.slug}
            likes={article.likesCount ?? 0}
            bookmarks={article.bookmarksCount ?? 0}
          />
          {article.quote ? (
            <Card className="text-primary bg-primary/5 text-base leading-8 font-bold sm:text-lg">
              {article.quote}
            </Card>
          ) : null}
          <RichTextRenderer content={article.contentHtml} />

          {sources.length ? (
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">المصادر</h2>
              <Card className="space-y-3">
                {sources.map((source, index) => (
                  <a
                    key={`${source.url}-${index}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border-border/70 hover:bg-muted/20 focus-visible:ring-ring block rounded-2xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2"
                  >
                    <p className="text-foreground font-semibold">
                      {source.title}
                    </p>
                    <p className="text-muted-foreground mt-1 break-all text-sm" dir="ltr">
                      {source.url}
                    </p>
                  </a>
                ))}
              </Card>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/api/articles/${article.slug}/pdf`}>تحميل PDF</Link>
            </Button>
          </div>

          <CommentList comments={comments} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <Card className="space-y-3">
            <h2 className="text-lg font-bold">عن المقال</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">القسم</dt>
                <dd className="font-semibold">
                  {article.category?.name ?? "مقال"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">الكاتب</dt>
                <dd className="font-semibold">
                  {article.author?.name ?? "هيئة التحرير"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">التفاعل</dt>
                <dd className="font-semibold">
                  {formatNumber(article.likesCount ?? 0)} إعجاب
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </article>
  );
}
