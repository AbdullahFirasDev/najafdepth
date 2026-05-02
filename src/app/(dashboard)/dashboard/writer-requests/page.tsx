import { notFound } from "next/navigation";

import { WriterRequestActions } from "@/components/dashboard/writer-request-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { canReviewWriterApplications } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabels: Record<string, string> = {
  PENDING: "pending",
  APPROVED: "accepted",
  REJECTED: "rejected",
  CHANGES_REQUESTED: "pending",
};

export default async function WriterRequestsPage() {
  const session = await auth();
  if (!session?.user || !canReviewWriterApplications(session)) {
    notFound();
  }

  const applications = await prisma.writerApplication
    .findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    .catch(() => []);

  const records = applications as Array<Record<string, any>>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black sm:text-3xl">طلبات الكتّاب</h2>
        <p className="text-muted-foreground text-sm">
          اعتماد الطلبات أو رفضها أو طلب تعديلات قبل فتح مساحة النشر للكاتب.
        </p>
      </div>
      <div className="space-y-4">
        {records.length ? (
          records.map((application) => {
            const status = String(application.status);

            return (
              <Card
                key={String(application.id)}
                className="space-y-4 overflow-hidden"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold">
                        {String(application.name)}
                      </h3>
                      <Badge variant="outline">
                        {statusLabels[status] ?? status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {String(application.email)} -{" "}
                      {String(application.specialty)} -{" "}
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <WriterRequestActions
                    applicationId={String(application.id)}
                    status={status}
                  />
                </div>
                <p className="text-muted-foreground text-sm leading-8">
                  {String(application.bio)}
                </p>
                {application.reviewNotes ? (
                  <p className="border-border/70 bg-muted/20 rounded-2xl border px-4 py-3 text-sm">
                    {String(application.reviewNotes)}
                  </p>
                ) : null}
              </Card>
            );
          })
        ) : (
          <Card className="text-muted-foreground text-center text-sm">
            لا توجد طلبات كتابة حالياً.
          </Card>
        )}
      </div>
    </div>
  );
}
