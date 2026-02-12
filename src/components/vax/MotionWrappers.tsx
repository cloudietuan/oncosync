import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

const fadeInItem = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

export const StaggerGrid = ({ children, className = '' }: StaggerGridProps) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {children}
  </motion.div>
);

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variant?: 'fadeUp' | 'fadeIn';
}

export const StaggerItem = ({ children, className = '', variant = 'fadeUp' }: StaggerItemProps) => (
  <motion.div
    variants={variant === 'fadeUp' ? fadeUpItem : fadeInItem}
    className={className}
  >
    {children}
  </motion.div>
);

interface FadeSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeSection = ({ children, className = '', delay = 0 }: FadeSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut', delay }}
    className={className}
  >
    {children}
  </motion.div>
);
