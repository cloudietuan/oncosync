interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

const StatCard = ({ label, value, sub }: StatCardProps) => (
  <div className="vax-card text-center py-5">
    <div className="text-[28px] font-bold leading-tight text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

export default StatCard;
