import { SignInForm } from "@/components/forms/sign-in-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "تسجيل الدخول",
  path: "/sign-in",
  description:
    "دخول هيئة التحرير والكتّاب إلى لوحة التحكم الخاصة بالعمق النجفي.",
});

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <SignInForm />
    </div>
  );
}
