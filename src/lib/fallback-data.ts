export const fallbackCategories = [
  {
    id: "category-thought",
    name: "فكر ومعرفة",
    slug: "thought-and-knowledge",
    description: "تحليلات فكرية وقراءات معمقة.",
    color: "#6B4423",
    coverImage:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
    _count: { articles: 12 },
  },
  {
    id: "category-literature",
    name: "أدب ونقد",
    slug: "literature-and-criticism",
    description: "مراجعات كتب وملفات أدبية متخصصة.",
    color: "#8A5A35",
    coverImage:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    _count: { articles: 9 },
  },
  {
    id: "category-history",
    name: "تاريخ وذاكرة",
    slug: "history-and-memory",
    description: "قراءات في الذاكرة النجفية والعراقية.",
    color: "#C89B6D",
    coverImage:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    _count: { articles: 14 },
  },
] as const;

export const fallbackWriters = [
  {
    id: "writer-sara",
    name: "سارة الموسوي",
    username: "sara-almousawi",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    specialty: "النقد الأدبي",
    bio: "كاتبة عراقية تهتم بسرديات المدينة والهوية الثقافية.",
    profile: {
      headline: "كاتبة وباحثة في الأدب المعاصر",
      expertise: ["النقد الأدبي", "مراجعات الكتب", "سرديات المدينة"],
    },
    _count: {
      authoredArticles: 18,
      followerLinks: 1200,
    },
  },
  {
    id: "writer-ali",
    name: "علي الأسدي",
    username: "ali-alasadi",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    specialty: "التاريخ الثقافي",
    bio: "باحث في التاريخ الاجتماعي للمدن العراقية.",
    profile: {
      headline: "باحث في التاريخ الثقافي العراقي",
      expertise: ["الذاكرة", "التاريخ الثقافي", "المدن العربية"],
    },
    _count: {
      authoredArticles: 11,
      followerLinks: 850,
    },
  },
] as const;

export const fallbackArticles = [
  {
    id: "article-1",
    title: "النجف وعمارة الذاكرة الثقافية في الصحافة العربية الجديدة",
    subtitle:
      "كيف تستعيد المنصات الحديثة روح المدينة من دون أن تفقد صرامتها التحريرية",
    slug: "najaf-and-the-architecture-of-memory",
    excerpt:
      "قراءة في العلاقة بين الصحافة الثقافية الجديدة ومفهوم الذاكرة المدينية، وكيف يمكن للهوية النجفية أن تُترجم إلى منصة نشر معاصرة.",
    coverImage:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1400&q=80",
    contentHtml:
      "<p>تتقدّم الصحافة الثقافية العربية اليوم نحو سؤال مزدوج: كيف تواكب الإيقاع الرقمي السريع، وكيف تبقى أمينة لطبقات المعنى التي تصنعها المدن العريقة؟</p><blockquote>المنصة الثقافية الناجحة لا تكتفي بنقل الخبر، بل تصنع سياقاً يليق بالمدينة.</blockquote><p>الهوية النجفية تمنح المشروع الثقافي فرصة نادرة لدمج الوقار التراثي مع أدوات العرض الحديثة.</p>",
    quote:
      "المنصة الثقافية الناجحة لا تكتفي بنقل الخبر، بل تصنع سياقاً يليق بالمدينة.",
    readingTimeMinutes: 8,
    viewsCount: 1430,
    likesCount: 127,
    bookmarksCount: 88,
    trendingScore: 93,
    publishedAt: new Date().toISOString(),
    featured: true,
    category: fallbackCategories[2],
    author: fallbackWriters[0],
    tags: [
      { tag: { id: "tag-1", name: "النجف", slug: "najaf" } },
      { tag: { id: "tag-2", name: "الذاكرة", slug: "memory" } },
    ],
    comments: [
      {
        id: "comment-1",
        content: "مقال رصين ومكثف.",
        createdAt: new Date().toISOString(),
        author: {
          id: "reader-1",
          name: "علي الكرعاوي",
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
        },
      },
    ],
    images: [],
  },
  {
    id: "article-2",
    title: "مراجعة كتاب: كيف صنعت المجلات الثقافية العربية ذائقة القرّاء؟",
    subtitle: "إطلالة على تاريخ المجلات التي صنعت الوعي الحديث",
    slug: "book-review-arabic-cultural-magazines",
    excerpt:
      "مراجعة كتاب تستعيد أثر المجلات الثقافية في تشكيل الذائقة واللغة النقدية.",
    coverImage:
      "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1400&q=80",
    contentHtml:
      "<p>تعيد هذه المراجعة قراءة سيرة المجلات الثقافية العربية التي نقلت الجدل الأدبي من النخبة إلى الجمهور.</p>",
    quote: "كانت المجلة الثقافية مدرسة متنقلة في الذائقة.",
    readingTimeMinutes: 6,
    viewsCount: 980,
    likesCount: 84,
    bookmarksCount: 56,
    trendingScore: 78,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    featured: false,
    category: fallbackCategories[1],
    author: fallbackWriters[0],
    tags: [{ tag: { id: "tag-3", name: "الكتاب", slug: "books" } }],
    comments: [],
    images: [],
  },
] as const;

export const fallbackDashboardSeries = [
  { name: "السبت", views: 420, engagement: 38 },
  { name: "الأحد", views: 560, engagement: 42 },
  { name: "الاثنين", views: 610, engagement: 44 },
  { name: "الثلاثاء", views: 790, engagement: 56 },
  { name: "الأربعاء", views: 910, engagement: 63 },
  { name: "الخميس", views: 980, engagement: 68 },
  { name: "الجمعة", views: 1120, engagement: 74 },
] as const;
