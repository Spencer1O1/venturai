import { getRiskTier, RISK_HEATMAP_STYLES } from "@/lib/risk";

type RiskHeatmapPillProps = {
  riskScore: number;
  className?: string;
};

/** Colored heatmap pill for risk 0–100. Use in tables (RiskHeatmapCell) or inline. */
export function RiskHeatmapPill({ riskScore, className = "" }: RiskHeatmapPillProps) {
  const tier = getRiskTier(riskScore);
  const styles = RISK_HEATMAP_STYLES[tier];

  return (
    <div
      className={`flex min-w-[4rem] items-center justify-center rounded-md px-3 py-2 font-bold tabular-nums shadow-md ${className}`}
      style={styles}
      title={`Risk: ${riskScore}/100`}
    >
      {riskScore}
    </div>
  );
}

type RiskHeatmapCellProps = {
  riskScore: number;
  className?: string;
};

export function RiskHeatmapCell({ riskScore, className = "" }: RiskHeatmapCellProps) {
  return (
    <td className={`px-6 py-3 ${className}`}>
      <RiskHeatmapPill riskScore={riskScore} />
    </td>
  );
}
