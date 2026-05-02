import { sanitizeArticleHtml } from "@/lib/utils";

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export function RichTextRenderer({
  content,
  className,
}: RichTextRendererProps) {
  return (
    <div
      className={`prose-ar max-w-none text-[1rem] leading-8 sm:text-[1.05rem] sm:leading-9 ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(content) }}
    />
  );
}
