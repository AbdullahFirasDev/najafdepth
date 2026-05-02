import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { canAccessDashboard } from "@/lib/permissions";
import {
  checkRequestRateLimit,
  isSameOriginRequest,
} from "@/lib/request-security";
import {
  ImageUploadValidationError,
  isSupabaseStorageConfigured,
  uploadImageToSupabaseStorage,
  validateImageUploadFile,
} from "@/lib/supabase-storage";

export const runtime = "nodejs";

function sanitizeFolder(folder: string) {
  const normalized = folder
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9-]/gi, ""))
    .filter(Boolean)
    .join("/");

  return normalized || "articles";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 403 });
  }

  const session = await auth();

  if (!session?.user || !canAccessDashboard(session)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const rate = checkRequestRateLimit(
    request,
    `upload:${session.user.id}`,
    20,
    60_000,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Too many upload attempts. Please try again later." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = sanitizeFolder(String(formData.get("folder") || "articles"));

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "A valid image file is required." },
      { status: 400 },
    );
  }

  try {
    if (isSupabaseStorageConfigured()) {
      const uploaded = await uploadImageToSupabaseStorage({
        file,
        folder,
      });

      return NextResponse.json({ url: uploaded.url });
    }

    if (isCloudinaryConfigured()) {
      const { buffer } = await validateImageUploadFile(file);
      const uploaded = await uploadImageBuffer({
        buffer,
        folder: `alomq-najafi/${folder}`,
      });

      return NextResponse.json({ url: uploaded.secureUrl });
    }

    return NextResponse.json(
      { message: "Image storage is not configured." },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Image upload failed.",
      },
      { status: error instanceof ImageUploadValidationError ? 400 : 500 },
    );
  }
}
