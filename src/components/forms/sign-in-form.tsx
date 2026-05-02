"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/lib/validations";

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignInValues) => {
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("تعذر تسجيل الدخول. تحقق من البيانات.");
        return;
      }

      toast.success("مرحباً بك في العمق النجفي.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-black">دخول هيئة التحرير والكتّاب</h1>
        <p className="text-muted-foreground">
          الوصول إلى لوحة النشر، سير المراجعة، والتحليلات التحريرية.
        </p>
      </div>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" {...form.register("email")} />
          <p className="text-sm text-red-700">
            {form.formState.errors.email?.message}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" type="password" {...form.register("password")} />
          <p className="text-sm text-red-700">
            {form.formState.errors.password?.message}
          </p>
        </div>
        <Button className="w-full" size="lg" disabled={isPending}>
          {isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>
    </Card>
  );
}
