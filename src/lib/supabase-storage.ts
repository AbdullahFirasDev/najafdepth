import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export class ImageUploadValidationError extends Error {}

function getSupabaseStorageEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "article-images",
  };
}

export function isSupabaseStorageConfigured() {
  const env = getSupabaseStorageEnv();
  return Boolean(env.url && env.serviceRoleKey && env.bucket);
}

export function getSupabaseStorageBucket() {
  return getSupabaseStorageEnv().bucket;
}

function createSupabaseStorageClient() {
  const env = getSupabaseStorageEnv();

  if (!env.url || !env.serviceRoleKey) {
    throw new Error(
      "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
    );
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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

function sanitizeBaseName(name: string) {
  const baseName = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return baseName || "image";
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

function createStoragePath(input: {
  folder: string;
  originalName: string;
  extension: string;
}) {
  const folder = sanitizeFolder(input.folder);
  const baseName = sanitizeBaseName(input.originalName);
  return `${folder}/${Date.now()}-${randomUUID()}-${baseName}.${input.extension}`;
}

export async function uploadImageToSupabaseStorage(input: {
  file: File;
  folder?: string;
}) {
  const { buffer, extension } = await validateImageUploadFile(input.file);

  const bucket = getSupabaseStorageBucket();
  const storagePath = createStoragePath({
    folder: input.folder ?? "articles",
    originalName: input.file.name,
    extension,
  });
  const supabase = createSupabaseStorageClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      cacheControl: "31536000",
      contentType: input.file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Image upload failed.");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  if (!data.publicUrl) {
    throw new Error("Supabase did not return a public image URL.");
  }

  return {
    url: data.publicUrl,
    path: storagePath,
    bucket,
  };
}

export async function validateImageUploadFile(file: File) {
  const extension = allowedMimeTypes.get(file.type);

  if (!extension) {
    throw new ImageUploadValidationError(
      "Unsupported image type. Use JPG, PNG, or WEBP.",
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new ImageUploadValidationError("Image size must be 5MB or less.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedExtension = detectImageExtension(buffer);

  if (!detectedExtension || detectedExtension !== extension) {
    throw new ImageUploadValidationError(
      "The file contents do not match an allowed image type.",
    );
  }

  return {
    buffer,
    extension,
    contentType: file.type,
  };
}
