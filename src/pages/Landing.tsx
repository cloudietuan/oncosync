import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import heroIllustration from '@/assets/hero-illustration.jpg';
import {
  FlaskConical, BarChart3, ShieldCheck, Microscope,
  Dna, ArrowRight, Sparkles, Activity, FileText,
  Mail, Check, Zap, Lock, Globe
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

const smoothEase = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, scale: 0.97, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: smoothEase as unknown as [number, number, number, number],
    },
  }),
};

const smoothReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smoothEase as unknown as [number, number, number, number] },
  },
};

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/15"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${10 + i * 11}%`,
              top: `${15 + (i * 9) % 60}%`,
            }}
            animate={{
              y: [0, -40 - i * 5, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 5 + i * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Dna size={18} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              OncoSync
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="vax-btn-secondary text-xs py-2 px-4 rounded-lg hidden sm:inline-flex"
            >
              Preview App
            </button>
            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wider">
              COMING SOON
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-6">
        {/* Multi-layer glow */}
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none"
          style={{ background: 'hsl(var(--primary))' }}
        />
        <div
          className="absolute top-40 left-1/3 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none"
          style={{ background: 'hsl(258, 65%, 75%)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold tracking-wider">
              <Sparkles size={13} />
              COMING SOON — EARLY ACCESS 2026
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            The Future of{' '}
            <span className="text-primary">Pancreatic Cancer</span>{' '}
            Vaccine Research
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            OncoSync brings together gene expression survival analysis, immune response modeling,
            and VLP simulation tools into one powerful, integrated research environment.
          </motion.p>

          {/* Highlights */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {highlights.map((h) => (
              <div key={h.text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <h.icon size={14} className="text-primary/70" />
                <span>{h.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Email signup */}
          <motion.div
            className="max-w-md mx-auto mb-12"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleNotify}
                  className="flex gap-2"
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex-1 relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email for early access"
                      required
                      className="vax-input pl-10 py-3 rounded-xl text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="vax-btn-primary text-sm py-3 px-6 rounded-xl shadow-lg shadow-primary/20 whitespace-nowrap"
                  >
                    Notify Me
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                >
                  <Check size={18} />
                  You're on the list! We'll notify you at launch.
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[11px] text-muted-foreground/50 mt-2.5">
              No spam, ever. Unsubscribe anytime.
            </p>
          </motion.div>

          {/* Hero illustration */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 48, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40 group">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-10" />
              <img
                src={heroIllustration}
                alt="DNA helix and molecular structures illustration"
                width={1280}
                height={720}
                className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
              />
              {/* Floating badge on image */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <motion.button
                  onClick={() => navigate('/app')}
                  className="vax-btn-primary text-xs py-2 px-5 rounded-full shadow-xl backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold tracking-wider mb-4">
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              {/* Subtle corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.03] rounded-bl-[40px]" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-[15px] font-bold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats / Social proof */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={smoothReveal}
          >
            {[
              { value: '10+', label: 'Gene markers' },
              { value: '6', label: 'Analysis modules' },
              { value: '3', label: 'Patient profiles' },
              { value: '∞', label: 'Simulations' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
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
              Be the first to know
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
              OncoSync is launching soon. Get notified when early access opens and be among the first researchers to try it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="vax-btn-primary text-sm py-3 px-8 rounded-xl shadow-lg shadow-primary/20"
              >
                Join the Waitlist <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/app')}
                className="vax-btn-secondary text-sm py-3 px-8 rounded-xl"
              >
                Preview App
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
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
