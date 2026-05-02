"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteCategory, upsertCategory } from "@/actions/platform-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema } from "@/lib/validations";

type CategoryValues = z.infer<typeof categorySchema>;

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  articleCount: number;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

interface CategoryFormProps {
  initialValue?: CategoryRecord;
  mode?: "create" | "edit";
  canDelete?: boolean;
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "غير متوفر";
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toSlugInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({
  initialValue,
  mode = "create",
  canDelete = false,
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const isEditing = mode === "edit";
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryId: initialValue?.id,
      name: initialValue?.name ?? "",
      slug: initialValue?.slug ?? "",
      description: initialValue?.description ?? "",
      color: initialValue?.color ?? "#6B4423",
    },
  });
  const nameRegistration = form.register("name");

  const handleSubmit = (values: CategoryValues) => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await upsertCategory(values);
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.errors?.[0] ?? result.message);
        return;
      }

      toast.success(result.message);
      if (!isEditing) {
        form.reset({
          categoryId: undefined,
          name: "",
          slug: "",
          description: "",
          color: "#6B4423",
        });
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!initialValue) {
      return;
    }

    if (initialValue.articleCount > 0) {
      toast.error(
        "This category cannot be deleted because it contains articles.",
      );
      return;
    }

    if (!window.confirm("هل تريد حذف هذا القسم نهائياً؟")) {
      return;
    }

    startDeleteTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحذف...");
      const result = await deleteCategory(initialValue.id);
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <Card className="space-y-5 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">
            {isEditing ? "تعديل القسم" : "إضافة قسم جديد"}
          </h3>
          {isEditing ? (
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <span>إنشاء: {formatDate(initialValue?.createdAt)}</span>
              <span>تحديث: {formatDate(initialValue?.updatedAt)}</span>
            </div>
          ) : null}
        </div>
        {isEditing ? (
          <Badge variant="outline">
            {initialValue?.articleCount ?? 0} مقال
          </Badge>
        ) : (
          <Sparkles className="text-primary size-5" />
        )}
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <input type="hidden" {...form.register("categoryId")} />
        <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-${initialValue?.id ?? "new"}-name`}>
              اسم القسم
            </Label>
            <Input
              id={`${mode}-${initialValue?.id ?? "new"}-name`}
              {...nameRegistration}
              onBlur={(event) => {
                nameRegistration.onBlur(event);

                if (!form.getValues("slug")) {
                  form.setValue("slug", toSlugInput(event.target.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.name?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-${initialValue?.id ?? "new"}-slug`}>
              الرابط المختصر
            </Label>
            <Input
              id={`${mode}-${initialValue?.id ?? "new"}-slug`}
              dir="ltr"
              placeholder="auto-generated-if-empty"
              {...form.register("slug")}
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.slug?.message}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-${initialValue?.id ?? "new"}-description`}>
            الوصف
          </Label>
          <Textarea
            id={`${mode}-${initialValue?.id ?? "new"}-description`}
            {...form.register("description")}
          />
          <p className="text-sm text-red-700">
            {form.formState.errors.description?.message}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.5fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-${initialValue?.id ?? "new"}-color`}>
              اللون
            </Label>
            <Input
              id={`${mode}-${initialValue?.id ?? "new"}-color`}
              type="color"
              className="h-12 w-full rounded-2xl p-2"
              {...form.register("color")}
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.color?.message}
            </p>
          </div>
          <div className="grid gap-2 md:flex md:items-end md:justify-end">
            {isEditing && canDelete ? (
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting || (initialValue?.articleCount ?? 0) > 0}
                onClick={handleDelete}
                className="w-full border-red-200 text-red-700 hover:bg-red-50 md:w-auto dark:border-red-900/50 dark:text-red-300"
                title={
                  (initialValue?.articleCount ?? 0) > 0
                    ? "This category cannot be deleted because it contains articles."
                    : undefined
                }
              >
                {isDeleting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                حذف
              </Button>
            ) : null}
            <Button disabled={isPending} className="w-full md:w-auto">
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isPending
                ? "جارٍ الحفظ..."
                : isEditing
                  ? "حفظ التعديل"
                  : "حفظ القسم"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
