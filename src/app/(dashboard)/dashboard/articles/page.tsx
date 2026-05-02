import Link from "next/link";
import { Eye, FilePenLine, MessageSquareMore, Plus } from "lucide-react";

import { ArticleReviewActions } from "@/components/articles/article-review-actions";
import { ArticleDashboardActions } from "@/components/dashboard/article-dashboard-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { articleStatuses } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  canDeleteArticle,
  canEditArticle,
  canManageFeaturedArticles,
  canModerateContent,
} from "@/lib/permissions";
import { formatCompactDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabelMap = Object.fromEntries(
  articleStatuses.map((status) => [status.value, status.label]),
) as Record<string, string>;

export default async function DashboardArticlesPage() {
  const session = await auth();
  const isModerator = canModerateContent(session);
  const userId = session?.user.id;

  const articles = await prisma.article
    .findMany({
      where: isModerator ? undefined : { authorId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
        excerpt: true,
        status: true,
        reviewNotes: true,
        viewsCount: true,
        likesCount: true,
        featured: true,
        featuredRank: true,
        updatedAt: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
          },
        },
        author: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div className="border-border/70 bg-card/80 shadow-card flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">المقالات</h2>
          <p className="text-muted-foreground text-sm">
            {isModerator
              ? "إدارة جميع المقالات ومراجعتها واعتمادها أو إعادتها للكاتب."
              : "مساحة الكاتب لإدارة المقالات الحالية وإرسالها للمراجعة."}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/articles/new">
            <Plus className="size-4" />
            مقال جديد
          </Link>
        </Button>
      </div>

      {articles.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {articles.map((article) => (
            <Card key={article.id} className="space-y-5 overflow-hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{article.category?.name ?? "غير مصنف"}</Badge>
                    <Badge variant="outline">
                      {statusLabelMap[article.status] ?? article.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl leading-8 font-bold sm:text-2xl sm:leading-9">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 text-sm leading-8">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">
                  آخر تحديث: {formatCompactDate(article.updatedAt)}
                </div>
              </div>

              <div className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-border/70 bg-muted/15 rounded-[1.5rem] border px-4 py-3">
                  <p className="mb-1 text-xs">الكاتب</p>
                  <p className="text-foreground font-semibold">
                    {article.author?.name ?? "هيئة التحرير"}
                  </p>
                </div>
                <div className="border-border/70 bg-muted/15 rounded-[1.5rem] border px-4 py-3">
                  <p className="mb-1 text-xs">المشاهدات</p>
                  <p className="text-foreground font-semibold">
                    {formatNumber(article.viewsCount)}
                  </p>
                </div>
                <div className="border-border/70 bg-muted/15 rounded-[1.5rem] border px-4 py-3">
                  <p className="mb-1 text-xs">التعليقات</p>
                  <p className="text-foreground font-semibold">
                    {formatNumber(article._count.comments)}
                  </p>
                </div>
                <div className="border-border/70 bg-muted/15 rounded-[1.5rem] border px-4 py-3">
                  <p className="mb-1 text-xs">الإعجابات</p>
                  <p className="text-foreground font-semibold">
                    {formatNumber(article.likesCount)}
                  </p>
                </div>
              </div>

              {article.reviewNotes ? (
                <div className="border-primary/15 bg-primary/5 text-muted-foreground rounded-[1.5rem] border px-4 py-3 text-sm leading-8">
                  <span className="text-primary font-semibold">
                    ملاحظات المراجعة:
                  </span>{" "}
                  {article.reviewNotes}
                </div>
              ) : null}

              <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                {canEditArticle(session, article) ? (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Link href={`/dashboard/articles/${article.id}/edit`}>
                      <FilePenLine className="size-4" />
                      تعديل
                    </Link>
                  </Button>
                ) : null}
                {article.publishedAt ? (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Link href={`/articles/${article.slug}`} target="_blank">
                      <Eye className="size-4" />
                      عرض المقال
                    </Link>
                  </Button>
                ) : null}
                <div className="bg-muted/30 text-muted-foreground inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm sm:justify-start">
                  <MessageSquareMore className="size-4" />
                  {article.publishedAt
                    ? `منشور في ${formatCompactDate(article.publishedAt)}`
                    : "لم يُنشر بعد"}
                </div>
                <ArticleDashboardActions
                  articleId={article.id}
                  isFeatured={Boolean(article.featured || article.featuredRank)}
                  canFeature={
                    canManageFeaturedArticles(session) &&
                    article.status === "PUBLISHED"
                  }
                  canDelete={canDeleteArticle(session, article)}
                />
              </div>

              {isModerator ? (
                <ArticleReviewActions
                  articleId={article.id}
                  initialNotes={article.reviewNotes}
                />
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-muted-foreground p-8 text-center text-sm leading-8">
          لا توجد مقالات بعد. ابدأ بإنشاء أول مقال من زر المقال الجديد.
        </Card>
      )}
    </div>
  );
}
