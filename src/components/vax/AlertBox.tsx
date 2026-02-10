interface AlertBoxProps {
  variant: 'info' | 'warning' | 'success' | 'error';
  icon: string;
  title: string;
  description: string;
}

const variantClass: Record<string, string> = {
  info: 'vax-alert-info',
  warning: 'vax-alert-warning',
  success: 'vax-alert-success',
  error: 'vax-alert-error',
};

const AlertBox = ({ variant, icon, title, description }: AlertBoxProps) => (
  <div className={variantClass[variant]}>
    <span className="text-lg flex-shrink-0">{icon}</span>
    <div>
      <div className="text-[13px] font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
    </div>
  </div>
);

export default AlertBox;
