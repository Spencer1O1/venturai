import { getRiskTier, RISK_HEATMAP_STYLES } from "@/lib/risk";

type RiskHeatmapCellProps = {
  riskScore: number;
  className?: string;
};

export function RiskHeatmapCell({ riskScore, className = "" }: RiskHeatmapCellProps) {
  const tier = getRiskTier(riskScore);
  const styles = RISK_HEATMAP_STYLES[tier];

  return (
    <td className={`px-6 py-3 ${className}`}>
      <div
        className="flex min-w-[4rem] items-center justify-center rounded-md px-3 py-2 font-bold tabular-nums shadow-md"
        style={styles}
        title={`Risk: ${riskScore}/100`}
      >
        {riskScore}
      </div>
    </td>
  );
}
