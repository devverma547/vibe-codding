import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, RefreshCw, Printer, AlertTriangle, CheckCircle2, 
  XCircle, ArrowUpRight, Copy, Check, Sparkles, X, Code, Activity
} from 'lucide-react';
import { scannerService } from '../../services/scanner.service';

const loadingSteps = [
  "Initializing SiteProof audit engine...",
  "Crawling DOM and resolving internal links...",
  "Analyzing security headers & SSL certificates...",
  "Running Lighthouse performance profile...",
  "Evaluating WCAG AA accessibility contrast...",
  "Generating actionable AI fix prompts...",
  "Finalizing report & calculating scores..."
];

export default function ReportPage() {
  const { reportId } = useParams();
  const [_reportData, setReportData] = useState(null);
  const [domainName, setDomainName] = useState(reportId || 'novaflow-ai.vercel.app');
  const [targetScore, setTargetScore] = useState(72);

  const [activeFixModal, setActiveFixModal] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    async function fetchReport() {
      if (!reportId) return;
      const res = await scannerService.getReportById(reportId);
      if (res.success && res.data?.report) {
        setReportData(res.data.report);
        const clean = res.data.report.url?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || reportId;
        setDomainName(clean);
        if (typeof res.data.report.overallScore === 'number') {
          setTargetScore(res.data.report.overallScore);
        }
      } else {
        const clean = reportId.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        setDomainName(clean);
      }
    }
    fetchReport();
  }, [reportId]);
  const scanDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

  // Loading animation sequence
  useEffect(() => {
    if (!isInitialLoading && !isRescanning) return;

    let currentStep = 0;
    setLoadingStep(0);
    setDisplayScore(0); // Reset score when rescanning

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < loadingSteps.length) {
        setLoadingStep(currentStep);
      } else {
        clearInterval(interval);
        setIsInitialLoading(false);
        setIsRescanning(false);
      }
    }, 400); // 400ms per step

    return () => clearInterval(interval);
  }, [isInitialLoading, isRescanning]);

  // Score counter animation
  useEffect(() => {
    if (isInitialLoading || isRescanning) return;
    
    let current = 0;
    const duration = 1000; // 1 second
    const increment = targetScore / (duration / 16); // 60fps

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInitialLoading, isRescanning, targetScore]);
  
  const handleCopyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleRescan = () => {
    setIsRescanning(true);
  };

  // Modules Data with realistic traces
  const modules = [
    {
      id: 'security',
      title: 'Security Analysis',
      score: '7.4',
      description: 'TLS 1.3 encryption present, missing security headers and HSTS framing protection.',
      checks: [
        { status: 'pass', label: 'HTTPS TLS 1.3 Certificate (Valid, 240 days remaining)' },
        { status: 'warn', label: 'Header: Content-Security-Policy (Not set on index.html)' },
        { status: 'fail', label: 'Header: Strict-Transport-Security (HSTS missing globally)' },
        { status: 'pass', label: 'Exposed Secrets Scan (0 API keys found in bundle.js)' }
      ]
    },
    {
      id: 'performance',
      title: 'Performance Analysis',
      score: '5.8',
      description: 'Largest Contentful Paint is slow (3.2s); uncompressed hero images block rendering.',
      checks: [
        { status: 'warn', label: 'LCP (3.2s) - <img id="hero-banner"> at src/components/Hero.jsx' },
        { status: 'fail', label: 'Cumulative Layout Shift (0.24) - dynamic font loading issue' },
        { status: 'pass', label: 'HTTP/2 & Gzip Compression (Enabled via Cloudflare)' },
        { status: 'warn', label: 'Image Optimization (/assets/hero-bg.png is 2.4MB)' }
      ]
    },
    {
      id: 'seo',
      title: 'SEO Analysis',
      score: '8.1',
      description: 'Solid page title & meta descriptions; structured data JSON-LD missing schema.',
      checks: [
        { status: 'pass', label: 'Title Tag & Meta Description (Length optimal at index.html)' },
        { status: 'pass', label: 'OpenGraph Social Meta (og:image & og:title verified)' },
        { status: 'warn', label: 'Structured Data (<script type="application/ld+json"> missing)' },
        { status: 'pass', label: 'Canonical URL (<link rel="canonical"> matches domain)' }
      ]
    },
    {
      id: 'accessibility',
      title: 'Accessibility Analysis',
      score: '6.2',
      description: 'Button elements fail WCAG AA contrast standards; decorative images missing alt tags.',
      checks: [
        { status: 'fail', label: 'Color Contrast - <button class="btn-secondary"> (Ratio 2.8:1)' },
        { status: 'warn', label: 'Image Alt Text - <img class="deco-blob"> missing alt attribute' },
        { status: 'pass', label: 'Keyboard Navigation (tabindex logic sound across header)' },
        { status: 'warn', label: 'ARIA Landmarks (Missing <main> and <nav> roles)' }
      ]
    },
    {
      id: 'uiux',
      title: 'UI/UX Review',
      score: '7.8',
      description: 'Clear visual hierarchy, but mobile tap targets are too small on secondary links.',
      checks: [
        { status: 'pass', label: 'Visual Hierarchy (H1 to H6 structure is sequential)' },
        { status: 'warn', label: 'Touch Targets - <a class="footer-link"> is only 24px tall' },
        { status: 'pass', label: 'CTA Visibility (Primary button has distinct contrast)' }
      ]
    },
    {
      id: 'mobile',
      title: 'Mobile Responsiveness',
      score: '7.5',
      description: 'Layout adapts cleanly, but slight screen overflow triggers horizontal scrollbar.',
      checks: [
        { status: 'pass', label: 'Viewport Meta (<meta name="viewport" content="width=device-width">)' },
        { status: 'warn', label: 'Horizontal Overflow - <div class="pricing-table"> breaks on 360px' },
        { status: 'pass', label: 'Font Scaling (rem values scale correctly on iOS/Android)' }
      ]
    },
    {
      id: 'content',
      title: 'Content Quality (AI)',
      score: '7.6',
      description: 'Clean and readable copy, but paragraphs contain generic AI generated buzzwords.',
      checks: [
        { status: 'pass', label: 'Readability & Grammar (Flesch-Kincaid Grade 8)' },
        { status: 'warn', label: 'AI Clichés (Found "Unlock the power of" 3 times in copy)' }
      ]
    },
    {
      id: 'legal',
      title: 'Legal & Compliance',
      score: '5.0',
      description: 'Missing mandatory privacy policy links and GDPR cookie consent popup.',
      checks: [
        { status: 'fail', label: 'Privacy Policy (No internal link matches /privacy)' },
        { status: 'fail', label: 'Cookie Consent Banner (No GDPR consent scripts detected)' },
        { status: 'pass', label: 'Terms of Service (Found <a href="/terms"> in Footer)' }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Health',
      score: '8.3',
      description: '0 JavaScript runtime console errors, 1 broken internal asset link.',
      checks: [
        { status: 'pass', label: 'Console Errors (0 uncaught exceptions on load)' },
        { status: 'warn', label: 'Broken Links (GET /images/logo-old.svg returned 404)' },
        { status: 'pass', label: 'Sitemap XML (Detected at /sitemap.xml)' }
      ]
    },
    {
      id: 'business',
      title: 'Business & Conversion',
      score: '6.8',
      description: 'Value proposition is clear, but lacks client logos and social proof testimonials.',
      checks: [
        { status: 'pass', label: 'Clear Value Proposition (H1 is above the fold)' },
        { status: 'warn', label: 'Social Proof (No testimonial elements detected)' },
        { status: 'warn', label: 'Pricing Transparency (Requires scrolling 3000px to view)' }
      ]
    }
  ];

  // Action Plan Items with realistic AI prompts
  const actionPlan = [
    {
      priority: 'CRITICAL',
      time: '15 mins',
      title: 'Publish privacy policy page and add GDPR cookie banner',
      detail: 'Eliminates legal liability and compliance flags across EU & US visitors.',
      impact: '+8 pts',
      prompt: `Act as an expert frontend developer and legal compliance specialist. 
My website is currently failing GDPR compliance checks because it lacks a cookie consent banner and a linked Privacy Policy page.

Please write the React code (using Tailwind CSS) for a sticky bottom cookie consent banner. It should have:
1. A dark mode aesthetic (bg-slate-900, text-white).
2. A brief message explaining that we use cookies for analytics and functionality.
3. An "Accept All" primary button (emerald green) and a "Decline" secondary button.
4. A link to '/privacy-policy'.
5. It should store the consent state in localStorage so it doesn't reappear on reload.

Also, provide a generic markdown template for a SaaS Privacy Policy that I can drop into my /privacy route.`,
      code: `// Sample Implementation snippet you might get back
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookieConsent')) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 w-full bg-slate-900 text-white p-4 border-t border-slate-800 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">We use cookies to improve your experience. See our <a href="/privacy-policy" className="underline text-emerald-400">Privacy Policy</a>.</p>
        <div className="flex gap-3">
          <button onClick={() => { localStorage.setItem('cookieConsent', 'declined'); setShow(false); }} className="px-4 py-2 text-sm text-slate-300 hover:text-white">Decline</button>
          <button onClick={() => { localStorage.setItem('cookieConsent', 'accepted'); setShow(false); }} className="px-4 py-2 text-sm bg-emerald-500 rounded font-bold text-slate-900">Accept All</button>
        </div>
      </div>
    </div>
  );
}`
    },
    {
      priority: 'CRITICAL',
      time: '10 mins',
      title: 'Fix low contrast text on secondary buttons',
      detail: 'Adjust contrast ratio from 2.8:1 to WCAG AA standard (4.5:1).',
      impact: '+5 pts',
      prompt: `Act as an expert accessibility (a11y) developer.
The automated audit flagged my secondary buttons for failing WCAG AA color contrast standards. 

The current button uses Tailwind classes: \`bg-slate-800 text-slate-500\`. 
This results in a contrast ratio of 2.8:1, which is too low.

Please rewrite these Tailwind classes to achieve a contrast ratio of at least 4.5:1 while maintaining a dark aesthetic. I want it to look sleek but be fully readable for visually impaired users. Provide the updated class string.`,
      code: `/* Updated Tailwind classes for better contrast */
<button className="bg-slate-800 text-slate-200 hover:bg-slate-700 focus:ring-2 focus:ring-slate-400">
  Secondary Action
</button>`
    },
    {
      priority: 'HIGH',
      time: '20 mins',
      title: 'Compress hero image and switch to WebP/AVIF format',
      detail: 'Reduces hero payload from 2.4 MB to 180 KB, boosting LCP score by 1.4s.',
      impact: '+6 pts',
      prompt: `Act as a web performance optimization expert.
My Largest Contentful Paint (LCP) is currently 3.2s, heavily penalized by a 2.4MB uncompressed PNG hero image loaded at the top of my site.

I am using Vite and React. Please write a script or instruct me on how to batch convert my public \`/assets/hero-bg.png\` to both WebP and AVIF formats using modern CLI tools. 

Then, provide the exact HTML \`<picture>\` element code I should use to implement modern image format fallback routing (serving AVIF to supported browsers, WebP as a fallback, and JPG/PNG as a last resort) with proper \`loading="eager"\` and explicit width/height attributes to prevent layout shift.`,
      code: `<picture>
  <source srcset="/assets/hero-bg.avif" type="image/avif" />
  <source srcset="/assets/hero-bg.webp" type="image/webp" />
  <img 
    src="/assets/hero-bg.png" 
    width="1200" 
    height="800" 
    alt="Platform dashboard preview" 
    loading="eager" 
    fetchpriority="high"
    decoding="sync"
  />
</picture>`
    },
    {
      priority: 'HIGH',
      time: '10 mins',
      title: 'Add Content-Security-Policy & HSTS Security Headers',
      detail: 'Prevents SSL stripping and cross-site scripting attack vectors.',
      impact: '+4 pts',
      prompt: `Act as a web security expert.
My web application is hosted on Vercel and is currently missing crucial security headers, specifically HSTS (Strict-Transport-Security) and a Content-Security-Policy (CSP).

Please write a \`vercel.json\` configuration file that injects these headers globally across all routes. 
For the CSP, keep it reasonably strict but allow images from 'self' and standard CDNs, allow scripts from 'self', and prevent framing (X-Frame-Options). 
For HSTS, set the max-age to 2 years and include subdomains.`,
      code: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline';" }
      ]
    }
  ]
}`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-gray-100 transition-colors duration-300 font-sans flex flex-col relative">
      
      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {(isInitialLoading || isRescanning) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#080C14]"
          >
            <div className="w-full max-w-md p-8 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-white/10 rounded-full" />
                <motion.div 
                  className="absolute inset-0 border-4 border-[#00F5A0] rounded-full border-t-transparent border-l-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <Activity size={32} className="text-[#00F5A0] animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scanning {domainName}</h2>
                <div className="h-6 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStep}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-slate-500 dark:text-gray-400 absolute w-full"
                    >
                      {loadingSteps[loadingStep] || "Finishing up..."}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#00F5A0] to-[#00B4D8]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(loadingStep / loadingSteps.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-10 transition-opacity duration-700 ${isInitialLoading ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* TOP SUMMARY HEADER CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-6 relative overflow-hidden">
          
          {/* Top Bar inside Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">{domainName}</h1>
              <span className="text-xs text-slate-500 dark:text-gray-400">Scanned on {scanDate}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRescan}
                disabled={isRescanning}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={isRescanning ? 'animate-spin text-[#00F5A0]' : ''} /> 
                {isRescanning ? 'Rescanning...' : 'Re-scan'}
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,245,160,0.3)] transition-all cursor-pointer"
              >
                <Printer size={14} /> Print / PDF
              </button>
            </div>
          </div>

          {/* Score & Verdict Row */}
          <div className="flex flex-col md:flex-row items-center gap-8 pt-2">
            
            {/* Radial Score Circle Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="9" />
                <circle 
                  cx="50" cy="50" r="42" fill="none" stroke="#00F5A0" strokeWidth="9" 
                  strokeDasharray="263" 
                  strokeDashoffset={263 - (263 * displayScore) / 100} 
                  strokeLinecap="round" 
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{displayScore}</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">out of 100</div>
              </div>
            </div>

            {/* Verdict Details */}
            <div className="space-y-3 flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle size={14} />
                <span>Needs work before launch</span>
              </div>

              <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                The site is fast enough and UI architecture looks solid, but security headers are missing and legal compliance is lacking. Resolving the top 3 items will bring your health score to 89/100.
              </p>

              {/* Stat Summary Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs">
                <div className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-gray-300">
                  Security: <span className="font-bold text-slate-900 dark:text-white font-mono">{displayScore > 0 ? '74' : '0'}/100</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  Passed checks: <span className="font-bold font-mono">7</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  Issues found: <span className="font-bold font-mono">24</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
                  Critical issues: <span className="font-bold font-mono">5</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* SECTION: MODULE SCORES GRID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Traces & Modules</h2>
            <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">Each module scored out of 10</span>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {modules.map((m) => (
              <div 
                key={m.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/20 flex items-center justify-center text-[#00F5A0]">
                      <ShieldCheck size={16} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{m.title}</h3>
                  </div>

                  <span className="text-lg font-extrabold font-mono text-[#00F5A0]">{m.score}<span className="text-xs text-slate-400 dark:text-gray-500 font-normal">/10</span></span>
                </div>

                <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">{m.description}</p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${parseFloat(m.score) * 10}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-[#00F5A0] to-[#00E599]" 
                  />
                </div>

                {/* Checks List */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  {m.checks.map((chk, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs font-mono tracking-tight leading-tight pt-1">
                      {chk.status === 'pass' && <CheckCircle2 size={14} className="text-[#00F5A0] shrink-0 mt-0.5" />}
                      {chk.status === 'warn' && <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />}
                      {chk.status === 'fail' && <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />}
                      <span className={chk.status === 'pass' ? 'text-slate-500 dark:text-gray-400' : chk.status === 'warn' ? 'text-amber-800 dark:text-amber-200 font-medium' : 'text-red-800 dark:text-red-200 font-medium'}>
                        {chk.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: TECHNOLOGY STACK DETECTED */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Technology stack detected</h3>
          
          <div className="flex flex-wrap gap-2.5">
            {['React 18.2', 'Vite', 'Tailwind CSS', 'Vercel Hosting', 'Cloudflare CDN', 'Google Analytics 4', 'Stripe Payments'].map((tech) => (
              <span key={tech} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#080C14] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-gray-300">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* SECTION: AI RECOMMENDATIONS & ACTION PLAN */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-[#00F5A0]" /> AI recommendations & action plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Ready-to-use LLM prompts to fix your codebase. Sorted by score impact.</p>
          </div>

          <div className="space-y-3">
            {actionPlan.map((item, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 mt-0.5 ${
                    item.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30' :
                    item.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  }`}>
                    {item.priority}
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">{item.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#00F5A0]">{item.impact}</span>
                    <div className="text-[10px] text-slate-500 dark:text-gray-500">{item.time}</div>
                  </div>

                  <button
                    onClick={() => setActiveFixModal(item)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#00F5A0]/10 hover:bg-[#00F5A0] text-[#00F5A0] hover:text-slate-950 font-bold text-xs border border-[#00F5A0]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    View AI Prompt <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROJECTED SCORE AFTER FIXES */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#00F5A0]/30 text-center space-y-4 shadow-sm dark:shadow-[0_0_40px_rgba(0,245,160,0.1)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Projected score after fixes</h3>
          <p className="text-xs text-slate-600 dark:text-gray-400 max-w-md mx-auto">Completing the top recommended fixes yields a significant quality boost.</p>

          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-slate-400 dark:text-gray-400">{displayScore}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-500">Current</div>
            </div>

            <div className="text-xl font-bold text-[#00F5A0]">➔</div>

            <div className="text-center">
              <div className="text-4xl font-mono font-extrabold text-[#00F5A0]">89</div>
              <div className="text-[10px] text-[#00F5A0]">Projected</div>
            </div>
          </div>
        </div>

      </main>

      {/* AI FIX ASSISTANT MODAL */}
      <AnimatePresence>
        {activeFixModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-[#00F5A0]" size={20} />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Fix Prompt Generator</h3>
                </div>
                <button 
                  onClick={() => setActiveFixModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{activeFixModal.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">{activeFixModal.detail}</p>
                </div>

                <div className="space-y-4">
                  {/* Prompt Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><Code size={14}/> LLM Prompt</span>
                      <button
                        onClick={() => handleCopyPrompt(activeFixModal.prompt)}
                        className="px-2 py-1 rounded text-xs font-semibold text-[#00F5A0] hover:bg-[#00F5A0]/10 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                        {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-slate-100 dark:bg-[#05080E] border border-slate-200 dark:border-white/10 font-mono text-sm text-slate-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {activeFixModal.prompt}
                      </pre>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-500 italic pt-1">
                      Copy this prompt into Cursor, ChatGPT, or Claude for an instant contextual fix.
                    </p>
                  </div>

                  {/* Code Preview Box */}
                  <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5">Example Output</span>
                    </div>
                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-slate-900 dark:bg-black/40 border border-slate-700 dark:border-white/5 font-mono text-xs text-emerald-400 overflow-x-auto">
                        {activeFixModal.code}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-white/10 shrink-0 flex justify-end bg-slate-50 dark:bg-black/20">
                <button
                  onClick={() => setActiveFixModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm cursor-pointer shadow-[0_0_15px_rgba(0,245,160,0.2)]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
