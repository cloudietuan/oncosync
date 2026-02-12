import { motion, AnimatePresence } from 'framer-motion';

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
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg"
          >
            <span className="text-white font-bold text-xl leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>◎</span>
          </motion.div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-lg font-bold text-foreground tracking-tight">OncoSync</h1>
            <p className="text-xs text-muted-foreground font-medium">Loading research environment…</p>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'hsl(262, 83%, 58%)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LoadingScreen;
