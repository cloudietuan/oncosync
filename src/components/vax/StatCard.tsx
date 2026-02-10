interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

const StatCard = ({ label, value, sub }: StatCardProps) => (
  <div className="vax-card text-center py-5 px-3">
    <div className="text-2xl font-bold leading-tight text-foreground tracking-tight">{value}</div>
    <div className="text-[11px] text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider">{label}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5 font-normal normal-case tracking-normal">{sub}</div>}
  </div>
);

export default StatCard;
