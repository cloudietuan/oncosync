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
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
      >
        {/* Subtle background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative flex flex-col items-center gap-10"
        >
          {/* DNA helix animation */}
          <div className="relative w-16 h-28 flex items-center justify-center">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className="absolute w-full flex items-center justify-between"
                style={{ top: `${i * 14.28}%` }}
              >
                <motion.div
                  animate={{
                    x: [0, 20, 0, -20, 0],
                    scale: [0.6, 1, 0.6, 1, 0.6],
                    opacity: [0.3, 1, 0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                />
                <motion.div
                  animate={{
                    x: [0, -20, 0, 20, 0],
                    scale: [1, 0.6, 1, 0.6, 1],
                    opacity: [1, 0.3, 1, 0.3, 1],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-primary/60"
                />
                {/* Connecting bar */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-px bg-primary/20"
                  animate={{ width: ['60%', '30%', '60%', '30%', '60%'] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-2">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-foreground tracking-tight"
            >
              OncoSync
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4 }}
              className="text-xs text-muted-foreground tracking-wide uppercase"
            >
              Preparing research environment
            </motion.p>
          </div>

          {/* Minimal progress dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LoadingScreen;
