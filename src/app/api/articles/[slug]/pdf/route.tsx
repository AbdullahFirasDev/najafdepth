import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { getArticleBySlug } from "@/lib/data";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 12,
    lineHeight: 1.8,
    direction: "rtl",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 18,
    color: "#6B4423",
    textAlign: "right",
  },
  meta: {
    fontSize: 10,
    marginBottom: 18,
    color: "#7D6856",
    textAlign: "right",
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "right",
  },
});

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const safeFilename =
      slug.replace(/[^a-z0-9-]/gi, "").slice(0, 120) || "article";
    const article = await getArticleBySlug(slug);
    const plainText = article.contentHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const buffer = await renderToBuffer(
      <Document
        title={article.title}
        author={article.author?.name ?? "العمق النجفي"}
      >
        <Page size="A4" style={styles.page}>
          <View>
            <Text style={styles.title}>{article.title}</Text>
            {article.subtitle ? (
              <Text style={styles.subtitle}>{article.subtitle}</Text>
            ) : null}
            <Text style={styles.meta}>
              {article.author?.name ?? "هيئة التحرير"}
            </Text>
            <Text style={styles.paragraph}>{plainText}</Text>
          </View>
        </Page>
      </Document>,
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`,
      },
    });
  } catch {
    return Response.json(
      { message: "تعذر إنشاء ملف PDF." },
      { status: 500 },
    );
  }
}
