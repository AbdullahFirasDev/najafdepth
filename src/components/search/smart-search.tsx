"use client";

import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchSuggestion } from "@/types";

interface SmartSearchProps {
  defaultValue?: string;
}

export function SmartSearch({ defaultValue = "" }: SmartSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const deferredQuery = useDeferredValue(query);
  const debouncedQuery = useDebouncedValue(deferredQuery, 250);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      return;
    }

    const controller = new AbortController();

    void fetch(
      `/api/search?q=${encodeURIComponent(debouncedQuery)}&suggest=1`,
      {
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const payload = (await response.json()) as {
          suggestions: SearchSuggestion[];
        };
        setSuggestions(payload.suggestions);
        setIsOpen(true);
      })
      .catch(() => {
        setSuggestions([]);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);

            if (!nextValue.trim()) {
              setSuggestions([]);
              setIsOpen(false);
            }
          }}
          placeholder="ابحث عن مقال، كاتب، وسم، أو فكرة..."
          className="h-14 rounded-full pr-12"
          onFocus={() => setIsOpen(suggestions.length > 0)}
        />
      </div>

      {isOpen && suggestions.length > 0 ? (
        <div className="border-border bg-card shadow-card absolute inset-x-0 top-16 z-30 rounded-[1.75rem] border p-3">
          <div className="text-primary mb-2 flex items-center gap-2 px-2 text-xs font-semibold">
            <Sparkles className="size-4" />
            اقتراحات ذكية
          </div>
          <div className="space-y-1">
            {suggestions.map((item) => (
              <Link
                key={item.id}
                href={`/articles/${item.slug}`}
                className="hover:bg-muted/30 flex flex-col rounded-2xl px-3 py-3 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="font-semibold">{item.title}</span>
                <span className="text-muted-foreground text-sm">
                  {item.category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
