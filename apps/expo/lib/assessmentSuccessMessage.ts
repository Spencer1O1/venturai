/**
 * Build user-facing success message from AI analysis result.
 */
export function buildAssessmentSuccessMessage(aiAnalysis: {
  summary: string;
  clarifying_questions: string[];
}): string {
  const parts: string[] = [aiAnalysis.summary];
  if (aiAnalysis.clarifying_questions.length > 0) {
    parts.push(
      "\n\nThe AI had follow-up questions (assessment was still saved):",
      ...aiAnalysis.clarifying_questions.map((q) => `• ${q}`),
    );
  }
  return parts.join("\n");
}
