import type { AIResult } from "../types";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";

export function parseRawAIResponse(raw: unknown): AIResult {
  if (!isRecord(raw)) {
    throw new Error("Invalid response format");
  }
  const result: AIResult = {};
  return result;
}
