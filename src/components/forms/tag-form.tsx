"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteTag, upsertTag } from "@/actions/platform-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tagSchema } from "@/lib/validations";

type TagValues = z.infer<typeof tagSchema>;

export interface TagRecord {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

interface TagFormProps {
  initialValue?: TagRecord;
  mode?: "create" | "edit";
  canDelete?: boolean;
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

export function TagForm({
  initialValue,
  mode = "create",
  canDelete = false,
}: TagFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const isEditing = mode === "edit";
  const form = useForm<TagValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      tagId: initialValue?.id,
      name: initialValue?.name ?? "",
      slug: initialValue?.slug ?? "",
    },
  });
  const nameRegistration = form.register("name");

  const onSubmit = (values: TagValues) => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await upsertTag(values);
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.errors?.[0] ?? result.message);
        return;
      }

      toast.success(result.message);
      if (!isEditing) {
        form.reset({ tagId: undefined, name: "", slug: "" });
      }
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!initialValue) {
      return;
    }

    if (initialValue.articleCount > 0) {
      toast.error("لا يمكن حذف هذا الوسم لأنه مرتبط بمقالات.");
      return;
    }

    if (!window.confirm("هل تريد حذف هذا الوسم نهائياً؟")) {
      return;
    }

    startDeleteTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحذف...");
      const result = await deleteTag(initialValue.id);
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
    <Card className="space-y-4 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">
            {isEditing ? "تعديل وسم" : "إضافة وسم جديد"}
          </h3>
          {isEditing ? (
            <p className="text-muted-foreground text-xs">
              إنشاء: {formatDate(initialValue?.createdAt)} - تحديث:{" "}
              {formatDate(initialValue?.updatedAt)}
            </p>
          ) : null}
        </div>
        {isEditing ? (
          <Badge variant="outline">
            {initialValue?.articleCount ?? 0} مقال
          </Badge>
        ) : null}
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <input type="hidden" {...form.register("tagId")} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>اسم الوسم</Label>
            <Input
              {...nameRegistration}
              onBlur={(event) => {
                nameRegistration.onBlur(event);

                if (!form.getValues("slug")) {
                  form.setValue("slug", toSlugInput(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.name?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label>الرابط المختصر</Label>
            <Input dir="ltr" {...form.register("slug")} />
            <p className="text-sm text-red-700">
              {form.formState.errors.slug?.message}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {isEditing && canDelete ? (
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting || (initialValue?.articleCount ?? 0) > 0}
              onClick={onDelete}
              className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
            >
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              حذف
            </Button>
          ) : null}
          <Button disabled={isPending} className="w-full sm:w-auto">
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isPending
              ? "جارٍ الحفظ..."
              : isEditing
                ? "حفظ التعديل"
                : "حفظ الوسم"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
