import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/home/article-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAuthorBySlug } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author || author.loadError) {
    return buildMetadata({
      title: "الكاتب",
      description: "تعذر تحميل البيانات حاليًا",
      path: `/authors/${slug}`,
    });
  }

  return buildMetadata({
    title: author.name,
    description:
      author.bio || author.profile?.headline || `صفحة الكاتب ${author.name}`,
    path: `/authors/${slug}`,
    image: author.image || undefined,
  });
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (author?.loadError) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16 text-center md:px-6">
        <Card className="space-y-3 p-8">
          <h1 className="text-2xl font-black">تعذر تحميل البيانات حاليًا</h1>
          <p className="text-muted-foreground text-sm leading-7">
            يرجى المحاولة لاحقًا.
          </p>
        </Card>
      </div>
    );
  }

  if (!author) {
    notFound();
  }

  const expertise = (
    Array.isArray(author.profile?.expertise) ? author.profile.expertise : []
  ) as string[];
  const authoredArticles = (author.authoredArticles || []) as Array<
    Record<string, any>
  >;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-6">
      <Card className="grid gap-6 md:grid-cols-[0.3fr_1fr] md:items-center">
        <Avatar name={author.name} src={author.image} className="size-24" />
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-black">{author.name}</h1>
            <p className="text-muted-foreground text-lg">
              {author.specialty || author.profile?.headline}
            </p>
          </div>
          <p className="text-muted-foreground text-sm leading-8">
            {author.bio}
          </p>
          <div className="flex flex-wrap gap-2">
            {expertise.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {authoredArticles.map((article) => (
          <ArticleCard
            key={String(article.id ?? article.slug)}
            article={article}
          />
        ))}
      </div>
    </div>
  );
}
