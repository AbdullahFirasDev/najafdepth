"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { submitWriterApplication } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { writerApplicationSchema } from "@/lib/validations";

type WriterApplicationValues = z.infer<typeof writerApplicationSchema>;

export function WriterApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<WriterApplicationValues>({
    resolver: zodResolver(writerApplicationSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      specialty: "",
      writingSamples: [""],
      socialLinks: [{ label: "إكس", url: "" }],
    },
  });

  const socialLinks = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  const writingSamples = useWatch({
    control: form.control,
    name: "writingSamples",
  });

  const onSubmit = (values: WriterApplicationValues) => {
    startTransition(async () => {
      const result = await submitWriterApplication(values);
      if (!result.success) {
        toast.error(result.errors?.[0] || result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
    });
  };

  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">طلب الانضمام إلى الكتّاب</h1>
        <p className="text-muted-foreground">
          التقديم متاح عبر مراجعة تحريرية فقط. شاركنا خبرتك وعينات من كتابتك
          الثقافية.
        </p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input id="name" {...form.register("name")} />
            <p className="text-sm text-red-700">
              {form.formState.errors.name?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <p className="text-sm text-red-700">
              {form.formState.errors.email?.message}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialty">التخصص</Label>
          <Input
            id="specialty"
            placeholder="مثل: النقد الأدبي، التاريخ الثقافي..."
            {...form.register("specialty")}
          />
          <p className="text-sm text-red-700">
            {form.formState.errors.specialty?.message}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">نبذة تعريفية</Label>
          <Textarea id="bio" {...form.register("bio")} />
          <p className="text-sm text-red-700">
            {form.formState.errors.bio?.message}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>نماذج الكتابة</Label>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                form.setValue(
                  "writingSamples",
                  [...(writingSamples ?? []), ""],
                  { shouldDirty: true },
                )
              }
            >
              إضافة رابط
            </Button>
          </div>
          {(writingSamples ?? []).map((_, index) => (
            <div key={`writing-sample-${index}`} className="flex gap-3">
              <Input
                {...form.register(`writingSamples.${index}`)}
                placeholder="https://example.com/article"
              />
              {(writingSamples?.length ?? 0) > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.setValue(
                      "writingSamples",
                      (writingSamples ?? []).filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                      { shouldDirty: true },
                    )
                  }
                >
                  حذف
                </Button>
              ) : null}
            </div>
          ))}
          <p className="text-sm text-red-700">
            {form.formState.errors.writingSamples?.message as string}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>الروابط الاجتماعية</Label>
            <Button
              type="button"
              variant="ghost"
              onClick={() => socialLinks.append({ label: "", url: "" })}
            >
              إضافة رابط
            </Button>
          </div>
          {socialLinks.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 md:grid-cols-[0.35fr_1fr_auto]"
            >
              <Input
                {...form.register(`socialLinks.${index}.label`)}
                placeholder="المنصة"
              />
              <Input
                {...form.register(`socialLinks.${index}.url`)}
                placeholder="https://..."
              />
              {socialLinks.fields.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => socialLinks.remove(index)}
                >
                  حذف
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <Button size="lg" disabled={isPending}>
          {isPending ? "جارٍ إرسال الطلب..." : "إرسال الطلب"}
        </Button>
      </form>
    </Card>
  );
}
