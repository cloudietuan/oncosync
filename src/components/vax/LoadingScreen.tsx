import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '@/assets/logo-icon.png';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => (
  <AnimatePresence>
    {isLoading && (
      <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-8"
        >
          {/* Logo with dual orbit rings */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid transparent',
                borderTopColor: 'hsl(var(--primary))',
                borderRightColor: 'hsl(var(--primary) / 0.2)',
              }}
            />
            {/* Inner ring (counter-rotate) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full"
              style={{
                inset: '6px',
                border: '1.5px solid transparent',
                borderBottomColor: 'hsl(var(--primary) / 0.5)',
                borderLeftColor: 'hsl(var(--primary) / 0.15)',
              }}
            />
            {/* Glow backdrop */}
            <div
              className="absolute w-16 h-16 rounded-full blur-xl opacity-20"
              style={{ background: 'hsl(var(--primary))' }}
            />
            {/* Logo */}
            <motion.img
              src={logoImg}
              alt="OncoSync logo"
              animate={{ scale: [0.9, 1, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 object-contain relative z-10"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-xl font-bold text-foreground tracking-tight font-sans">
              OncoSync
            </h1>
            <p className="text-xs text-muted-foreground">
              Initializing research environment…
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-52 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LoadingScreen;
