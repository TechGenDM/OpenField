import {
  FieldProtocol,
  FieldProtocolSchema,
  FieldReport,
  FieldReportSchema,
} from "./schemas";

const PROTOCOL_KEY_PREFIX = "openfield:protocol:";
const REPORT_KEY_PREFIX = "openfield:report:";
const PHOTO_KEY_PREFIX = "openfield:photo:";
const PROTOCOL_INDEX_KEY = "openfield:protocols";

export type StorageResult =
  | { ok: true }
  | { ok: false; error: "QUOTA_EXCEEDED" | string };

function isQuotaError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err.code === 22
    );
  }
  const str = String(err).toLowerCase();
  return str.includes("quota") || str.includes("storage full");
}

/**
 * Persists a FieldProtocol into browser localStorage without any external database.
 */
export function saveProtocol(protocol: FieldProtocol): StorageResult {
  if (typeof window === "undefined") return { ok: true };

  try {
    const raw = JSON.stringify(protocol);
    window.localStorage.setItem(`${PROTOCOL_KEY_PREFIX}${protocol.id}`, raw);

    const indexRaw = window.localStorage.getItem(PROTOCOL_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(protocol.id)) {
      ids.unshift(protocol.id);
      window.localStorage.setItem(PROTOCOL_INDEX_KEY, JSON.stringify(ids));
    }
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, error: "QUOTA_EXCEEDED" };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Loads a protocol by ID and validates its structure against FieldProtocolSchema.
 */
export function getProtocol(id: string): FieldProtocol | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${PROTOCOL_KEY_PREFIX}${id}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const result = FieldProtocolSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("Invalid protocol in localStorage:", result.error);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error("Failed to load protocol from localStorage:", error);
    return null;
  }
}

/**
 * Persists a FieldReport into browser localStorage.
 */
export function saveReport(
  protocolId: string,
  report: FieldReport
): StorageResult {
  if (typeof window === "undefined") return { ok: true };

  try {
    const raw = JSON.stringify(report);
    window.localStorage.setItem(`${REPORT_KEY_PREFIX}${protocolId}`, raw);
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, error: "QUOTA_EXCEEDED" };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Loads a FieldReport by study ID and validates with FieldReportSchema.
 */
export function getReport(protocolId: string): FieldReport | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${REPORT_KEY_PREFIX}${protocolId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const result = FieldReportSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("Invalid field report in localStorage:", result.error);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error("Failed to load report from localStorage:", error);
    return null;
  }
}

/**
 * Stores a processed base64 photo data URL with graceful quota exception handling.
 */
export function savePhoto(photoId: string, dataUrl: string): StorageResult {
  if (typeof window === "undefined") return { ok: true };

  try {
    window.localStorage.setItem(`${PHOTO_KEY_PREFIX}${photoId}`, dataUrl);
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn(`Storage quota exceeded while saving photo "${photoId}".`);
      return { ok: false, error: "QUOTA_EXCEEDED" };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Retrieves a stored photo data URL by photo ID.
 */
export function getPhoto(photoId: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(`${PHOTO_KEY_PREFIX}${photoId}`);
  } catch (error) {
    console.error("Failed to load photo from localStorage:", error);
    return null;
  }
}

/**
 * Deletes a stored photo by photo ID.
 */
export function deletePhoto(photoId: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(`${PHOTO_KEY_PREFIX}${photoId}`);
  } catch (error) {
    console.error("Failed to delete photo from localStorage:", error);
  }
}
