import { WriterApplicationForm } from "@/components/forms/writer-application-form";
import { Card } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "التقديم إلى الكتّاب",
  path: "/apply",
  description:
    "نظام تقديم مغلق للكتّاب مع مراجعة تحريرية وحق الإدارة في القبول أو الرفض أو طلب التعديلات.",
});

export default function ApplyPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[0.42fr_0.58fr] md:px-6">
      <div className="space-y-5">
        <Card className="space-y-4">
          <h1 className="text-3xl font-black">كيف نختار الكتّاب؟</h1>
          <p className="text-muted-foreground text-sm leading-8">
            تعتمد المنصة على مراجعة تحريرية دقيقة، ولا تفتح التسجيل العام. نهتم
            بالنبرة الفكرية، جودة اللغة، واحترام منهجية النشر الثقافي.
          </p>
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">ما الذي نبحث عنه؟</h2>
          <ul className="text-muted-foreground space-y-2 text-sm leading-8">
            <li>كتابة ثقافية رصينة ومتماسكة</li>
            <li>خبرة واضحة أو مشروع فكري ناضج</li>
            <li>عينات منشورة أو غير منشورة بمستوى مهني</li>
            <li>الالتزام بسير المراجعة قبل النشر</li>
          </ul>
        </Card>
      </div>
      <WriterApplicationForm />
    </div>
  );
}
