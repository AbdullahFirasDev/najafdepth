import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getSafeImageSrc } from "@/lib/utils";

interface CategoryGridProps {
  categories: ReadonlyArray<Record<string, any>>;
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) {
    return (
      <p className="border-border bg-card/80 rounded-2xl border p-6 text-center text-sm text-muted-foreground">
        لا توجد أقسام بعد.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={String(category.id ?? category.slug)}
          href={`/categories/${String(category.slug ?? "")}`}
          className="focus-visible:ring-ring group block rounded-2xl focus-visible:outline-none focus-visible:ring-2"
        >
          <Card className="relative min-h-56 overflow-hidden rounded-2xl p-0 sm:min-h-64">
            <div className="absolute inset-0">
              <Image
                src={getSafeImageSrc(
                  String(category.coverImage ?? ""),
                  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=80",
                )}
                alt={String(category.name ?? "")}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/38 to-transparent" />
            <div className="relative flex h-full flex-col justify-end gap-3 p-4 text-white sm:p-5">
              <span
                className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: String(category.color ?? "#6B4423") }}
              >
                {Number(category._count?.articles ?? 0)} مقال
              </span>
              <div className="space-y-2">
                <h3 className="text-xl font-bold sm:text-2xl">
                  {String(category.name ?? "")}
                </h3>
                <p className="line-clamp-2 text-sm leading-7 text-white/82">
                  {String(category.description ?? "")}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
