import { v2 as cloudinary } from "cloudinary";

const isConfigured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  return isConfigured;
}

export function getUploadSignature(folder = "alomq-najafi") {
  if (!isConfigured) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      timestamp,
    },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}

export async function uploadImageBuffer(input: {
  buffer: Buffer;
  folder?: string;
  filename?: string;
}) {
  if (!isConfigured) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  return new Promise<{ secureUrl: string; publicId: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: input.folder ?? "alomq-najafi",
          resource_type: "image",
          public_id: input.filename,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Image upload failed."));
            return;
          }

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      stream.end(input.buffer);
    },
  );
}
