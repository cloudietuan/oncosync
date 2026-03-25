import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FlaskConical, BarChart3, ShieldCheck, Microscope,
  Dna, ArrowRight, Sparkles, Activity, FileText
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dna size={18} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              OncoSync
            </span>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="vax-btn-primary text-xs py-2 px-5"
          >
            Launch App <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: 'hsl(var(--primary))' }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-6">
              <Sparkles size={12} />
              RESEARCH COMPANION
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Pancreatic Cancer{' '}
            <span className="text-primary">Vaccine Research</span>{' '}
            Dashboard
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Explore gene expression survival analysis, immune response tracking,
            and VLP simulation tools — all in one integrated research environment.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              onClick={() => navigate('/app')}
              className="vax-btn-primary text-sm py-2.5 px-7 rounded-xl shadow-lg"
            >
              Launch App <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/install')}
              className="vax-btn-secondary text-sm py-2.5 px-7 rounded-xl"
            >
              Install PWA
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Everything you need
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            A comprehensive suite of tools for preclinical vaccine development research.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="vax-card group cursor-default"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="text-sm font-bold mb-1.5 tracking-tight">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ready to explore?
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              Dive into GSE62452 expression data, run survival analyses, and simulate vaccine responses.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="vax-btn-primary text-sm py-3 px-8 rounded-xl shadow-lg"
            >
              Launch OncoSync <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
          <span>OncoSync v1.0 · Research Use Only</span>
          <span>For educational and research purposes. Not for clinical use.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
