import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import readingTime from "reading-time";
import sanitizeHtml from "sanitize-html";
import slugify from "slugify";
import { twMerge } from "tailwind-merge";

import { isSafeImageSrc } from "@/lib/image-safety";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("ar-IQ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatCompactDate(date: string | Date) {
  return format(new Date(date), "dd MMMM yyyy", { locale: arSA });
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-IQ").format(value);
}

export function absoluteUrl(path: string) {
  const baseUrl = process.env.SITE_URL || "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

export function sanitizeArticleHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "blockquote",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "class"],
      a: ["href", "name", "target", "rel"],
      blockquote: ["class"],
    },
    allowedSchemes: ["http", "https", "data", "mailto"],
  });
}

export function getSafeImageSrc(
  input: string | null | undefined,
  fallback: string,
) {
  return isSafeImageSrc(input) ? String(input) : fallback;
}

export function estimateReadingTime(content: string) {
  return Math.max(1, Math.ceil(readingTime(content).minutes));
}

export function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, locale: "ar" });
}

export function truncate(input: string, maxLength = 160) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, Math.max(0, maxLength - 3))}...`;
}
