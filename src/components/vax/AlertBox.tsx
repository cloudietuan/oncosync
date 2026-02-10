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
    <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
    <div>
      <div className="text-[13px] font-semibold tracking-tight">{title}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
    </div>
  </div>
);

export default AlertBox;
