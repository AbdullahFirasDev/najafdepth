const allowedRemoteImageHosts = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
  "localhost",
  "127.0.0.1",
]);

const safeDataImagePattern = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

export function isSafeImageSrc(input: string | null | undefined) {
  if (!input) {
    return false;
  }

  if (input.startsWith("/") && !input.startsWith("//")) {
    return true;
  }

  if (safeDataImagePattern.test(input)) {
    return true;
  }

  try {
    const url = new URL(input);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      allowedRemoteImageHosts.has(url.hostname)
    );
  } catch {
    return false;
  }
}
