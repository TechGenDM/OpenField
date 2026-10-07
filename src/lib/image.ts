/**
 * Allowed MIME types for uploaded field photos
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_RAW_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max raw upload

/**
 * Pure helper to calculate target dimensions scaled so the longest side
 * does not exceed maxDimension (default 1024px), preserving aspect ratio.
 * Images smaller than maxDimension are not enlarged.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension = 1024
): { width: number; height: number } {
  if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
    return { width: 1, height: 1 };
  }

  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Validates file MIME type and raw size before processing.
 */
export function validateImageFile(file: {
  type: string;
  size: number;
}): { ok: true } | { ok: false; reason: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      ok: false,
      reason: `Unsupported image format "${file.type}". Please use JPEG, PNG, or WebP.`,
    };
  }

  if (file.size > MAX_RAW_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      reason: `Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 20 MB.`,
    };
  }

  return { ok: true };
}

/**
 * Browser-only image processor using native HTML5 Canvas.
 * - Resizes image so longest side is <= 1024px.
 * - Renders raw pixel data to an in-memory canvas and exports a fresh JPEG.
 * - Why this strips EXIF: Canvas drawing rasterizes only RGB pixels; the resulting
 *   JPEG exported via toDataURL contains no EXIF, GPS, camera, or timestamp metadata.
 */
export async function processImageFile(
  file: File,
  maxDimension = 1024
): Promise<{ ok: true; dataUrl: string; width: number; height: number } | { ok: false; reason: string }> {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    return validation;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      ok: false,
      reason: "Canvas processing is only available in a browser environment.",
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const { width: targetWidth, height: targetHeight } =
          calculateTargetDimensions(img.naturalWidth, img.naturalHeight, maxDimension);

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve({ ok: false, reason: "Could not obtain 2D canvas context." });
          return;
        }

        // Draw image onto canvas (discards all original EXIF / GPS metadata)
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export fresh clean JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        URL.revokeObjectURL(objectUrl);

        resolve({
          ok: true,
          dataUrl,
          width: targetWidth,
          height: targetHeight,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          ok: false,
          reason: `Failed to process image: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        ok: false,
        reason: "Failed to load image file into browser memory.",
      });
    };

    img.src = objectUrl;
  });
}
