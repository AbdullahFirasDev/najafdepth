import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/permissions";
import {
  checkRequestRateLimit,
  isSameOriginRequest,
} from "@/lib/request-security";

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 403 });
  }

  const session = await auth();

  if (!session?.user || !canAccessDashboard(session)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const rate = checkRequestRateLimit(
    request,
    `upload-sign:${session.user.id}`,
    30,
    60_000,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Too many upload signature requests." },
      { status: 429 },
    );
  }

  return NextResponse.json(
    {
      message:
        "Signed Cloudinary uploads are disabled. Use POST /api/uploads for server-side Supabase Storage uploads.",
    },
    { status: 410 },
  );
}
