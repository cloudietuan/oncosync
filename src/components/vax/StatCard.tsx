import InfoTooltip from './InfoTooltip';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tooltip?: { term: string; definition: string };
}

const StatCard = ({ label, value, sub, tooltip }: StatCardProps) => (
  <div className="vax-card text-center py-5 px-3">
    <div className="text-2xl font-bold leading-tight text-foreground tracking-tight">{value}</div>
    <div className="flex items-center justify-center gap-1 mt-1.5">
      <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
      {tooltip && <InfoTooltip term={tooltip.term} definition={tooltip.definition} />}
    </div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5 font-normal normal-case tracking-normal">{sub}</div>}
  </div>
);

export default StatCard;
