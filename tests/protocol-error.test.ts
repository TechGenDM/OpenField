import { describe, it, expect } from "vitest";
import { mapOllamaError } from "../src/lib/ai/ollama";

describe("Ollama error mapping", () => {
  it("maps connection refused to OLLAMA_UNREACHABLE", () => {
    const err = new Error("connect ECONNREFUSED 127.0.0.1:11434");
    const mapped = mapOllamaError(err);
    expect(mapped.code).toBe("OLLAMA_UNREACHABLE");
    expect(mapped.message).toContain("Could not connect to Ollama");
  });

  it("maps model not found to MODEL_NOT_FOUND", () => {
    const err = new Error('model "gemma4:e4b" not found, try pulling it first');
    const mapped = mapOllamaError(err);
    expect(mapped.code).toBe("MODEL_NOT_FOUND");
    expect(mapped.message).toContain("was not found in Ollama");
  });

  it("maps timeout errors to TIMEOUT", () => {
    const err = new Error("The operation timed out (ETIMEDOUT)");
    const mapped = mapOllamaError(err);
    expect(mapped.code).toBe("TIMEOUT");
    expect(mapped.message).toContain("timed out");
  });

  it("maps unhandled or unexpected error to INVALID_MODEL_OUTPUT", () => {
    const err = new Error("Unexpected token < in JSON at position 0");
    const mapped = mapOllamaError(err);
    expect(mapped.code).toBe("INVALID_MODEL_OUTPUT");
  });
});
