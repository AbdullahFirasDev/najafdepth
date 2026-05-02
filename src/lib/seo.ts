import type { Metadata } from "next";

import { siteConfig } from "@/lib/constants";
import { absoluteUrl, truncate } from "@/lib/utils";

interface MetadataInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
}: MetadataInput = {}): Metadata {
  const resolvedTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.name;
  const resolvedDescription = truncate(description, 155);
  const resolvedImage = image ?? absoluteUrl(siteConfig.ogImage);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: absoluteUrl(path),
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      locale: "ar_IQ",
      type: "website",
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  };
}
