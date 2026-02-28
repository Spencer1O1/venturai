export const theme = {
  // Backgrounds
  background: "#0D1117",
  backgroundElevated: "#161B22",
  backgroundCard: "#21262D",
  backgroundInput: "#0D1117",

  // Primary accent – electric cyan-blue (glow/interactive)
  accent: "#00ACE6",
  accentMuted: "rgba(0, 172, 230, 0.6)",
  accentGlow: "rgba(0, 172, 230, 0.25)",

  // Secondary – metallic silvery-grey
  text: "#E6EDF3",
  textMuted: "#8B949E",
  textSubtle: "#6E7681",

  // Borders and dividers
  border: "#30363D",
  borderMuted: "#21262D",

  // Semantic
  error: "#F87171",
  errorBg: "rgba(248, 113, 113, 0.15)",
  success: "#00D68F",
  successBg: "rgba(0, 214, 143, 0.15)",
  warning: "#FBBF24",

  // Buttons
  buttonPrimary: "#00ACE6",
  buttonPrimaryPressed: "#0099CC",
  buttonSecondary: "#21262D",
  buttonOutline: "#30363D",
  buttonOutlineText: "#8B949E",

  // Button dimensions (consistent across app)
  buttonPaddingVertical: 14,
  buttonPaddingHorizontal: 24,
  buttonBorderRadius: 10,
  buttonFontSize: 16,
  buttonFontWeight: "600" as const,
} as const;
