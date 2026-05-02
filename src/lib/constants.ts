import type { NavItem } from "@/types";

export const siteConfig = {
  name: "العمق النجفي",
  description: "منصة عربية للنشر الثقافي والتحرير المعرفي.",
  url: process.env.SITE_URL || "http://localhost:3000",
  ogImage: "/og-cover.png",
  slogan: "معرفة واضحة، وتحرير رصين.",
};

export const mainNavigation: NavItem[] = [
  { title: "الرئيسية", href: "/" },
  { title: "الأقسام", href: "/#categories" },
  { title: "البحث", href: "/search" },
  { title: "الكتّاب", href: "/authors/sara-almousawi" },
  { title: "التقديم ككاتب", href: "/apply" },
];

export const dashboardNavigation = [
  { title: "نظرة عامة", href: "/dashboard" },
  { title: "المقالات", href: "/dashboard/articles" },
  { title: "طلبات الكتّاب", href: "/dashboard/writer-requests" },
  { title: "المستخدمون", href: "/dashboard/users" },
  { title: "الأقسام", href: "/dashboard/categories" },
  { title: "الوسوم", href: "/dashboard/tags" },
  { title: "التعليقات", href: "/dashboard/comments" },
  { title: "التحليلات", href: "/dashboard/analytics" },
  { title: "الإعدادات", href: "/dashboard/settings" },
];

export const colorTokens = {
  primary: "#6B4423",
  secondary: "#8A5A35",
  accent: "#C89B6D",
  light: "#F8F3EE",
  text: "#2A1D14",
  border: "#E6D8C8",
  beige: "#DCC7AE",
};

export const articleStatuses = [
  { value: "DRAFT", label: "مسودة" },
  { value: "PENDING_REVIEW", label: "بانتظار المراجعة" },
  { value: "NEEDS_REVISION", label: "بحاجة إلى تعديل" },
  { value: "APPROVED", label: "معتمد" },
  { value: "SCHEDULED", label: "مجدول" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "REJECTED", label: "مرفوض" },
] as const;
