"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertSetting } from "@/actions/platform-actions";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HomepageHeroSetting } from "@/types";
import { homepageBannerSchema } from "@/lib/validations";

type HomepageBannerFormValues = z.infer<typeof homepageBannerSchema>;

interface HomepageBannerFormProps {
  initialValue: HomepageHeroSetting;
}

export function HomepageBannerForm({ initialValue }: HomepageBannerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<HomepageBannerFormValues>({
    resolver: zodResolver(homepageBannerSchema),
    defaultValues: initialValue,
  });

  const onSubmit = (values: HomepageBannerFormValues) => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      const result = await upsertSetting({
        key: "homepage-hero",
        label: "بنر الصفحة الرئيسية",
        description:
          "التحكم الكامل بصورة البنر ونصوصه والزر الرئيسي في الصفحة الرئيسية.",
        value: values,
        isPublic: true,
      });
      toast.dismiss(loadingToast);

      if (!result.success) {
        toast.error(result.errors?.[0] || result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-black">بنر الصفحة الرئيسية</h3>
        <p className="text-muted-foreground text-sm leading-7">
          صورة غلاف كاملة مع نص علوي وزر انتقال، وتظهر مباشرة في واجهة الموقع
          بعد الحفظ.
        </p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="border-border bg-input flex items-center gap-3 rounded-[1.5rem] border px-4 py-3 text-sm font-medium">
          <input type="checkbox" {...form.register("isActive")} />
          تفعيل البنر على الصفحة الرئيسية
        </label>

        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <ImageUploadField
              label="صورة البنر"
              value={field.value}
              onChange={field.onChange}
              folder="banners"
              description="يفضل استخدام صورة عريضة عالية الجودة تناسب العرض الكامل."
              previewClassName="aspect-[21/9] min-h-56"
            />
          )}
        />
        <p className="text-sm text-red-700">
          {form.formState.errors.imageUrl?.message}
        </p>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero-eyebrow">النص التعريفي</Label>
            <Input
              id="hero-eyebrow"
              {...form.register("eyebrow")}
              placeholder="العمق النجفي"
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.eyebrow?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-title">عنوان البنر</Label>
            <Input id="hero-title" {...form.register("title")} />
            <p className="text-sm text-red-700">
              {form.formState.errors.title?.message}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero-description">وصف البنر</Label>
          <Textarea
            id="hero-description"
            className="min-h-36"
            {...form.register("description")}
          />
          <p className="text-sm text-red-700">
            {form.formState.errors.description?.message}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-2">
            <Label htmlFor="hero-ctaLabel">نص الزر</Label>
            <Input
              id="hero-ctaLabel"
              {...form.register("ctaLabel")}
              placeholder="استكشف الملفات"
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.ctaLabel?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-ctaHref">رابط الزر</Label>
            <Input
              id="hero-ctaHref"
              dir="ltr"
              {...form.register("ctaHref")}
              placeholder="/search"
            />
            <p className="text-sm text-red-700">
              {form.formState.errors.ctaHref?.message}
            </p>
          </div>
        </div>

        <Button disabled={isPending} size="lg" className="w-full sm:w-auto">
          {isPending ? "جارٍ حفظ البنر..." : "حفظ إعدادات البنر"}
        </Button>
      </form>
    </Card>
  );
}
