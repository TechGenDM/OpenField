import { Ollama } from "ollama";
import { AppError } from "../schemas";

/**
 * Single configured Ollama client on the server.
 * Reads host from OLLAMA_HOST (defaults to http://localhost:11434).
 */
const host = process.env.OLLAMA_HOST || "http://localhost:11434";
export const ollama = new Ollama({ host });

/**
 * Returns the configured model name.
 * Fixed default is gemma4:e4b per ARCHITECTURE.md and DECISIONS.md.
 */
export function getModelName(): string {
  return process.env.OPENFIELD_MODEL || "gemma4:e4b";
}

/**
 * Maps raw client/fetch errors into standard typed OpenField errors.
 */
export function mapOllamaError(err: unknown): AppError {
  const message = err instanceof Error ? err.message : String(err);

  if (
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("Failed to fetch") ||
    message.includes("connect ECONNREFUSED")
  ) {
    return {
      code: "OLLAMA_UNREACHABLE",
      message: `Could not connect to Ollama at ${host}. Please ensure Ollama is running.`,
      details: message,
    };
  }

  if (
    message.toLowerCase().includes("not found") ||
    message.includes("404") ||
    message.includes("does not exist")
  ) {
    const model = getModelName();
    return {
      code: "MODEL_NOT_FOUND",
      message: `Model "${model}" was not found in Ollama. Pull it using "ollama pull ${model}".`,
      details: message,
    };
  }

  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return {
      code: "TIMEOUT",
      message: "Request to Ollama timed out.",
      details: message,
    };
  }

  return {
    code: "INVALID_MODEL_OUTPUT",
    message: "Failed to generate or validate protocol output.",
    details: message,
  };
}
