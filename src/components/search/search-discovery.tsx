"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { FilterChips } from "@/components/search/filter-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

type FilterOption = {
  slug: string;
  name: string;
  count?: number;
};

interface SearchDiscoveryProps {
  categories: FilterOption[];
  tags?: FilterOption[];
  defaultQuery?: string;
  selectedCategory?: string;
  selectedTag?: string;
  selectedPopularity?: "latest" | "trending" | "most_viewed";
  resultCount?: number;
  variant?: "home" | "search";
  className?: string;
}

const sortOptions = [
  { value: "latest", label: "الأحدث" },
  { value: "trending", label: "الأكثر تداولًا" },
  { value: "most_viewed", label: "الأكثر قراءة" },
] as const;

export function SearchDiscovery({
  categories,
  tags = [],
  defaultQuery = "",
  selectedCategory,
  selectedTag,
  selectedPopularity = "latest",
  resultCount,
  variant = "home",
  className,
}: SearchDiscoveryProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const debouncedQuery = useDebouncedValue(query, 450);
  const hasMounted = useRef(false);
  const isSearchPage = variant === "search";

  const hasFilters = Boolean(
    defaultQuery.trim() ||
    selectedCategory ||
    selectedTag ||
    selectedPopularity !== "latest",
  );

  const buildHref = useMemo(
    () =>
      (
        overrides: {
          q?: string;
          category?: string | null;
          tag?: string | null;
          popularity?: "latest" | "trending" | "most_viewed";
        } = {},
      ) => {
        const params = new URLSearchParams();
        const nextQuery = "q" in overrides ? (overrides.q ?? "") : query;
        const nextCategory =
          "category" in overrides ? overrides.category : selectedCategory;
        const nextTag = "tag" in overrides ? overrides.tag : selectedTag;
        const nextPopularity =
          "popularity" in overrides ? overrides.popularity : selectedPopularity;

        if (nextQuery.trim()) {
          params.set("q", nextQuery.trim());
        }

        if (nextCategory) {
          params.set("category", nextCategory);
        }

        if (nextTag) {
          params.set("tag", nextTag);
        }

        if (nextPopularity && nextPopularity !== "latest") {
          params.set("popularity", nextPopularity);
        }

        const suffix = params.toString();
        return suffix ? `/search?${suffix}` : "/search";
      },
    [query, selectedCategory, selectedPopularity, selectedTag],
  );

  useEffect(() => {
    if (!isSearchPage) {
      return;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (debouncedQuery.trim() === defaultQuery.trim()) {
      return;
    }

    router.replace(buildHref({ q: debouncedQuery }));
  }, [buildHref, debouncedQuery, defaultQuery, isSearchPage, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildHref({ q: query }));
  };

  const updateFilter = (
    key: "category" | "tag" | "popularity",
    value?: string,
  ) => {
    router.push(
      buildHref({
        category:
          key === "category"
            ? value === selectedCategory
              ? null
              : value
            : selectedCategory,
        tag:
          key === "tag" ? (value === selectedTag ? null : value) : selectedTag,
        popularity:
          key === "popularity"
            ? (value as "latest" | "trending" | "most_viewed")
            : selectedPopularity,
      }),
    );
  };

  return (
    <section
      className={cn(
        "border-border/80 bg-card/95 shadow-card rounded-3xl border p-4 sm:p-5",
        className,
      )}
      aria-label="البحث والتصفية"
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="space-y-2 text-center">
          <p className="text-primary text-sm font-bold">بحث سريع</p>
          <h1 className="text-2xl leading-tight font-black sm:text-3xl">
            ابحث في المقالات والكتّاب
          </h1>
          {typeof resultCount === "number" ? (
            <p className="text-muted-foreground text-sm">
              {resultCount} نتيجة معروضة
            </p>
          ) : null}
        </div>

        <form
          role="search"
          aria-label="بحث في المنصة"
          className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row"
          onSubmit={handleSubmit}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="نص البحث"
              placeholder="عنوان، كاتب، وسم..."
              className="h-14 rounded-2xl pr-12 text-base"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 w-full sm:w-auto sm:min-w-28"
          >
            بحث
          </Button>
        </form>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <SlidersHorizontal className="size-4" />
              <span>الفلاتر</span>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/search")}
                className="min-h-10 w-full sm:w-auto"
              >
                <X className="size-4" />
                مسح الفلاتر
              </Button>
            ) : null}
          </div>

          <FilterChips
            label="الأقسام"
            options={categories}
            selectedValue={selectedCategory}
            allLabel="كل الأقسام"
            tone="primary"
            onSelect={(value) =>
              value
                ? updateFilter("category", value)
                : router.push(buildHref({ category: null }))
            }
          />

          {tags.length ? (
            <FilterChips
              label="الوسوم"
              options={tags.slice(0, 10)}
              selectedValue={selectedTag}
              prefix="#"
              tone="secondary"
              onSelect={(value) => updateFilter("tag", value ?? undefined)}
            />
          ) : null}

          {isSearchPage ? (
            <FilterChips
              label="الترتيب"
              options={sortOptions.map((option) => ({
                slug: option.value,
                name: option.label,
              }))}
              selectedValue={selectedPopularity}
              tone="accent"
              onSelect={(value) =>
                updateFilter(
                  "popularity",
                  (value ?? "latest") as "latest" | "trending" | "most_viewed",
                )
              }
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
