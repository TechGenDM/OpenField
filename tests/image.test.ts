import { describe, it, expect } from "vitest";
import {
  calculateTargetDimensions,
  validateImageFile,
  ALLOWED_IMAGE_TYPES,
  MAX_RAW_IMAGE_SIZE_BYTES,
} from "../src/lib/image";

describe("Image Processing & Dimension Calculations", () => {
  describe("calculateTargetDimensions", () => {
    it("scales landscape images so longest side is at most maxDimension", () => {
      const result = calculateTargetDimensions(2048, 1024, 1024);
      expect(result).toEqual({ width: 1024, height: 512 });
    });

    it("scales portrait images so longest side is at most maxDimension", () => {
      const result = calculateTargetDimensions(1080, 1920, 1024);
      expect(result.height).toBe(1024);
      expect(result.width).toBe(Math.round(1080 * (1024 / 1920)));
      expect(result.width).toBeLessThanOrEqual(1024);
    });

    it("scales square images exactly to maxDimension", () => {
      const result = calculateTargetDimensions(3000, 3000, 1024);
      expect(result).toEqual({ width: 1024, height: 1024 });
    });

    it("does not upscale images that are already smaller than maxDimension", () => {
      const result = calculateTargetDimensions(800, 600, 1024);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it("does not alter images whose longest side is exactly maxDimension", () => {
      const result = calculateTargetDimensions(1024, 768, 1024);
      expect(result).toEqual({ width: 1024, height: 768 });
    });

    it("gracefully handles invalid, zero, or negative inputs", () => {
      expect(calculateTargetDimensions(0, 500)).toEqual({ width: 1, height: 1 });
      expect(calculateTargetDimensions(-100, -200)).toEqual({ width: 1, height: 1 });
      expect(calculateTargetDimensions(NaN, 100)).toEqual({ width: 1, height: 1 });
    });
  });

  describe("validateImageFile", () => {
    it("accepts supported image MIME types (JPEG, PNG, WebP)", () => {
      for (const mime of ALLOWED_IMAGE_TYPES) {
        const res = validateImageFile({ type: mime, size: 1024 * 1024 });
        expect(res.ok).toBe(true);
      }
    });

    it("rejects unsupported MIME types", () => {
      const invalidTypes = [
        "image/gif",
        "image/svg+xml",
        "image/bmp",
        "application/pdf",
        "text/plain",
      ];
      for (const mime of invalidTypes) {
        const res = validateImageFile({ type: mime, size: 1024 });
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.reason).toContain("Unsupported image format");
        }
      }
    });

    it("rejects files exceeding the 20 MB size limit", () => {
      const res = validateImageFile({
        type: "image/jpeg",
        size: MAX_RAW_IMAGE_SIZE_BYTES + 1024,
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("Image file is too large");
      }
    });

    it("accepts files within the 20 MB limit", () => {
      const res = validateImageFile({
        type: "image/jpeg",
        size: 5 * 1024 * 1024,
      });
      expect(res.ok).toBe(true);
    });

    it("accepts a file exactly at the 20 MB limit and rejects one byte more", () => {
      expect(validateImageFile({ type: "image/png", size: MAX_RAW_IMAGE_SIZE_BYTES }).ok).toBe(true);

      const overByOneByte = validateImageFile({ type: "image/png", size: MAX_RAW_IMAGE_SIZE_BYTES + 1 });
      expect(overByOneByte.ok).toBe(false);
      if (!overByOneByte.ok) {
        expect(overByOneByte.reason).toContain("20.0 MB");
      }
    });

    it("accepts a zero-byte file (no minimum size is enforced)", () => {
      // Documented current behaviour: only the MIME type and the upper size
      // bound are checked, so an empty file passes this gate.
      expect(validateImageFile({ type: "image/jpeg", size: 0 })).toEqual({ ok: true });
    });

    it("still rejects a zero-byte file whose type is unsupported", () => {
      const res = validateImageFile({ type: "image/gif", size: 0 });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain("Unsupported image format");
      }
    });

    it("matches MIME types case-sensitively", () => {
      for (const mime of ["IMAGE/JPEG", "Image/Png", "image/WEBP", "image/JPG"]) {
        const res = validateImageFile({ type: mime, size: 1024 });
        expect(res.ok).toBe(false);
      }
    });

    it("rejects an empty MIME type", () => {
      const res = validateImageFile({ type: "", size: 1024 });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain('Unsupported image format ""');
      }
    });
  });

  describe("calculateTargetDimensions boundary cases", () => {
    it("keeps a 1 x 1 pixel image untouched", () => {
      expect(calculateTargetDimensions(1, 1)).toEqual({ width: 1, height: 1 });
    });

    it("scales an extreme landscape panorama", () => {
      expect(calculateTargetDimensions(10000, 50)).toEqual({ width: 1024, height: 5 });
    });

    it("scales an extreme portrait panorama", () => {
      expect(calculateTargetDimensions(50, 10000)).toEqual({ width: 5, height: 1024 });
    });

    it("never collapses the short side to zero", () => {
      expect(calculateTargetDimensions(100000, 1)).toEqual({ width: 1024, height: 1 });
    });

    it("honours a custom maxDimension", () => {
      expect(calculateTargetDimensions(2048, 1024, 512)).toEqual({ width: 512, height: 256 });
    });

    it("rounds the scaled sides to whole pixels", () => {
      expect(calculateTargetDimensions(1000, 333, 100)).toEqual({ width: 100, height: 33 });
    });

    it("rounds fractional dimensions that are already within the limit", () => {
      expect(calculateTargetDimensions(800.6, 600.4)).toEqual({ width: 801, height: 600 });
    });

    it("returns 1 x 1 for NaN and non-positive inputs", () => {
      expect(calculateTargetDimensions(NaN, NaN)).toEqual({ width: 1, height: 1 });
      expect(calculateTargetDimensions(0, 1024)).toEqual({ width: 1, height: 1 });
    });
  });
});
