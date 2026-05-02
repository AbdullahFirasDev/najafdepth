import { ArticleCard } from "@/components/home/article-card";
import { SearchDiscovery } from "@/components/search/search-discovery";
import { Card } from "@/components/ui/card";
import { getHomepageData, getSearchPageData } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "البحث",
  path: "/search",
  description: "بحث متقدم في المقالات والكتّاب والأقسام.",
});

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const author = typeof params.author === "string" ? params.author : undefined;
  const popularity =
    typeof params.popularity === "string" ? params.popularity : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;

  const [results, homepageData] = await Promise.all([
    getSearchPageData(query, {
      category,
      author,
      popularity: popularity as
        | "latest"
        | "trending"
        | "most_viewed"
        | undefined,
      tag,
    }),
    getHomepageData(),
  ]);

  const searchResults = (results || []) as Array<Record<string, any>>;
  const latestArticles = (homepageData.latestArticles || []) as Array<
    Record<string, any>
  >;
  const categories = (homepageData.categories || []) as Array<
    Record<string, any>
  >;
  const tagOptions = Array.from(
    new Map(
      latestArticles.flatMap((article) =>
        (article.tags || []).map((entry: any) => [
          entry.tag?.slug ?? "",
          { slug: entry.tag?.slug ?? "", name: entry.tag?.name ?? "" },
        ]),
      ),
    ).values(),
  ).filter((item: any) => item.slug && item.name) as Array<{
    slug: string;
    name: string;
  }>;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-5 md:px-6 md:py-8">
      <SearchDiscovery
        key={`${query}-${category ?? ""}-${tag ?? ""}-${popularity ?? ""}`}
        variant="search"
        defaultQuery={query}
        selectedCategory={category}
        selectedTag={tag}
        selectedPopularity={
          popularity === "trending" || popularity === "most_viewed"
            ? popularity
            : "latest"
        }
        resultCount={searchResults.length}
        categories={categories
          .filter((item) => item.slug && item.name)
          .map((item) => ({
            slug: String(item.slug),
            name: String(item.name),
            count: Number(item._count?.articles ?? 0),
          }))}
        tags={tagOptions}
      />

      <section className="space-y-4" aria-label="نتائج البحث">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">نتائج البحث</h2>
            <p className="text-muted-foreground text-sm">
              يتم تحديث النتائج عند تغيير البحث أو الفلاتر.
            </p>
          </div>
        </div>

        {searchResults.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((article) => (
              <ArticleCard
                key={String(article.id ?? article.slug)}
                article={article}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-bold">لم يتم العثور على نتائج مطابقة</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-7">
              جرّب كلمات أقل أو أزل بعض الفلاتر.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
