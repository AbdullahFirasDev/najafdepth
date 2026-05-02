import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { canAccessDashboard } from "@/lib/permissions";
import {
  checkRequestRateLimit,
  isSameOriginRequest,
} from "@/lib/request-security";

export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function sanitizeFolder(folder: string) {
  const normalized = folder
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9-]/gi, ""))
    .filter(Boolean)
    .join("/");

  return normalized || "articles";
}

function detectImageExtension(buffer: Buffer) {
  if (
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpg";
  }

  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  if (
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

async function storeLocally(input: {
  buffer: Buffer;
  extension: string;
  folder: string;
}) {
  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const resolvedUploadRoot = path.resolve(uploadRoot);
  const folderPath = path.resolve(resolvedUploadRoot, sanitizeFolder(input.folder));

  if (
    folderPath !== resolvedUploadRoot &&
    !folderPath.startsWith(`${resolvedUploadRoot}${path.sep}`)
  ) {
    throw new Error("Invalid upload folder.");
  }

  await mkdir(folderPath, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}.${input.extension}`;
  const absoluteFilePath = path.join(folderPath, fileName);

  await writeFile(absoluteFilePath, input.buffer);

  const relativeFolder = path
    .relative(resolvedUploadRoot, folderPath)
    .replace(/\\/g, "/");
  return `/uploads/${relativeFolder}/${fileName}`;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "طلب غير صالح." }, { status: 403 });
  }

  const session = await auth();

  if (!session?.user || !canAccessDashboard(session)) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  const rate = checkRequestRateLimit(request, `upload:${session.user.id}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "تم تجاوز عدد محاولات الرفع المسموح." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "articles");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "لم يتم العثور على ملف صالح." },
      { status: 400 },
    );
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { message: "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { message: "حجم الصورة يتجاوز 8 ميغابايت." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = allowedMimeTypes.get(file.type)!;
  const detectedExtension = detectImageExtension(buffer);

  if (!detectedExtension || detectedExtension !== extension) {
    return NextResponse.json(
      { message: "محتوى الملف لا يطابق نوع الصورة المسموح." },
      { status: 400 },
    );
  }

  try {
    if (isCloudinaryConfigured()) {
      const uploaded = await uploadImageBuffer({
        buffer,
        folder: `alomq-najafi/${sanitizeFolder(folder)}`,
        filename: `${Date.now()}-${randomUUID()}`,
      });

      return NextResponse.json({ url: uploaded.secureUrl });
    }

    const url = await storeLocally({
      buffer,
      extension,
      folder,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "تعذر رفع الصورة.",
      },
      { status: 500 },
    );
  }
}
