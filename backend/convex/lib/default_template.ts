/** Default template when asset has no template. Ensures at least 1 photo. Notes is a built-in assessment field. */
export const DEFAULT_TEMPLATE = {
  photoDescriptions: ["Overall view of the asset"],
  additionalQuestions: [] as Array<{ key: string; label: string; type: string }>,
};
