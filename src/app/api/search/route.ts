import { NextResponse } from "next/server";

import { searchArticles } from "@/lib/meilisearch";
import { checkRequestRateLimit } from "@/lib/request-security";

function normalizeArabicQuery(input: string) {
  return input
    .trim()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F]/g, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function GET(request: Request) {
  const rate = checkRequestRateLimit(request, "search", 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "تم تجاوز عدد طلبات البحث المسموح." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") ?? "";
  const query = normalizeArabicQuery(rawQuery).slice(0, 120);

  if (!query) {
    return NextResponse.json({ suggestions: [], results: [] });
  }

  const categoryParam = searchParams.get("category") ?? undefined;
  const category =
    categoryParam && /^[a-z0-9-]{2,80}$/i.test(categoryParam)
      ? categoryParam
      : undefined;
  const suggestOnly = searchParams.get("suggest") === "1";
  const results = await searchArticles(query, { category }).catch((error) => {
    console.error("Data load failed", {
      route: "api/search",
      purpose: "search suggestions and results",
      message: getErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    return [];
  });

  const suggestions = results.slice(0, 5).map((item) => ({
    id: String(item.id),
    title: String(item.title),
    slug: String(item.slug),
    category: String(item.category ?? "مقالة"),
  }));

  return NextResponse.json({
    suggestions,
    results: suggestOnly ? [] : results,
    normalizedQuery: query,
    spellingCorrection: rawQuery === query ? null : query,
  });
}
