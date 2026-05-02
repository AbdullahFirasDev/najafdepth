"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertSetting } from "@/actions/platform-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingSchema } from "@/lib/validations";

type SettingsFormValues = {
  key: string;
  label: string;
  description?: string;
  value: string;
  isPublic: boolean;
};

interface SettingsFormProps {
  initialValue: {
    key: string;
    label: string;
    description?: string | null;
    value: Record<string, unknown>;
    isPublic: boolean;
  };
}

export function SettingsForm({ initialValue }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      key: initialValue.key,
      label: initialValue.label,
      description: initialValue.description ?? "",
      value: JSON.stringify(initialValue.value, null, 2),
      isPublic: initialValue.isPublic,
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    startTransition(async () => {
      const loadingToast = toast.loading("جارٍ الحفظ...");
      try {
        const parsedValue = JSON.parse(values.value) as Record<string, unknown>;
        const validated = settingSchema.parse({
          key: values.key,
          label: values.label,
          description: values.description,
          value: parsedValue,
          isPublic: values.isPublic,
        });

        const result = await upsertSetting(validated);
        toast.dismiss(loadingToast);
        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        toast.dismiss(loadingToast);
        toast.error("قيمة الإعداد يجب أن تكون JSON صالحًا.");
      }
    });
  };

  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-2xl font-black">هوية المنصة</h3>
        <p className="text-muted-foreground text-sm leading-7">
          احتفظنا بهذا القسم لإعدادات الهوية العامة المتقدمة بصيغة JSON.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="setting-key">المفتاح</Label>
            <Input id="setting-key" {...form.register("key")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setting-label">العنوان</Label>
            <Input id="setting-label" {...form.register("label")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="setting-description">الوصف</Label>
          <Input id="setting-description" {...form.register("description")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="setting-value">القيمة (JSON)</Label>
          <Textarea
            id="setting-value"
            className="min-h-52 font-mono text-xs"
            {...form.register("value")}
          />
        </div>
        <label className="border-border bg-input flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
          <input type="checkbox" {...form.register("isPublic")} />
          هذا الإعداد عام ويمكن عرضه في الواجهة
        </label>
        <Button disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "جارٍ الحفظ..." : "حفظ الإعداد"}
        </Button>
      </form>
    </Card>
  );
}
