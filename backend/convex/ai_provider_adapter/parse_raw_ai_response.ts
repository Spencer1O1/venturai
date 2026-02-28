import type { AIOutput } from "./ai_output_schema";
import { validateAIOutput } from "./ai_output_schema";

/**
 * Validates and parses raw AI response into typed AIOutput.
 * Fail fast on invalid structure.
 */
export function parseRawAIResponse(raw: unknown): AIOutput {
  return validateAIOutput(raw);
}
