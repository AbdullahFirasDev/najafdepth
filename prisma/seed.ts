import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import {
  AnalyticsMetric,
  ArticleStatus,
  CommentStatus,
  RoleName,
  UserStatus,
  WriterApplicationStatus,
} from "@prisma/client";
import { hashSync } from "bcryptjs";

import { createPrismaAdapter } from "../src/lib/prisma-adapter";

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
});

function getSeedEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

async function main() {
  const adminEmail = getSeedEnv("ADMIN_EMAIL", "admin@alomq-najafi.com");
  const adminPassword = getSeedEnv("ADMIN_PASSWORD", "ChangeMe123!");
  const writerEmail = getSeedEnv("SEED_WRITER_EMAIL", "writer@alomq-najafi.com");
  const writerPassword = getSeedEnv("SEED_WRITER_PASSWORD", "WriterPass123!");
  const readerEmail = getSeedEnv("SEED_READER_EMAIL", "reader@alomq-najafi.com");
  const readerPassword = getSeedEnv("SEED_READER_PASSWORD", "ReaderPass123!");

  const roleDefinitions = [
    { name: RoleName.SUPER_ADMIN, description: "صلاحية كاملة لإدارة المنصة." },
    {
      name: RoleName.ADMIN,
      description: "إدارة المحتوى والكتاب والضبط العام.",
    },
    { name: RoleName.EDITOR, description: "مراجعة واعتماد المواد التحريرية." },
    { name: RoleName.WRITER, description: "تحرير وإرسال المقالات." },
    { name: RoleName.READER, description: "متابعة المحتوى والتفاعل معه." },
  ];

  const roles = await Promise.all(
    roleDefinitions.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: role,
      }),
    ),
  );

  const adminRole = roles.find((role) => role.name === RoleName.SUPER_ADMIN)!;
  const writerRole = roles.find((role) => role.name === RoleName.WRITER)!;
  const readerRole = roles.find((role) => role.name === RoleName.READER)!;

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashSync(adminPassword, 12),
      name: "هيئة التحرير",
      username: "editorial",
      specialty: "الإدارة الثقافية",
      isActive: true,
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
      bio: "فريق إدارة العمق النجفي، معني بتحرير المحتوى الثقافي والإشراف على معايير النشر.",
      profile: {
        create: {
          headline: "هيئة تحرير العمق النجفي",
          location: "النجف الأشرف",
          expertise: ["إدارة التحرير", "التحقيق الثقافي", "الإشراف المعرفي"],
          awards: ["منصة تأسيسية"],
          socialLinks: {
            x: "https://x.com/alomq",
            telegram: "https://t.me/alomq",
          },
        },
      },
    },
  });

  const writer = await prisma.user.upsert({
    where: { email: writerEmail },
    update: {},
    create: {
      email: writerEmail,
      passwordHash: hashSync(writerPassword, 12),
      name: "سارة الموسوي",
      username: "sara-almousawi",
      specialty: "النقد الأدبي",
      isActive: true,
      roleId: writerRole.id,
      bio: "كاتبة عراقية تهتم بسرديات المدينة والذاكرة الثقافية ومراجعات الكتب.",
      profile: {
        create: {
          headline: "كاتبة وباحثة في الأدب المعاصر",
          location: "النجف الأشرف",
          website: "https://example.com",
          expertise: ["النقد الأدبي", "سرديات المدينة", "مراجعات الكتب"],
          awards: ["جائزة المقال الثقافي 2024"],
          socialLinks: {
            instagram: "https://instagram.com/example",
            linkedin: "https://linkedin.com/in/example",
          },
        },
      },
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: readerEmail },
    update: {},
    create: {
      email: readerEmail,
      passwordHash: hashSync(readerPassword, 12),
      name: "علي الكرعاوي",
      username: "ali-reader",
      specialty: "قارئ مهتم بالفكر والثقافة",
      isActive: true,
      roleId: readerRole.id,
      bio: "عضو متابع للمحتوى الثقافي العربي الحديث.",
      profile: {
        create: {
          headline: "مهتم بالفكر والنشر الثقافي",
          location: "بغداد",
          expertise: ["الثقافة", "القراءة", "متابعة الصحافة الفكرية"],
          awards: [],
        },
      },
    },
  });

  const categories = await Promise.all(
    [
      {
        name: "فكر ومعرفة",
        slug: "thought-and-knowledge",
        description: "قراءات فكرية وتحليلات فلسفية في الشأن الثقافي العربي.",
        color: "#6B4423",
        coverImage:
          "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 1,
      },
      {
        name: "أدب ونقد",
        slug: "literature-and-criticism",
        description: "مقالات نقدية، مراجعات كتب، وملفات أدبية متخصصة.",
        color: "#8A5A35",
        coverImage:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 2,
      },
      {
        name: "تاريخ وذاكرة",
        slug: "history-and-memory",
        description:
          "استعادة الذاكرة النجفية والعراقية من خلال الوثيقة والرواية.",
        color: "#C89B6D",
        coverImage:
          "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 3,
      },
    ].map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    ),
  );

  const tags = await Promise.all(
    [
      { name: "النجف", slug: "najaf" },
      { name: "الهوية", slug: "identity" },
      { name: "الكتاب", slug: "books" },
      { name: "الصحافة الثقافية", slug: "cultural-journalism" },
      { name: "الذاكرة", slug: "memory" },
      { name: "الحداثة", slug: "modernity" },
    ].map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: tag,
        create: tag,
      }),
    ),
  );

  const featuredArticle = await prisma.article.upsert({
    where: { slug: "najaf-and-the-architecture-of-memory" },
    update: {},
    create: {
      title: "النجف وعمارة الذاكرة الثقافية في الصحافة العربية الجديدة",
      subtitle:
        "كيف تستعيد المنصات الحديثة روح المدينة من دون أن تفقد صرامتها التحريرية",
      slug: "najaf-and-the-architecture-of-memory",
      excerpt:
        "قراءة في العلاقة بين الصحافة الثقافية الجديدة ومفهوم الذاكرة المدينية، وكيف يمكن للهوية النجفية أن تُترجم إلى منصة نشر معاصرة.",
      coverImage:
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1400&q=80",
      contentHtml: `
        <p>تتقدّم الصحافة الثقافية العربية اليوم نحو سؤال مزدوج: كيف تواكب الإيقاع الرقمي السريع، وكيف تبقى أمينة لطبقات المعنى التي تصنعها المدن العريقة؟</p>
        <blockquote>المنصة الثقافية الناجحة لا تكتفي بنقل الخبر، بل تصنع سياقاً يليق بالمدينة التي تتكلم باسمها.</blockquote>
        <p>إن الهوية النجفية تمنح المشروع الثقافي فرصة نادرة لدمج الوقار التراثي مع أدوات العرض الحديثة، من البحث الذكي إلى التحرير التعاوني والتحليلات السلوكية.</p>
      `,
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "تتقدّم الصحافة الثقافية العربية اليوم نحو سؤال مزدوج...",
              },
            ],
          },
        ],
      },
      quote:
        "المدينة التي تمتلك ذاكرة حية تستطيع أن تنتج صحافة أكثر وقاراً وأشد صلة بالمستقبل.",
      seoTitle: "النجف وعمارة الذاكرة الثقافية",
      seoDescription:
        "مقال تحليلي حول الصحافة الثقافية والهوية النجفية والتحول الرقمي.",
      readingTimeMinutes: 8,
      featured: true,
      featuredRank: 1,
      allowComments: true,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      trendingScore: 93,
      likesCount: 127,
      bookmarksCount: 88,
      viewsCount: 1430,
      authorId: writer.id,
      reviewerId: admin.id,
      categoryId: categories[2].id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80",
            alt: "كتب قديمة ومخطوطات",
            caption: "المخطوط والكتاب جزء من الذاكرة البصرية للمدينة.",
            sortOrder: 1,
          },
        ],
      },
      tags: {
        create: [
          { tagId: tags[0].id },
          { tagId: tags[4].id },
          { tagId: tags[5].id },
        ],
      },
      comments: {
        create: [
          {
            authorId: reader.id,
            content:
              "مقال رصين ومكثف، ويطرح تصوراً ناضجاً عن العلاقة بين التقنية والهوية.",
            status: CommentStatus.APPROVED,
            likesCount: 4,
          },
        ],
      },
    },
  });

  await prisma.article.upsert({
    where: { slug: "book-review-arabic-cultural-magazines" },
    update: {},
    create: {
      title: "مراجعة كتاب: كيف صنعت المجلات الثقافية العربية ذائقة القرّاء؟",
      subtitle: "إطلالة على تاريخ المجلات التي صنعت الوعي الحديث",
      slug: "book-review-arabic-cultural-magazines",
      excerpt:
        "مراجعة كتاب تستعيد أثر المجلات الثقافية في تشكيل الذائقة واللغة النقدية.",
      coverImage:
        "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1400&q=80",
      contentHtml:
        "<p>تعيد هذه المراجعة قراءة سيرة المجلات الثقافية العربية التي نقلت الجدل الأدبي من النخبة إلى الجمهور.</p><p>تتبع المقالة تحولات اللغة النقدية، وملامح التحرير الرصين، ودور الغلاف البصري في تشكيل العادة القرائية.</p>",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "تعيد هذه المراجعة قراءة سيرة المجلات الثقافية العربية...",
              },
            ],
          },
        ],
      },
      quote: "كانت المجلة الثقافية مدرسة متنقلة في الذائقة.",
      seoTitle: "مراجعة كتاب عن المجلات الثقافية العربية",
      seoDescription:
        "قراءة في كتاب يتناول تاريخ المجلات الثقافية العربية وأثرها المعرفي.",
      readingTimeMinutes: 6,
      featured: false,
      allowComments: true,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      trendingScore: 78,
      likesCount: 84,
      bookmarksCount: 56,
      viewsCount: 980,
      authorId: writer.id,
      reviewerId: admin.id,
      categoryId: categories[1].id,
      tags: {
        create: [{ tagId: tags[2].id }, { tagId: tags[3].id }],
      },
    },
  });

  await prisma.writerApplication.upsert({
    where: { email: "zahraa@example.com" },
    update: {},
    create: {
      name: "زهراء الجبوري",
      email: "zahraa@example.com",
      bio: "باحثة في تاريخ المدن العربية وتهتم بالكتابة الثقافية ذات البعد الاجتماعي.",
      specialty: "التاريخ الثقافي",
      writingSamples: [
        "https://example.com/sample-1",
        "https://example.com/sample-2",
      ],
      socialLinks: {
        x: "https://x.com/zahraa",
        linkedin: "https://linkedin.com/in/zahraa",
      },
      status: WriterApplicationStatus.PENDING,
    },
  });

  await prisma.bookmark.upsert({
    where: {
      userId_articleId: {
        userId: reader.id,
        articleId: featuredArticle.id,
      },
    },
    update: {},
    create: {
      userId: reader.id,
      articleId: featuredArticle.id,
    },
  });

  await prisma.articleLike.upsert({
    where: {
      userId_articleId: {
        userId: reader.id,
        articleId: featuredArticle.id,
      },
    },
    update: {},
    create: {
      userId: reader.id,
      articleId: featuredArticle.id,
    },
  });

  await prisma.analytics.upsert({
    where: { id: "analytics-views-7d" },
    update: { value: 1430 },
    create: {
      id: "analytics-views-7d",
      articleId: featuredArticle.id,
      metric: AnalyticsMetric.ARTICLE_VIEWS,
      dimension: "7d",
      value: 1430,
    },
  });

  await prisma.analytics.upsert({
    where: { id: "analytics-likes-7d" },
    update: { value: 127 },
    create: {
      id: "analytics-likes-7d",
      articleId: featuredArticle.id,
      metric: AnalyticsMetric.LIKES,
      dimension: "7d",
      value: 127,
    },
  });

  await prisma.analytics.upsert({
    where: { id: "analytics-applications-30d" },
    update: { value: 12 },
    create: {
      id: "analytics-applications-30d",
      metric: AnalyticsMetric.APPLICATIONS,
      dimension: "30d",
      value: 12,
    },
  });

  await prisma.setting.upsert({
    where: { key: "site-branding" },
    update: {},
    create: {
      key: "site-branding",
      label: "إعدادات الهوية البصرية",
      description: "النصوص الأساسية وألوان الهوية للمنصة.",
      isPublic: true,
      updatedById: admin.id,
      value: {
        siteName: "العمق النجفي",
        tagline: "منصة ثقافية عربية للمعرفة والفكر والهوية",
        primaryColor: "#6B4423",
        secondaryColor: "#8A5A35",
        accentColor: "#C89B6D",
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: "homepage-hero" },
    update: {},
    create: {
      key: "homepage-hero",
      label: "بنر الصفحة الرئيسية",
      description: "إعدادات البنر العام الظاهر في واجهة الموقع.",
      isPublic: true,
      updatedById: admin.id,
      value: {
        isActive: true,
        eyebrow: "العمق النجفي",
        title: "منصة ثقافية عربية تستلهم ذاكرة النجف وتكتبها بلغة صحافية حديثة",
        description:
          "واجهة افتتاحية قابلة للتعديل الكامل من لوحة الإدارة بصورة وخطاب تحريري وزر انتقال واضح.",
        imageUrl:
          "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1600&q=80",
        ctaLabel: "استكشف المقالات",
        ctaHref: "/search",
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
