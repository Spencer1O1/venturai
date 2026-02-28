import { getRiskTier, getRiskLabel, RISK_TIER_CLASSES } from "@/lib/risk";

type RiskBadgeProps = {
  riskScore: number;
  showValue?: boolean;
  className?: string;
};

export function RiskBadge({ riskScore, showValue = true, className = "" }: RiskBadgeProps) {
  const tier = getRiskTier(riskScore);
  const label = getRiskLabel(riskScore);
  const classes = RISK_TIER_CLASSES[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${classes} ${className}`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {label}
      {showValue && <span className="opacity-90">({riskScore})</span>}
    </span>
  );
}
