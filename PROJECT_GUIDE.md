# شرح مشروع Alkindi

## نظرة عامة

هذا المشروع منصة نشر ثقافية عربية مبنية بـ Next.js. الهدف منها عرض المقالات والكتّاب والأقسام، مع لوحة تحكم لإدارة المحتوى والمستخدمين والتعليقات وطلبات الانضمام ككاتب.

المشروع يدعم:

- واجهة عامة للزوار تعرض المقالات، الأقسام، الكتّاب، البحث، وطلب الانضمام.
- نظام تسجيل دخول باستخدام NextAuth.
- لوحة تحكم للأدوار الإدارية والكتّاب.
- إدارة المقالات وحالات النشر والمراجعة.
- إدارة الأقسام والوسوم والتعليقات والمستخدمين.
- بحث ذكي عبر Meilisearch عند توفره، مع بديل يعتمد على قاعدة البيانات.
- رفع صور المقالات عبر Supabase Storage بشكل افتراضي.
- إرسال بريد عبر Resend أو SMTP عند ضبط الإعدادات.
- تصدير المقالات كملف PDF.

## التقنيات المستخدمة

- Next.js 16 مع App Router.
- React 19.
- TypeScript.
- Prisma 7.
- PostgreSQL.
- NextAuth لتسجيل الدخول والجلسات.
- Tailwind CSS 4 للتصميم.
- Radix UI لمكونات الواجهة.
- TipTap لمحرر المقالات.
- Recharts للرسوم والتحليلات.
- Meilisearch للبحث الاختياري.
- Supabase Storage لرفع صور المقالات.
- Resend أو Nodemailer لإرسال البريد.

## أهم الملفات والمجلدات

```text
src/app
```

يحتوي صفحات الموقع وواجهات API. المشروع يستخدم App Router، لذلك كل مجلد داخل `src/app` يمثل مسارًا أو مجموعة مسارات.

```text
src/app/(site)
```

واجهات الزوار:

- `/` الصفحة الرئيسية.
- `/search` صفحة البحث.
- `/apply` طلب الانضمام ككاتب.
- `/sign-in` تسجيل الدخول.
- `/articles/[slug]` صفحة المقال.
- `/authors/[slug]` صفحة الكاتب.
- `/categories/[slug]` صفحة القسم.

```text
src/app/(dashboard)/dashboard
```

لوحة التحكم:

- `/dashboard` النظرة العامة.
- `/dashboard/articles` إدارة المقالات.
- `/dashboard/articles/new` إنشاء مقال جديد.
- `/dashboard/articles/[id]/edit` تعديل مقال.
- `/dashboard/writer-requests` طلبات الكتّاب.
- `/dashboard/users` المستخدمون.
- `/dashboard/categories` الأقسام.
- `/dashboard/tags` الوسوم.
- `/dashboard/comments` التعليقات.
- `/dashboard/analytics` التحليلات.
- `/dashboard/settings` الإعدادات.

```text
src/components
```

مكونات الواجهة مقسمة حسب المجال:

- `home` مكونات الصفحة الرئيسية.
- `layout` الهيدر والفوتر والقائمة الجانبية.
- `forms` النماذج.
- `articles` مكونات المقالات والمحرر.
- `dashboard` مكونات لوحة التحكم.
- `ui` مكونات الواجهة الأساسية.

```text
src/lib
```

منطق مشترك وخدمات مساعدة:

- `auth.ts` إعداد NextAuth.
- `prisma.ts` اتصال Prisma.
- `permissions.ts` صلاحيات المستخدمين.
- `data.ts` جلب بيانات الصفحات العامة.
- `validations.ts` مخططات التحقق.
- `meilisearch.ts` البحث والفهرسة.
- `supabase-storage.ts` رفع صور المقالات إلى Supabase Storage.
- `cloudinary.ts` دعم اختياري قديم للرفع عند توفر متغيرات Cloudinary.
- `email.ts` إرسال البريد.
- `utils.ts` دوال مساعدة مثل تنسيق التاريخ وتنظيف HTML.
- `fallback-data.ts` بيانات احتياطية تظهر عند تعذر الوصول لقاعدة البيانات.

```text
src/actions/platform-actions.ts
```

يحتوي Server Actions الخاصة بالمنصة، مثل:

- الاشتراك بالنشرة البريدية.
- إرسال طلب كاتب.
- إنشاء وتعديل المقالات.
- إدارة الأقسام والوسوم.
- مراجعة المقالات والطلبات.
- تحديث الإعدادات.
- مزامنة المقالات مع فهرس البحث.

```text
prisma/schema.prisma
```

تعريف قاعدة البيانات والعلاقات بين الجداول.

```text
prisma/seed.ts
```

ملف تعبئة بيانات أولية: أدوار، مستخدم مدير، كاتب، قارئ، أقسام، وسوم، ومقالات تجريبية.

## قاعدة البيانات

المشروع يعتمد على Prisma مع قاعدة PostgreSQL. أهم النماذج:

- `Role` الأدوار.
- `User` المستخدمون.
- `Profile` ملف الكاتب أو المستخدم.
- `WriterApplication` طلبات الانضمام ككاتب.
- `Category` الأقسام.
- `Tag` الوسوم.
- `Article` المقالات.
- `ArticleImage` صور المقال.
- `Comment` التعليقات.
- `Bookmark` الحفظ.
- `ArticleLike` الإعجابات.
- `View` المشاهدات.
- `Analytics` التحليلات.
- `Setting` إعدادات المنصة.
- `AuditLog` سجل العمليات.
- `NewsletterSubscriber` مشتركو النشرة.

حالات المقالات تشمل:

- `DRAFT` مسودة.
- `PENDING_REVIEW` بانتظار المراجعة.
- `NEEDS_REVISION` يحتاج تعديل.
- `APPROVED` معتمد.
- `SCHEDULED` مجدول.
- `PUBLISHED` منشور.
- `REJECTED` مرفوض.

## الأدوار والصلاحيات

الأدوار الموجودة:

- `SUPER_ADMIN`
- `ADMIN`
- `EDITOR`
- `WRITER`
- `READER`

ملف `src/lib/permissions.ts` يحدد الصلاحيات الأساسية:

- الوصول للوحة التحكم متاح للإداريين والكتّاب.
- مراجعة المحتوى متاحة لأدوار الإدارة والتحرير.
- النشر متاح لـ `SUPER_ADMIN` و `ADMIN` و `EDITOR`.

ملف `middleware.ts` يحمي مسارات `/dashboard`، ويحوّل المستخدم غير المسجل إلى `/sign-in`.

## متغيرات البيئة

انسخ الملف:

```bash
cp .env.example .env
```

ثم اضبط القيم حسب جهازك:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="article-images"
MEILISEARCH_HOST=""
MEILISEARCH_ADMIN_KEY=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
EMAIL_FROM=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
```

ملاحظة: Supabase Storage هو الخيار الافتراضي لرفع صور المقالات. يجب إبقاء `SUPABASE_SERVICE_ROLE_KEY` على الخادم فقط. Meilisearch و Cloudinary و Resend اختيارية.

## أوامر التشغيل

تثبيت الحزم:

```bash
npm install
```

توليد Prisma Client:

```bash
npm run prisma:generate
```

دفع مخطط قاعدة البيانات:

```bash
npm run db:push
```

تعبئة بيانات تجريبية:

```bash
npm run db:seed
```

تشغيل بيئة التطوير:

```bash
npm run dev
```

ثم افتح:

```text
http://localhost:3000
```

فحص الكود:

```bash
npm run lint
```

بناء نسخة إنتاجية:

```bash
npm run build
```

تشغيل النسخة الإنتاجية بعد البناء:

```bash
npm run start
```

## حسابات البيانات التجريبية

عند تشغيل `npm run db:seed` يتم إنشاء مستخدم مدير من قيم `.env`:

```env
ADMIN_EMAIL
ADMIN_PASSWORD
```

القيم الافتراضية في `.env.example`:

```text
admin@alomq-najafi.com
ChangeMe123!
```

كما ينشئ ملف البيانات التجريبية مستخدم كاتب وقارئ لأغراض الاختبار.

## واجهات API

المشروع يحتوي على مسارات API مهمة:

- `src/app/api/auth/[...nextauth]/route.ts` تسجيل الدخول والجلسات.
- `src/app/api/search/route.ts` البحث.
- `src/app/api/uploads/route.ts` رفع الصور.
- `src/app/api/uploads/sign/route.ts` معطل لرفع Cloudinary الموقع، والرفع يتم خادميًا عبر Supabase Storage.
- `src/app/api/articles/[slug]/pdf/route.tsx` تصدير المقال PDF.

## ملاحظات مهمة

- الصور الخارجية المسموحة في `next.config.ts` تشمل Supabase Storage و Cloudinary و Unsplash.
- إذا فشل الاتصال بقاعدة البيانات في بعض الصفحات العامة، يستخدم المشروع بيانات احتياطية من `src/lib/fallback-data.ts`.
- البحث يعمل عبر Meilisearch إذا كانت مفاتيحه مضبوطة، وإلا يستخدم بحثًا مباشرًا في قاعدة البيانات.
- البريد لا يرسل فعليًا إلا إذا تم ضبط Resend أو SMTP.
- رفع الصور إلى Supabase Storage يحتاج bucket عام للقراءة باسم `article-images` ومتغيرات Supabase في `.env`.

## طريقة العمل العامة داخل المشروع

1. الزائر يدخل إلى الصفحة الرئيسية أو البحث أو المقالات.
2. عند تسجيل الدخول، يتحقق NextAuth من البريد وكلمة المرور.
3. `middleware.ts` يمنع دخول لوحة التحكم بدون جلسة.
4. لوحة التحكم تستخدم Server Components و Server Actions لإدارة البيانات.
5. عند إنشاء أو تحديث مقال، يتم تنظيف HTML، حساب وقت القراءة، حفظ المقال، ثم إعادة تحديث الصفحات المتأثرة.
6. إذا كان المقال منشورًا وتم تفعيل Meilisearch، تتم مزامنته مع فهرس البحث.

## أين أبدأ لو أردت التعديل؟

- لتعديل شكل الصفحة الرئيسية: `src/app/(site)/page.tsx` ومكونات `src/components/home`.
- لتعديل الهيدر أو الفوتر: `src/components/layout`.
- لتعديل لوحة التحكم: `src/app/(dashboard)/dashboard`.
- لتعديل منطق المقالات والإدارة: `src/actions/platform-actions.ts`.
- لتعديل قاعدة البيانات: `prisma/schema.prisma`.
- لتعديل الصلاحيات: `src/lib/permissions.ts`.
- لتعديل إعدادات الموقع والقوائم: `src/lib/constants.ts`.
