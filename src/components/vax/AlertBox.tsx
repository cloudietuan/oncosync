import { motion } from 'framer-motion';

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

const glowColor: Record<string, string> = {
  info: '0 0 0 0 transparent',
  warning: '0 0 12px -2px hsl(38, 92%, 50%, 0.25)',
  success: '0 0 12px -2px hsl(160, 84%, 39%, 0.25)',
  error: '0 0 12px -2px hsl(0, 84%, 60%, 0.3)',
};

const AlertBox = ({ variant, icon, title, description }: AlertBoxProps) => (
  <motion.div
    className={variantClass[variant]}
    initial={{ opacity: 0, y: 8, boxShadow: glowColor[variant] }}
    animate={{ opacity: 1, y: 0, boxShadow: '0 0 0 0 transparent' }}
    transition={{ duration: 0.5, ease: 'easeOut', boxShadow: { duration: 1.5, delay: 0.3 } }}
  >
    <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
    <div>
      <div className="text-[13px] font-semibold tracking-tight">{title}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
    </div>
  </motion.div>
);

export default AlertBox;
