"use client";

import Image from "next/image";
import { LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSafeImageSrc } from "@/lib/utils";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  description?: string;
  previewClassName?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  folder = "articles",
  description,
  previewClassName = "aspect-[16/10]",
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP.");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error("حجم الصورة يتجاوز 8 ميغابايت.");
      return;
    }

    setIsUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as {
        url?: string;
        message?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.message || "تعذر رفع الصورة.");
      }

      onChange(payload.url);
      toast.success("تم رفع الصورة بنجاح.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={inputId} className="text-sm font-semibold">
          {label}
        </label>
        {description ? (
          <p className="text-muted-foreground text-sm leading-7">
            {description}
          </p>
        ) : null}
      </div>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadFile(file);
          }
        }}
      />

      <Card className="space-y-4 p-4">
        <div
          className={`border-border bg-muted/20 relative overflow-hidden rounded-[1.5rem] border border-dashed ${previewClassName}`}
        >
          {value ? (
            <Image
              src={getSafeImageSrc(
                value,
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80",
              )}
              alt={label}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="text-muted-foreground flex h-full min-h-48 items-center justify-center px-6 text-center text-sm leading-7">
              اختر صورة من جهازك ليتم رفعها وربطها تلقائيًا داخل المنصة.
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {isUploading ? "جارٍ الرفع..." : "رفع صورة من الجهاز"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange("")}
              disabled={isUploading}
              className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto dark:border-red-900/50 dark:text-red-300"
            >
              <Trash2 className="size-4" />
              إزالة الصورة
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
