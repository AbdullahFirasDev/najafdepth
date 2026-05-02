import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUploadSignature } from "@/lib/cloudinary";
import { canAccessDashboard } from "@/lib/permissions";
import {
  checkRequestRateLimit,
  isSameOriginRequest,
} from "@/lib/request-security";

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "طلب غير صالح." }, { status: 403 });
  }

  const session = await auth();

  if (!session?.user || !canAccessDashboard(session)) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  const rate = checkRequestRateLimit(
    request,
    `upload-sign:${session.user.id}`,
    30,
    60_000,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "تم تجاوز عدد الطلبات المسموح." },
      { status: 429 },
    );
  }

  try {
    const payload = getUploadSignature("alomq-najafi/articles");
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "تعذر إنشاء توقيع الرفع.",
      },
      { status: 500 },
    );
  }
}
