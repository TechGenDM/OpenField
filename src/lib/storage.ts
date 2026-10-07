import { FieldProtocol, FieldProtocolSchema } from "./schemas";

const STORAGE_KEY_PREFIX = "openfield:protocol:";
const PROTOCOL_INDEX_KEY = "openfield:protocols";

/**
 * Persists a FieldProtocol into browser localStorage without any external database.
 * Falls back safely if executed in SSR or if storage is unavailable.
 */
export function saveProtocol(protocol: FieldProtocol): void {
  if (typeof window === "undefined") return;

  try {
    const raw = JSON.stringify(protocol);
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${protocol.id}`, raw);

    // Update index of known protocol IDs
    const indexRaw = window.localStorage.getItem(PROTOCOL_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(protocol.id)) {
      ids.unshift(protocol.id);
      window.localStorage.setItem(PROTOCOL_INDEX_KEY, JSON.stringify(ids));
    }
  } catch (error) {
    console.error("Failed to save protocol to localStorage:", error);
  }
}

/**
 * Loads a protocol by ID and validates its structure against FieldProtocolSchema.
 */
export function getProtocol(id: string): FieldProtocol | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
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
