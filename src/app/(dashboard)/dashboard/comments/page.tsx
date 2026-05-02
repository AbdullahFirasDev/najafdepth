import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentActions } from "@/components/dashboard/comment-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { canManageComments } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const session = await auth();
  if (!session?.user || !canManageComments(session)) {
    notFound();
  }

  const comments = await prisma.comment
    .findMany({
      include: {
        author: true,
        article: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    .catch(() => []);

  const records = comments as Array<Record<string, any>>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black sm:text-3xl">مراجعة التعليقات</h2>
        <p className="text-muted-foreground text-sm">
          اعتماد التعليقات أو إخفاؤها أو حذفها مع عرض المقال والمستخدم
          المرتبطين.
        </p>
      </div>
      <div className="space-y-4">
        {records.length ? (
          records.map((comment) => (
            <Card
              key={String(comment.id)}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold">
                      {String(comment.author?.name ?? "")}
                    </h3>
                    <Badge variant="outline">{String(comment.status)}</Badge>
                    <Badge>{Number(comment.likesCount ?? 0)} likes</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    على مقال:{" "}
                    {comment.article?.slug ? (
                      <Link
                        className="hover:text-primary underline-offset-4 hover:underline"
                        href={`/articles/${String(comment.article.slug)}`}
                      >
                        {String(comment.article.title ?? "")}
                      </Link>
                    ) : (
                      String(comment.article?.title ?? "")
                    )}{" "}
                    - {formatDate(comment.createdAt)}
                  </p>
                </div>
                <CommentActions commentId={String(comment.id)} />
              </div>
              <p className="text-muted-foreground text-sm leading-8">
                {String(comment.content)}
              </p>
            </Card>
          ))
        ) : (
          <Card className="text-muted-foreground text-center text-sm">
            لا توجد تعليقات للمراجعة.
          </Card>
        )}
      </div>
    </div>
  );
}
