"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertArticle } from "@/actions/platform-actions";
import { ArticleEditor } from "@/components/articles/article-editor";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { articleStatuses } from "@/lib/constants";
import { articleSchema } from "@/lib/validations";
import type { ArticleSourceLink } from "@/types";

type ArticleFormValues = z.input<typeof articleSchema>;

interface ArticleFormProps {
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  canPublish?: boolean;
  initialArticle?: {
    id: string;
    title: string;
    subtitle?: string | null;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    categoryId: string;
    quote?: string | null;
    contentHtml: string;
    status: ArticleFormValues["status"];
    scheduledFor?: string | Date | null;
    reviewNotes?: string | null;
    tags: Array<{ tagId: string }>;
    sources?: ArticleSourceLink[] | null;
  };
}

function toDateTimeLocalValue(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function ArticleForm({
  categories,
  tags,
  canPublish = false,
  initialArticle,
}: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialArticle);
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      articleId: initialArticle?.id,
      title: initialArticle?.title ?? "",
      subtitle: initialArticle?.subtitle ?? "",
      slug: initialArticle?.slug ?? "",
      excerpt: initialArticle?.excerpt ?? "",
      coverImage: initialArticle?.coverImage ?? "",
      categoryId: initialArticle?.categoryId ?? categories[0]?.id ?? "",
      tagIds: initialArticle?.tags.map((tag) => tag.tagId) ?? [],
      quote: initialArticle?.quote ?? "",
      contentHtml: initialArticle?.contentHtml ?? "",
      sources: initialArticle?.sources ?? [],
      status: initialArticle?.status ?? "DRAFT",
      scheduledFor: toDateTimeLocalValue(initialArticle?.scheduledFor),
    },
  });

  const sourcesFieldArray = useFieldArray({
    control: form.control,
    name: "sources",
  });
  const writerStatuses = articleStatuses.filter((status) =>
    ["DRAFT", "PENDING_REVIEW"].includes(status.value),
  );
  const currentStatus = articleStatuses.find(
    (status) => status.value === initialArticle?.status,
  );
  const availableStatuses = canPublish
    ? articleStatuses
    : currentStatus && !writerStatuses.includes(currentStatus)
      ? [...writerStatuses, currentStatus]
      : writerStatuses;

  const onSubmit = (values: ArticleFormValues) => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await upsertArticle(values);
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.errors?.[0] || result.message);
        return;
      }

      toast.success(result.message);
      router.push("/dashboard/articles");
      router.refresh();
    });
  };

  return (
    <Card className="space-y-6 overflow-hidden">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">
          {isEditing ? "تعديل المقال" : "محرر المقالات"}
        </h1>
        <p className="text-muted-foreground">
          كتابة عربية احترافية مع رفع صور من الجهاز، دعم كامل للمراجعة، وإدارة
          دقيقة لحالة النشر.
        </p>
      </div>

      {initialArticle?.reviewNotes ? (
        <Card className="border-primary/20 bg-primary/5 p-5">
          <p className="text-primary mb-2 text-sm font-semibold">
            ملاحظات المراجعة
          </p>
          <p className="text-muted-foreground text-sm leading-8">
            {initialArticle.reviewNotes}
          </p>
        </Card>
      ) : null}

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المقال</Label>
                <Input id="title" {...form.register("title")} />
                <p className="text-sm text-red-700">
                  {form.formState.errors.title?.message}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">الرابط المختصر</Label>
                <Input id="slug" dir="ltr" {...form.register("slug")} />
                <p className="text-sm text-red-700">
                  {form.formState.errors.slug?.message}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">العنوان الفرعي</Label>
              <Input id="subtitle" {...form.register("subtitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">الملخص</Label>
              <Textarea
                id="excerpt"
                className="min-h-32"
                {...form.register("excerpt")}
              />
              <p className="text-sm text-red-700">
                {form.formState.errors.excerpt?.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote">اقتباس بارز</Label>
              <Input id="quote" {...form.register("quote")} />
            </div>
          </div>

          <div className="space-y-5">
            <Controller
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <ImageUploadField
                  label="صورة الغلاف"
                  value={field.value}
                  onChange={field.onChange}
                  folder="articles/covers"
                  description="يتم رفع الصورة من جهازك وربطها بالمقال تلقائيًا."
                />
              )}
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.coverImage?.message}
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">القسم</Label>
                <select
                  id="categoryId"
                  className="border-border bg-input h-12 w-full rounded-2xl border px-4 text-sm outline-none"
                  {...form.register("categoryId")}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-red-700">
                  {form.formState.errors.categoryId?.message}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  className="border-border bg-input h-12 w-full rounded-2xl border px-4 text-sm outline-none"
                  {...form.register("status")}
                >
                  {availableStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledFor">جدولة النشر</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                {...form.register("scheduledFor")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>الوسوم</Label>
            <p className="text-muted-foreground text-sm">
              اختر وسماً واحداً على الأقل
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="border-border bg-input flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  value={tag.id}
                  {...form.register("tagIds")}
                />
                {tag.name}
              </label>
            ))}
          </div>
          <p className="text-sm text-red-700">
            {form.formState.errors.tagIds?.message}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Label>روابط المصادر</Label>
              <p className="text-muted-foreground text-sm leading-7">
                حقل اختياري لإضافة المراجع أو المصادر الداعمة للمقال.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => sourcesFieldArray.append({ title: "", url: "" })}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" />
              إضافة مصدر
            </Button>
          </div>

          <div className="space-y-3">
            {sourcesFieldArray.fields.length ? (
              sourcesFieldArray.fields.map((field, index) => (
                <Card key={field.id} className="space-y-4 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                      <Link2 className="size-4" />
                      مصدر {index + 1}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => sourcesFieldArray.remove(index)}
                      className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
                    >
                      <Trash2 className="size-4" />
                      حذف
                    </Button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-2">
                      <Label htmlFor={`source-title-${index}`}>
                        عنوان المصدر
                      </Label>
                      <Input
                        id={`source-title-${index}`}
                        {...form.register(`sources.${index}.title`)}
                      />
                      <p className="text-sm text-red-700">
                        {form.formState.errors.sources?.[index]?.title?.message}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`source-url-${index}`}>رابط المصدر</Label>
                      <Input
                        id={`source-url-${index}`}
                        dir="ltr"
                        {...form.register(`sources.${index}.url`)}
                      />
                      <p className="text-sm text-red-700">
                        {form.formState.errors.sources?.[index]?.url?.message}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-muted-foreground border-dashed p-5 text-sm leading-7">
                لم تتم إضافة مصادر بعد. يمكنك ترك هذا القسم فارغًا أو إضافة
                روابط مرجعية اختيارية.
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>المحتوى</Label>
          <Controller
            control={form.control}
            name="contentHtml"
            render={({ field }) => (
              <ArticleEditor value={field.value} onChange={field.onChange} />
            )}
          />
          <p className="text-sm text-red-700">
            {form.formState.errors.contentHtml?.message}
          </p>
        </div>

        <Button size="lg" disabled={isPending} className="w-full sm:w-auto">
          {isPending
            ? "جارٍ الحفظ..."
            : isEditing
              ? "حفظ التعديلات"
              : "حفظ المقال"}
        </Button>
      </form>
    </Card>
  );
}
