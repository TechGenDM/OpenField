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
  });
});
