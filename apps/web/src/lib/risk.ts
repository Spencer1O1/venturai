/**
 * Risk score 0–100 → display tier and color for dashboard.
 * riskScore is bounded 0–100; riskLoad is unbounded sum of work item values.
 */
export function getRiskTier(
  riskScore: number,
): "low" | "medium" | "high" | "critical" {
  if (riskScore <= 25) return "low";
  if (riskScore <= 50) return "medium";
  if (riskScore <= 75) return "high";
  return "critical";
}

export function getRiskLabel(riskScore: number): string {
  const tier = getRiskTier(riskScore);
  const labels: Record<typeof tier, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[tier];
}

export const RISK_TIER_CLASSES = {
  low: "bg-risk-low/20 text-risk-low border-risk-low/40",
  medium: "bg-risk-medium/20 text-risk-medium border-risk-medium/40",
  high: "bg-risk-high/20 text-risk-high border-risk-high/40",
  critical: "bg-risk-critical/20 text-risk-critical border-risk-critical/40",
} as const;

/** Heatmap colors (inline styles): theme success → warning → orange → error */
export const RISK_HEATMAP_STYLES = {
  low: {
    backgroundColor: "#00D68F",
    color: "#052e16",
  },
  medium: {
    backgroundColor: "#FBBF24",
    color: "#422006",
  },
  high: {
    backgroundColor: "#f97316",
    color: "#ffffff",
  },
  critical: {
    backgroundColor: "#F87171",
    color: "#ffffff",
  },
} as const;
