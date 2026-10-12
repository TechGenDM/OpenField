import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveProtocol,
  getProtocol,
  saveReport,
  getReport,
  savePhoto,
  getPhoto,
  deletePhoto,
} from "../src/lib/storage";
import { FieldProtocol, FieldReport } from "../src/lib/schemas";

/**
 * Unit tests for the localStorage persistence layer.
 *
 * OpenField is local-first: there is no remote database, so every one of these
 * functions is the only thing standing between the user's field data and silent
 * loss. The module deliberately guards `typeof window === "undefined"` (server
 * render) and converts quota failures into a typed `QUOTA_EXCEEDED` result, so
 * both branches are covered here alongside the CRUD round-trips.
 *
 * `window` is stubbed with a Map-backed Storage double rather than pulling in a
 * DOM emulator: the module only ever touches `window.localStorage`, and this
 * keeps the suite dependency-free and deterministic.
 */

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  readonly entries: Map<string, string>;
  failNextWriteWith(error: unknown): void;
}

function createFakeStorage(): FakeStorage {
  const entries = new Map<string, string>();
  let pendingError: unknown = null;

  return {
    entries,
    failNextWriteWith(error: unknown) {
      pendingError = error;
    },
    getItem(key: string) {
      return entries.has(key) ? (entries.get(key) as string) : null;
    },
    setItem(key: string, value: string) {
      if (pendingError) {
        const error = pendingError;
        pendingError = null;
        throw error;
      }
      entries.set(key, value);
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}

const PROTOCOL_KEY_PREFIX = "openfield:protocol:";
const PROTOCOL_INDEX_KEY = "openfield:protocols";
const REPORT_KEY_PREFIX = "openfield:report:";
const PHOTO_KEY_PREFIX = "openfield:photo:";

function makeProtocol(id: string, title = "Urban Tree Canopy Study"): FieldProtocol {
  return {
    id,
    title,
    researchQuestion: "How does tree shade influence ambient ground conditions?",
    minutes: 30,
    type: "nature",
    steps: [
      { id: "step-1", instruction: "Find a tree with open ground beneath it.", evidence: "photo", required: true },
      { id: "step-2", instruction: "Note the shade pattern on the ground.", evidence: "note", required: true },
      { id: "step-3", instruction: "Measure the ground temperature in shade.", evidence: "measurement", required: false },
      { id: "step-4", instruction: "Measure the ground temperature in sun.", evidence: "measurement", required: true },
    ],
    evidenceNeeded: ["Shaded ground photo", "Two temperature readings"],
    safetyNote: "Stay on public paths and do not touch plants you cannot identify.",
    audioScript: "You are looking for how shade changes the ground beneath a tree.",
  };
}

function makeReport(): FieldReport {
  return {
    findings: [
      { claim: "Shaded ground was cooler than sunlit ground.", evidenceRefs: ["step-3", "step-4"], confidence: "medium" },
    ],
    observed: ["Ground temperature in shade: 21 C", "Ground temperature in sun: 27 C"],
    inferred: ["Tree canopy reduces ground temperature during midday."],
    uncertain: ["Whether the difference holds in the evening."],
    evidenceSummary: { photos: 1, notes: 1, measurements: 2 },
    nextQuestion: "How quickly does the shaded ground warm after the sun moves?",
  };
}

let storage: FakeStorage;

beforeEach(() => {
  storage = createFakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("storage without a browser window (server render)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports success and returns null instead of touching localStorage", () => {
    expect(saveProtocol(makeProtocol("proto-ssr"))).toEqual({ ok: true });
    expect(getProtocol("proto-ssr")).toBeNull();
    expect(saveReport("proto-ssr", makeReport())).toEqual({ ok: true });
    expect(getReport("proto-ssr")).toBeNull();
    expect(savePhoto("photo-ssr", "data:image/jpeg;base64,AAAA")).toEqual({ ok: true });
    expect(getPhoto("photo-ssr")).toBeNull();
    expect(() => deletePhoto("photo-ssr")).not.toThrow();
  });
});

describe("protocol persistence", () => {
  it("saves a protocol under its prefixed key and reads it back", () => {
    const protocol = makeProtocol("proto-1");

    expect(saveProtocol(protocol)).toEqual({ ok: true });

    expect(storage.entries.has(`${PROTOCOL_KEY_PREFIX}proto-1`)).toBe(true);
    expect(getProtocol("proto-1")).toEqual(protocol);
  });

  it("indexes a new protocol at the front of openfield:protocols", () => {
    saveProtocol(makeProtocol("proto-1"));
    saveProtocol(makeProtocol("proto-2"));

    expect(JSON.parse(storage.getItem(PROTOCOL_INDEX_KEY) as string)).toEqual(["proto-2", "proto-1"]);
  });

  it("does not add a duplicate id when an existing protocol is saved again", () => {
    saveProtocol(makeProtocol("proto-1", "First title"));
    saveProtocol(makeProtocol("proto-1", "Updated title"));

    expect(JSON.parse(storage.getItem(PROTOCOL_INDEX_KEY) as string)).toEqual(["proto-1"]);
    expect(getProtocol("proto-1")?.title).toBe("Updated title");
  });

  it("returns null for a protocol that was never stored", () => {
    expect(getProtocol("missing")).toBeNull();
  });

  it("returns null and does not throw when the stored payload is not JSON", () => {
    storage.setItem(`${PROTOCOL_KEY_PREFIX}proto-1`, "{not json");

    expect(getProtocol("proto-1")).toBeNull();
  });

  it("returns null when the stored payload is JSON but fails the schema", () => {
    // Tampered or stale payload: valid JSON, but only two steps (schema wants 4-6).
    storage.setItem(
      `${PROTOCOL_KEY_PREFIX}proto-1`,
      JSON.stringify({
        ...makeProtocol("proto-1"),
        steps: makeProtocol("proto-1").steps.slice(0, 2),
      })
    );

    expect(getProtocol("proto-1")).toBeNull();
  });

  it("returns null when a required field is missing from the stored payload", () => {
    const { safetyNote, ...withoutSafetyNote } = makeProtocol("proto-1");
    storage.setItem(`${PROTOCOL_KEY_PREFIX}proto-1`, JSON.stringify(withoutSafetyNote));

    expect(safetyNote).toBeTruthy();
    expect(getProtocol("proto-1")).toBeNull();
  });
});

describe("report persistence", () => {
  it("saves a report keyed by protocol id and reads it back", () => {
    const report = makeReport();

    expect(saveReport("proto-1", report)).toEqual({ ok: true });

    expect(storage.entries.has(`${REPORT_KEY_PREFIX}proto-1`)).toBe(true);
    expect(getReport("proto-1")).toEqual(report);
  });

  it("returns null for a report that was never stored", () => {
    expect(getReport("proto-1")).toBeNull();
  });

  it("returns null when the stored report is malformed", () => {
    storage.setItem(`${REPORT_KEY_PREFIX}proto-1`, JSON.stringify({ findings: "not-an-array" }));

    expect(getReport("proto-1")).toBeNull();
  });

  it("keeps protocols and reports under separate keys", () => {
    saveProtocol(makeProtocol("shared-id"));
    saveReport("shared-id", makeReport());

    expect(storage.entries.has(`${PROTOCOL_KEY_PREFIX}shared-id`)).toBe(true);
    expect(storage.entries.has(`${REPORT_KEY_PREFIX}shared-id`)).toBe(true);
    expect(getProtocol("shared-id")).not.toBeNull();
    expect(getReport("shared-id")).not.toBeNull();
  });
});

describe("photo persistence", () => {
  const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

  it("saves, reads back and deletes a photo data URL", () => {
    expect(savePhoto("photo-1", dataUrl)).toEqual({ ok: true });
    expect(storage.entries.has(`${PHOTO_KEY_PREFIX}photo-1`)).toBe(true);

    expect(getPhoto("photo-1")).toBe(dataUrl);

    deletePhoto("photo-1");

    expect(getPhoto("photo-1")).toBeNull();
    expect(storage.entries.has(`${PHOTO_KEY_PREFIX}photo-1`)).toBe(false);
  });

  it("returns null for a photo that was never stored", () => {
    expect(getPhoto("missing")).toBeNull();
  });

  it("deleting an unknown photo is a no-op", () => {
    expect(() => deletePhoto("missing")).not.toThrow();
    expect(storage.entries.size).toBe(0);
  });

  it("leaves other photos untouched when one is deleted", () => {
    savePhoto("photo-1", dataUrl);
    savePhoto("photo-2", dataUrl);

    deletePhoto("photo-1");

    expect(getPhoto("photo-2")).toBe(dataUrl);
  });
});

describe("quota handling", () => {
  it("maps a QuotaExceededError DOMException to QUOTA_EXCEEDED for protocols", () => {
    storage.failNextWriteWith(new DOMException("The quota has been exceeded.", "QuotaExceededError"));

    expect(saveProtocol(makeProtocol("proto-1"))).toEqual({ ok: false, error: "QUOTA_EXCEEDED" });
  });

  it("maps a QuotaExceededError DOMException to QUOTA_EXCEEDED for photos", () => {
    storage.failNextWriteWith(new DOMException("The quota has been exceeded.", "QuotaExceededError"));

    expect(savePhoto("photo-1", "data:image/jpeg;base64,AAAA")).toEqual({ ok: false, error: "QUOTA_EXCEEDED" });
  });

  it("maps a QuotaExceededError DOMException to QUOTA_EXCEEDED for reports", () => {
    storage.failNextWriteWith(new DOMException("The quota has been exceeded.", "QuotaExceededError"));

    expect(saveReport("proto-1", makeReport())).toEqual({ ok: false, error: "QUOTA_EXCEEDED" });
  });

  it("recognises the Gecko legacy quota name", () => {
    storage.failNextWriteWith(new DOMException("storage full", "NS_ERROR_DOM_QUOTA_REACHED"));

    expect(savePhoto("photo-1", "data:image/jpeg;base64,AAAA")).toEqual({ ok: false, error: "QUOTA_EXCEEDED" });
  });

  it("recognises the legacy numeric quota code when the name is unrecognised", () => {
    // Blink/WebKit historically reported the quota failure through `code` 22.
    const legacy = new DOMException("Setting the value failed.", "DataError");
    Object.defineProperty(legacy, "code", { value: 22 });

    storage.failNextWriteWith(legacy);

    expect(saveReport("proto-1", makeReport())).toEqual({ ok: false, error: "QUOTA_EXCEEDED" });
  });

  it("returns the underlying message for a non-quota write failure", () => {
    storage.failNextWriteWith(new Error("SecurityError: storage is disabled"));

    expect(saveProtocol(makeProtocol("proto-1"))).toEqual({
      ok: false,
      error: "SecurityError: storage is disabled",
    });
  });

  it("stringifies a non-Error write failure", () => {
    storage.failNextWriteWith("blocked");

    expect(saveReport("proto-1", makeReport())).toEqual({ ok: false, error: "blocked" });
  });

  it("keeps the protocol index intact when the protocol body write fails", () => {
    saveProtocol(makeProtocol("proto-existing"));
    storage.failNextWriteWith(new DOMException("The quota has been exceeded.", "QuotaExceededError"));

    expect(saveProtocol(makeProtocol("proto-new"))).toEqual({ ok: false, error: "QUOTA_EXCEEDED" });

    expect(JSON.parse(storage.getItem(PROTOCOL_INDEX_KEY) as string)).toEqual(["proto-existing"]);
    expect(storage.entries.has(`${PROTOCOL_KEY_PREFIX}proto-new`)).toBe(false);
  });
});
