"use client";

import {
  AlignCenter,
  AlignRight,
  Bold,
  Heading2,
  ImageIcon,
  Italic,
  Link2,
  LoaderCircle,
  Pilcrow,
  Quote,
  UnderlineIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const editorClassName =
  "min-h-[260px] overflow-hidden rounded-[1.5rem] border border-border bg-input px-4 py-4 text-base leading-9 outline-none sm:min-h-[320px] sm:px-5";

export function ArticleEditor({ value, onChange }: ArticleEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder:
          "ابدأ كتابة المقالة هنا، مع دعم كامل للعربية واتجاه RTL...",
      }),
      Image,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["right", "center"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `${editorClassName} prose prose-stone max-w-none dark:prose-invert`,
        dir: "rtl",
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return <div className={cn(editorClassName, "bg-muted/30 animate-pulse")} />;
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("أدخل رابطًا صالحًا", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const uploadInlineImage = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP.");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error("حجم الصورة يتجاوز 5 ميغابايت.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "articles/inline");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        url?: string;
        message?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.message || "تعذر رفع الصورة.");
      }

      editor.chain().focus().setImage({ src: payload.url }).run();
      toast.success("تم إدراج الصورة داخل المقال.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setIsUploadingImage(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const toolbar = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      label: "عريض",
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      label: "مائل",
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
      label: "تحته خط",
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      label: "عنوان",
    },
    {
      icon: Pilcrow,
      action: () => editor.chain().focus().setParagraph().run(),
      active: editor.isActive("paragraph"),
      label: "فقرة",
    },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      label: "اقتباس",
    },
    {
      icon: AlignRight,
      action: () => editor.chain().focus().setTextAlign("right").run(),
      active: editor.isActive({ textAlign: "right" }),
      label: "محاذاة يمين",
    },
    {
      icon: AlignCenter,
      action: () => editor.chain().focus().setTextAlign("center").run(),
      active: editor.isActive({ textAlign: "center" }),
      label: "محاذاة وسط",
    },
    {
      icon: Link2,
      action: addLink,
      active: editor.isActive("link"),
      label: "رابط",
    },
  ];

  return (
    <div className="space-y-3">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadInlineImage(file);
          }
        }}
      />

      <div className="scrollbar-none border-border bg-card flex gap-2 overflow-x-auto rounded-[1.5rem] border p-3 sm:flex-wrap sm:overflow-visible">
        {toolbar.map((item, index) => (
          <Button
            key={`${item.label}-${index}`}
            type="button"
            variant={item.active ? "default" : "outline"}
            size="icon"
            aria-label={item.label}
            onClick={item.action}
            className="shrink-0"
          >
            <item.icon className="size-4" />
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="رفع صورة"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingImage}
          className="shrink-0"
        >
          {isUploadingImage ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ImageIcon className="size-4" />
          )}
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
