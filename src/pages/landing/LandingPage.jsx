import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Zap, Shield, Search, Eye, Palette, 
  Brain, Activity, FileText, CheckCircle2, 
  Smartphone, FileCode, Sparkles, Scale, 
  Layers3, ChevronDown, ExternalLink, GitBranch
} from 'lucide-react';
import InteractiveDemoVideo from '../../components/landing/InteractiveDemoVideo';
import ScanModal from '../../components/scanner/ScanModal';
import ParticleBackground from '../../components/landing/ParticleBackground';
import AnimatedScoreGauge from '../../components/landing/AnimatedScoreGauge';
import TerminalTypingCard from '../../components/landing/TerminalTypingCard';
import TiltCard from '../../components/landing/TiltCard';
import SpotlightCard from '../../components/landing/SpotlightCard';
import AnimatedCounter from '../../components/landing/AnimatedCounter';
import KineticTypography from '../../components/landing/KineticTypography';

export default function LandingPage() {
  const [urlInput, setUrlInput] = useState('');
  const [githubRepoInput, setGithubRepoInput] = useState('');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanTargetUrl, setScanTargetUrl] = useState('');
  const [scanTargetGithubRepo, setScanTargetGithubRepo] = useState('');

  React.useEffect(() => {
    if (window.location.hash === '#scan') {
      const el = document.getElementById('scan-input');
      if (el) {
        el.focus();
      }
    }
  }, []);
  const [activePersona, setActivePersona] = useState('vibe-coders');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleStartScan = (e, customUrl = null, customGithubRepo = null) => {
    e?.preventDefault();
    const target = customUrl || urlInput.trim() || 'https://your-site.com';
    const targetRepo = customGithubRepo !== null ? customGithubRepo : githubRepoInput.trim();
    setScanTargetUrl(target);
    setScanTargetGithubRepo(targetRepo);
    setIsScanModalOpen(true);
  };

  const sampleSites = [
    { label: 'novaflow-ai.vercel.app', url: 'https://novaflow-ai.vercel.app', repo: 'https://github.com/novaflow/novaflow-app' },
    { label: 'demo-store.com', url: 'https://demo-store.com', repo: 'https://github.com/demo-store/storefront' },
    { label: 'linear.app', url: 'https://linear.app', repo: 'https://github.com/linear/linear-frontend' }
  ];

  const modules = [
    {
      icon: <Shield className="w-5 h-5 text-red-400" />,
      title: "Security & Header Analysis",
      description: "Exposed .env keys, missing CSP/HSTS headers, & script injection risks.",
      num: '01'
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: "Performance & Web Vitals",
      description: "Uncompressed assets, render-blocking JS bundles, & slow LCP load times.",
      num: '02'
    },
    {
      icon: <Search className="w-5 h-5 text-blue-400" />,
      title: "SEO & Indexability",
      description: "Missing meta tags, broken heading hierarchy, sitemaps, & canonical URLs.",
      num: '03'
    },
    {
      icon: <Eye className="w-5 h-5 text-purple-400" />,
      title: "Accessibility (WCAG AA)",
      description: "Low contrast text, missing image alt attributes, ARIA roles, & keyboard nav.",
      num: '04'
    },
    {
      icon: <Palette className="w-5 h-5 text-pink-400" />,
      title: "UI & Layout Quality",
      description: "Broken tap targets, overflow elements, visual hierarchy, & CTA clarity.",
      num: '05'
    },
    {
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
      title: "Mobile Responsiveness",
      description: "Viewports, mobile breakpoint overlaps, touch targets, & font sizing.",
      num: '06'
    },
    {
      icon: <FileCode className="w-5 h-5 text-orange-400" />,
      title: "Content & Copy Clarity",
      description: "Duplicate copy detection, reading grade level, & messaging clarity.",
      num: '07'
    },
    {
      icon: <Scale className="w-5 h-5 text-yellow-400" />,
      title: "Legal & Compliance",
      description: "Missing Privacy Policies, non-compliant cookie banners, & GDPR exposure.",
      num: '08'
    },
    {
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      title: "Technical Runtime Health",
      description: "Broken external links, redirect loops, & unhandled browser console errors.",
      num: '09'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      title: "Conversion & Funnel UX",
      description: "Missing social proof, hidden lead forms, & unclear value propositions.",
      num: '10'
    },
    {
      icon: <Layers3 className="w-5 h-5 text-slate-400" />,
      title: "Tech Stack Inspection",
      description: "Identify framework (Next/Vite), hosting, analytics, & payment gateways.",
      num: '11'
    },
    {
      icon: <Brain className="w-5 h-5 text-[#00F5A0]" />,
      title: "AI Prompt & Fix Generator",
      description: "Complete audit reports with ready-to-use AI prompts to copy-paste into Cursor, Bolt, or ChatGPT to fix or remake your site.",
      num: '12'
    }
  ];

  const personas = {
    'vibe-coders': {
      title: 'For AI & Vibe Coders',
      subtitle: 'Built with Bolt, Cursor, v0, or Lovable? Get complete reports & AI prompts to remake your site.',
      points: [
        'Complete 12-module audit report detailing every code bug and security flaw',
        'Auto-generated AI prompts to feed directly back into Cursor, Bolt, or ChatGPT to fix code',
        'Detect exposed API keys or .env variables before going live'
      ]
    },
    'agencies': {
      title: 'For Agencies & Freelancers',
      subtitle: 'Deliver comprehensive client audit reports in under 2 minutes.',
      points: [
        'Generate full, detailed audit reports to send directly to clients',
        'Receive step-by-step AI prompts to pitch & execute site refactoring',
        'Show before/after health score benchmarks to close deals faster'
      ]
    },
    'founders': {
      title: 'For Founders & Store Owners',
      subtitle: 'Understand your site health & get AI prompts to upgrade your product.',
      points: [
        'Full comprehensive report covering performance, SEO, GDPR, and mobile UX',
        'AI prompt generator writes the exact instructions for your dev team or AI tools',
        'Boost load speed and conversion rates in a single 2-minute scan'
      ]
    }
  };

  const faqs = [
    {
      question: "What does the AI Prompt Generator do?",
      answer: "Instead of just giving you static text notes, SiteProof's AI engine writes exact, structured AI prompts tailored for tools like Cursor, Bolt, v0, ChatGPT, or Claude. You can copy-paste these prompts directly into your AI coding tool to automatically rewrite, redesign, or patch your codebase."
    },
    {
      question: "Do I get a complete audit report?",
      answer: "Yes! SiteProof generates a full 12-module report containing individual sub-scores, detailed error tracebacks, severity ratings, and downloadable summary reports."
    },
    {
      question: "How long does the scan take?",
      answer: "The average scan takes under 2 minutes to inspect all 12 quality modules, run lighthouse benchmarks, evaluate security headers, and generate your custom AI prompts."
    },
    {
      question: "Is the audit safe to run on live websites?",
      answer: "Yes, 100%. SiteProof performs a non-intrusive, read-only inspection. It never mutates data, triggers forms, or impacts your server performance."
    }
  ];

  // Stagger variants for children
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-gray-100 font-sans flex flex-col selection:bg-[#00F5A0] selection:text-slate-950 transition-colors duration-300">
      <Helmet>
        <title>SiteProof | AI Audit & Fix Prompts</title>
        <meta name="description" content="Generate full 12-module audit reports and auto-generated AI prompts to fix your site instantly." />
        <meta property="og:title" content="SiteProof | AI Audit & Fix Prompts" />
        <meta property="og:description" content="Generate full 12-module audit reports and auto-generated AI prompts to fix your site instantly." />
      </Helmet>
      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          
          {/* Floating Particle Background */}
          <ParticleBackground />

          {/* Cyan Glow Background Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(0,245,160,0.12)_0%,rgba(8,12,20,0)_70%)] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-8">
            
            {/* Top Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-xs font-semibold text-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.2)]"
            >
              <Zap size={14} className="text-[#00F5A0]" />
              <span>⚡ 60-Second Scans · Full Reports · AI-Powered Fix Prompts</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]"
            >
              Your AI built the site.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] via-[#00E093] to-[#00B4D8]">We find every flaw & write the AI prompts to fix them.</span>
            </motion.h1>

            {/* Subhead Paragraph */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
            >
              SiteProof doesn't just inspect your site — we deliver complete audit reports and generate exact AI prompts so you can copy-paste them directly into Cursor, Bolt, or ChatGPT to rebuild or fix your site automatically.
            </motion.p>

            {/* URL & GitHub Repo Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <form 
                onSubmit={handleStartScan}
                className="max-w-xl mx-auto flex flex-col gap-3 p-3 rounded-2xl bg-white dark:bg-[#0F1726]/90 border border-slate-300 dark:border-white/10 shadow-[0_0_40px_rgba(0,245,160,0.1)] focus-within:border-[#00F5A0]/50 transition-all backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080C14]/50 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-400 dark:text-gray-500 font-mono text-sm font-semibold">https://</span>
                  <input
                    id="scan-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="your-website.com"
                    className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#080C14]/50 border border-slate-200 dark:border-white/5">
                  <GitBranch size={16} className="text-[#00F5A0] shrink-0" />
                  <input
                    type="text"
                    value={githubRepoInput}
                    onChange={(e) => setGithubRepoInput(e.target.value)}
                    placeholder="https://github.com/user/repository (optional)"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none font-mono"
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 35px rgba(0,245,160,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Scan Website & GitHub Repo <ArrowRight size={16} />
                </motion.button>
              </form>

              {/* Sample Sites Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                <span className="font-medium text-slate-500 dark:text-gray-500">Or try sample URL + Repo:</span>
                {sampleSites.map((site, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, borderColor: 'rgba(0,245,160,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      setUrlInput(site.label);
                      setGithubRepoInput(site.repo);
                      handleStartScan(e, site.url, site.repo);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:text-[#00F5A0] font-mono text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{site.label}</span>
                    <ExternalLink size={10} />
                  </motion.button>
                ))}
              </div>
            </motion.div>



            {/* Score Gauge + Animated Stat Counter Cards Row */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8 pt-6"
            >
              {/* Animated Score Gauge */}
              <AnimatedScoreGauge targetScore={87} duration={2.5} />

              {/* 4 Key Metric Stat Cards with AnimatedCounter */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[
                  { component: <AnimatedCounter value={60} prefix="< " suffix="s" />, label: 'Average scan time' },
                  { component: <AnimatedCounter value={12} suffix=" modules" />, label: 'Audit modules per scan' },
                  { component: <AnimatedCounter value={100} prefix="0–" />, label: 'Single health score' },
                  { component: <AnimatedCounter value={4} suffix="x" />, label: 'Faster fixes with AI' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    whileHover={{ scale: 1.03, borderColor: 'rgba(0,245,160,0.3)' }}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 text-center transition-all shadow-sm dark:shadow-none"
                  >
                    <div className="text-xl sm:text-2xl font-extrabold text-[#00F5A0] font-display">{stat.component}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Social Proof Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <div className="flex -space-x-2">
                {['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'].map((color, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-slate-50 dark:border-[#080C14] flex items-center justify-center text-white text-xs font-bold`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                <span className="font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter value={2400} suffix="+" />
                </span> sites audited by AI builders
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 ml-1">4.9/5</span>
              </div>
            </motion.div>

          </div>
        </section>

        {/* SPECIAL FEATURE: FULL REPORTS & AI PROMPT GENERATOR */}
        <section className="py-16 bg-gradient-to-r from-[#00F5A0]/10 via-slate-100 dark:via-[#0D1527] to-[#00B4D8]/10 border-y border-slate-200 dark:border-[#00F5A0]/30 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <motion.div 
              className="space-y-4 text-left"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] text-xs font-mono font-bold">
                <FileText size={14} /> COMPLETE REPORT + AI PROMPT GENERATOR
              </div>
              <KineticTypography 
                text="We don't just find issues — we write the exact prompts to fix them."
                className="text-3xl sm:text-4xl font-extrabold mb-4"
              />
              <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                SiteProof delivers a comprehensive audit report across all 12 technical modules. Better yet, our engine automatically crafts copy-paste AI prompts so you can feed them directly into <strong>Cursor, Bolt, v0, or ChatGPT</strong> to rebuild or fix your code in seconds.
              </p>
            </motion.div>

            {/* Terminal Typing Card */}
            <TerminalTypingCard />

          </div>
        </section>

        {/* HIGH-TECH INTERACTIVE PREVIEW */}
        <section className="py-12 bg-slate-100/80 dark:bg-[#060912]/80 border-y border-slate-200 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div 
              className="text-center max-w-2xl mx-auto mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-mono text-[#00F5A0] uppercase tracking-widest font-semibold">Interactive Audit Simulator</span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">See How SiteProof Audits Your App</h2>
            </motion.div>

            <InteractiveDemoVideo />
          </div>
        </section>

        {/* SECTION: 12 AUDIT MODULES */}
        <section className="py-20 bg-slate-50 dark:bg-[#080C14]">
          <div className="max-w-6xl mx-auto px-4 space-y-12">
            <motion.div 
              className="text-center space-y-3 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-mono text-[#00F5A0] uppercase tracking-widest font-semibold">Comprehensive Quality Engine</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                12 Modules Scanning Every Layer of Your Site
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-400">
                From security header flaws to broken mobile layouts, SiteProof checks everything and hands you complete reports and ready-to-run AI prompts.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {modules.map((mod, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                >
                  <TiltCard className="h-full">
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527]/60 border border-slate-200 dark:border-white/5 hover:border-[#00F5A0]/30 transition-all group shadow-sm dark:shadow-lg h-full relative">
                      <span className="absolute top-4 right-4 text-[10px] font-mono font-bold text-slate-400 dark:text-gray-600">{mod.num}</span>
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 w-fit group-hover:bg-[#00F5A0]/10 transition-colors">
                        {mod.icon}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 group-hover:text-[#00F5A0] transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* TARGET PERSONAS SECTION */}
        <section className="py-20 bg-slate-100 dark:bg-[#060912] border-t border-slate-200 dark:border-white/5">
          <div className="max-w-5xl mx-auto px-4 space-y-10">
            <motion.div 
              className="text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-mono text-[#00F5A0] uppercase tracking-widest font-semibold">Tailored Workflows</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Engineered for Modern Web Builders
              </h2>
            </motion.div>

            {/* Persona Tabs Header */}
            <div className="flex justify-center gap-2 p-1.5 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-300 dark:border-white/10 max-w-md mx-auto">
              {Object.keys(personas).map((key) => (
                <button
                  key={key}
                  onClick={() => setActivePersona(key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                    activePersona === key 
                      ? 'bg-[#00F5A0] text-slate-950 shadow-md' 
                      : 'text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {key === 'vibe-coders' ? '⚡ AI Coders' : key === 'agencies' ? '🏢 Agencies' : '🚀 Founders'}
                </button>
              ))}
            </div>

            {/* Active Persona Box with Animation */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activePersona}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 max-w-3xl mx-auto space-y-6 shadow-md dark:shadow-xl"
              >
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{personas[activePersona].title}</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">{personas[activePersona].subtitle}</p>
                </div>

                <ul className="space-y-3">
                  {personas[activePersona].points.map((point, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-sm text-slate-800 dark:text-gray-200"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#00F5A0] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleStartScan(e)}
                  className="w-full py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  Start your first scan <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* SECTION: 3-STEP PROCESS */}
        <section className="py-20 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080C14] relative">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Animated connecting line (desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 z-0">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00F5A0]/50 via-[#00F5A0] to-[#00B4D8]/50"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,245,160,0.5))' }}
                />
              </div>

              {[
                { step: '01', title: 'Paste your live URL', desc: 'Works with Vercel, Netlify, Shopify, Webflow, or custom backend domains.' },
                { step: '02', title: '2-Minute Deep Audit', desc: 'Runs Lighthouse metrics, HTTP security checks, and DOM layout evaluation simultaneously.' },
                { step: '03', title: 'Full Report & AI Prompts', desc: 'Receive a complete 12-module audit report plus custom AI prompts to fix or remake your site automatically.' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative z-10"
                >
                  <SpotlightCard className="h-full space-y-3">
                    <span className="text-sm font-mono font-bold text-[#00F5A0] px-2.5 py-1 rounded-md bg-[#00F5A0]/10 border border-[#00F5A0]/20">Step {item.step}</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-display">{item.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </SpotlightCard>
                </motion.div>
              ))}

            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="py-20 bg-slate-100 dark:bg-[#060912] border-t border-slate-200 dark:border-white/5">
          <div className="max-w-3xl mx-auto px-4 space-y-8">
            <motion.div 
              className="text-center space-y-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-mono text-[#00F5A0] uppercase tracking-widest font-semibold">Clear Answers</span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white hover:text-[#00F5A0] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <motion.div
                      animate={{ rotate: openFaqIndex === idx ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-5 h-5 text-[#00F5A0]" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 text-sm text-slate-700 dark:text-gray-300 border-t border-slate-200 dark:border-white/5 pt-3 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: SEE A REAL REPORT FIRST */}
        <section className="py-28 text-center bg-slate-50 dark:bg-[#080C14] border-t border-slate-200 dark:border-white/5 relative overflow-hidden">
          {/* Subtle bottom glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-[radial-gradient(ellipse_at_bottom,rgba(0,245,160,0.08)_0%,rgba(8,12,20,0)_70%)] pointer-events-none" />
          
          <motion.div 
            className="max-w-3xl mx-auto px-4 space-y-6 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready to see a real report?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-gray-400">
              Explore a complete live audit report generated for a real AI-built SaaS landing page.
            </p>

            <div className="pt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  to="/sample-report"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(0,245,160,0.35)] hover:shadow-[0_0_40px_rgba(0,245,160,0.6)] cursor-pointer"
                >
                  Open Sample Report <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

      </main>
      
      {/* Live Scanner Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        targetUrl={scanTargetUrl}
        githubRepo={scanTargetGithubRepo}
      />
    </div>
  );
}
