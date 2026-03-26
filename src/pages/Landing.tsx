import { useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FlaskConical, BarChart3, ShieldCheck, Microscope,
  Dna, ArrowRight, Sparkles, Activity, FileText,
  Zap, Lock, Globe
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Expression Analysis',
    desc: 'Kaplan-Meier survival curves, Cox regression, volcano plots, and gene correlations from GEO datasets.',
  },
  {
    icon: FlaskConical,
    title: 'VLP Simulation',
    desc: 'Bootstrap modeling of hypothetical Qβ-ApoC1 vaccine response with configurable efficacy parameters.',
  },
  {
    icon: Activity,
    title: 'Immune Tracking',
    desc: 'Antibody production curves, decay analysis, and multi-marker correlation across simulated patients.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety Monitoring',
    desc: 'CTCAE-graded adverse event logging with severity dashboards and concurrent IgG correlation.',
  },
  {
    icon: Microscope,
    title: 'Tissue Analysis',
    desc: 'H-DAB immunohistochemistry deconvolution with heatmap visualization and composition metrics.',
  },
  {
    icon: FileText,
    title: 'Export & Reports',
    desc: 'Generate PDF reports, CSV exports, and JSON data packages with full methodology documentation.',
  },
];

const highlights = [
  { icon: Zap, text: 'Real-time analysis' },
  { icon: Lock, text: 'Privacy-first design' },
  { icon: Globe, text: 'Browser-based, no install' },
];

const springConfig = { stiffness: 60, damping: 20, mass: 0.8 };
const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.07,
      duration: 0.9,
      ease: smoothEase,
    },
  }),
};

const smoothReveal = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: smoothEase },
  },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  });

  const rawParallax = useTransform(scrollYProgress, [0, 1], ['-5%', '12%']);
  const parallaxY = useSpring(rawParallax, springConfig);

  const rawHeaderOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const headerBorder = useSpring(rawHeaderOpacity, springConfig);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: 'hsl(var(--primary))', top: '5%', left: '15%' }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[80px]"
          style={{ background: 'hsl(258, 65%, 75%)', bottom: '10%', right: '10%' }}
          animate={{ x: [0, -20, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
      </div>

      {/* Nav — glassmorphic */}
      <motion.header
        className="fixed top-0 inset-x-0 z-50 border-b px-6"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: `hsla(0, 0%, 100%, ${0.15})`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Dna size={18} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              OncoSync
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <button
              onClick={() => navigate('/app')}
              className="vax-btn-secondary text-xs py-2 px-4 rounded-lg hidden sm:inline-flex"
            >
              Preview App
            </button>
            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wider">
              COMING SOON
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-6">
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.12] blur-[120px] pointer-events-none"
          style={{ background: 'hsl(var(--primary))' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wider" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'var(--glass-border)', color: 'hsl(var(--primary))' }}>
              <Sparkles size={13} />
              COMING SOON — EARLY ACCESS 2026
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            The Future of{' '}
            <span className="text-primary">Pancreatic Cancer</span>{' '}
            Vaccine Research
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            OncoSync brings together gene expression survival analysis, immune response modeling,
            and VLP simulation tools into one powerful, integrated research environment.
          </motion.p>

          {/* Highlights */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {highlights.map((h, i) => (
              <motion.div
                key={h.text}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <h.icon size={14} className="text-primary/70" />
                <span>{h.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={() => navigate('/app')}
              className="vax-btn-primary text-sm py-3 px-8 rounded-xl shadow-lg shadow-primary/20 inline-flex items-center gap-2"
              whileHover={{ scale: 1.04, boxShadow: '0 8px 30px hsla(258, 65%, 60%, 0.35)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              Preview the App <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Hero illustration with parallax */}
          <motion.div
            ref={heroRef}
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 50, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/30 group" style={{ boxShadow: '0 25px 80px -20px hsla(258, 65%, 50%, 0.15), 0 10px 30px -10px hsla(0, 0%, 0%, 0.08)' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/15 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-10" />
              <img
                src={heroIllustration}
                alt="DNA helix and molecular structures illustration"
                width={1280}
                height={720}
                className="w-full h-auto"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <motion.button
                  onClick={() => navigate('/app')}
                  className="vax-btn-primary text-xs py-2 px-5 rounded-full shadow-xl backdrop-blur-sm"
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Preview the App <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={smoothReveal}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider mb-4" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', color: 'hsl(var(--muted-foreground))' }}>
            PLATFORM FEATURES
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Everything you need for{' '}
            <span className="text-primary">preclinical research</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            A comprehensive suite of analysis tools, built by researchers for researchers.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="vax-card group cursor-default relative overflow-hidden"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.03] rounded-bl-[48px] transition-all duration-500 group-hover:w-32 group-hover:h-32 group-hover:bg-primary/[0.06]" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-500">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-[15px] font-bold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/30" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {[
              { value: '10+', label: 'Gene markers' },
              { value: '6', label: 'Analysis modules' },
              { value: '3', label: 'Patient profiles' },
              { value: '∞', label: 'Simulations' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="max-w-3xl mx-auto text-center px-6 py-24 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={smoothReveal}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Dna size={28} className="text-primary" />
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ready to explore?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
              OncoSync is launching soon. Preview the full research platform now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                onClick={() => navigate('/app')}
                className="vax-btn-primary text-sm py-3 px-8 rounded-xl shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.04, boxShadow: '0 8px 30px hsla(258, 65%, 60%, 0.35)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Preview the App <ArrowRight size={16} />
              </motion.button>
              <motion.button
                onClick={() => navigate('/app')}
                className="vax-btn-secondary text-sm py-3 px-8 rounded-xl"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Preview App
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Dna size={12} className="text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">OncoSync</span>
          </div>
          <span className="text-[11px] text-muted-foreground/50">
            © 2026 OncoSync · For educational and research purposes only. Not for clinical use.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
