import { getRiskColor } from '../constants';

export default function RiskBadge({ riskLevel }) {
  const color = getRiskColor(riskLevel);
  const className = `badge badge-${color.toLowerCase()}`;

  return (
    <span className={className} role="status" aria-label={`Risk level: ${riskLevel}`}>
      {riskLevel}
    </span>
  );
}