export type RoleKey = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "WRITER" | "READER";

export interface NavItem {
  title: string;
  href: string;
}

export interface SearchFilters {
  author?: string;
  category?: string;
  date?: string;
  popularity?: "latest" | "trending" | "most_viewed";
  tag?: string;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  category: string;
}

export interface DashboardMetric {
  title: string;
  value: string;
  description: string;
  delta: string;
}

export interface ArticleSourceLink {
  title: string;
  url: string;
}

export interface HomepageHeroSetting {
  isActive: boolean;
  eyebrow?: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
}
