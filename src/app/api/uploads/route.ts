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

function hasEnvValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown upload error.";
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

function getErrorCause(error: unknown) {
  if (!(error instanceof Error) || !("cause" in error) || !error.cause) {
    return undefined;
  }

  if (error.cause instanceof Error) {
    return {
      message: error.cause.message,
      stack: error.cause.stack,
    };
  }

  if (
    typeof error.cause === "string" ||
    typeof error.cause === "number" ||
    typeof error.cause === "boolean"
  ) {
    return error.cause;
  }

  return {
    type:
      typeof error.cause === "object" && "constructor" in error.cause
        ? error.cause.constructor.name
        : typeof error.cause,
  };
}

function logUploadError(error: unknown) {
  console.error("Upload failed", {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    cause: getErrorCause(error),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: hasEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: hasEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
      },
      SUPABASE_STORAGE_BUCKET: {
        exists: hasEnvValue("SUPABASE_STORAGE_BUCKET"),
      },
    },
  });
}

function sanitizeFolder(folder: string) {
  const normalized = folder
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9-]/gi, ""))
    .filter(Boolean)
    .join("/");

  return normalized || "articles";
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 403 },
      );
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
    logUploadError(error);

    const status = error instanceof ImageUploadValidationError ? 400 : 500;
    const message =
      error instanceof ImageUploadValidationError
        ? error.message
        : "Image upload failed.";
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        message,
        ...(isDevelopment
          ? {
              error: {
                message: getErrorMessage(error),
                stack: getErrorStack(error),
                cause: getErrorCause(error),
              },
            }
          : {}),
      },
      { status },
    );
  }
}
