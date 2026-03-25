import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
      <Icon size={24} className="text-muted-foreground/50" />
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="vax-btn-primary mt-4 text-xs py-2 px-4"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
