import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, RefreshCw, Printer, AlertTriangle, CheckCircle2, 
  XCircle, ArrowUpRight, Copy, Check, Sparkles, X, Code, Activity, GitBranch,
  Zap, Eye, Smartphone, FileText, Scale, Wrench, TrendingUp, Server, Palette,
  Globe, KeyRound
} from 'lucide-react';
import { scannerService } from '../../services/scanner.service';
import { useAuth } from '../../contexts/AuthContext';
import { calculateProjectedScore, normalizeActionPlanImpacts } from '../../utils/reportScoring';

const loadingSteps = [
  "Initializing SiteProof audit engine...",
  "Running Google PageSpeed Insights...",
  "Querying Mozilla Observatory API for security grading...",
  "Extracting source code from GitHub...",
  "Analyzing security headers & SSL certificates...",
  "Running Lighthouse performance profile...",
  "Sending data to AI for deep analysis...",
  "Generating fix prompts & action plan...",
  "Finalizing report & calculating scores..."
];

// Map category IDs to icons
const categoryIcons = {
  security: ShieldCheck,
  performance: Zap,
  seo: Eye,
  accessibility: Palette,
  'best-practices': CheckCircle2,
  bestPractices: CheckCircle2,
  'code-quality': Code,
  codeQuality: Code,
  'ui/ux': Smartphone,
  uiux: Smartphone,
  mobile: Smartphone,
  content: FileText,
  legal: Scale,
  technical: Wrench,
  business: TrendingUp,
  infrastructure: Server,
  'secret-scan': KeyRound,
  secretScan: KeyRound,
  privacyData: KeyRound,
  privacy: KeyRound,
  'privacy-data': KeyRound,
};

function getCategoryIcon(id) {
  const key = (id || '').toLowerCase().replace(/\s+/g, '-');
  return categoryIcons[key] || ShieldCheck;
}

// Source label helper
function getSourceLabel(source) {
  switch (source) {
    case 'mozilla-observatory':
      return { label: 'Mozilla Observatory', icon: ShieldCheck, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    case 'google-pagespeed':
    case 'pagespeed-fallback':
      return { label: 'Google PageSpeed', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'github-code-review':
      return { label: 'GitHub Code Review', icon: Code, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    case 'nvidia-ai':
      return { label: 'NVIDIA AI', icon: Sparkles, color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    case 'siteproof-secret-scanner':
      return { label: 'Secret Scanner', icon: KeyRound, color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    default:
      return { label: 'Google PageSpeed', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  }
}

// Web Vitals thresholds for color coding
function getVitalStatus(metric, value) {
  if (value === null || value === undefined) return 'unknown';
  const thresholds = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    cls: [100, 250], // stored as integer *1000
    fid: [100, 300],
    inp: [200, 500],
    ttfb: [800, 1800],
  };
  const [good, poor] = thresholds[metric] || [1000, 3000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function getVitalColor(status) {
  switch (status) {
    case 'good': return 'text-[#00F5A0]';
    case 'needs-improvement': return 'text-amber-500';
    case 'poor': return 'text-red-500';
    default: return 'text-slate-400 dark:text-gray-500';
  }
}

export default function ReportPage() {
  const { reportId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [domainName, setDomainName] = useState(reportId || 'example.com');
  const [githubRepoUrl, setGithubRepoUrl] = useState(location.state?.githubRepo || '');
  const [targetScore, setTargetScore] = useState(0);

  const [activeFixModal, setActiveFixModal] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  // Fetch report data
  useEffect(() => {
    let isMounted = true;
    async function fetchReport() {
      if (!reportId) return;
      setIsInitialLoading(true);
      try {
        const res = await scannerService.getReportByScanId(reportId);
        if (!isMounted) return;
        if (res.success && res.data) {
          const data = res.data;
          setReportData(data);
          
          const clean = data.url?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || reportId;
          setDomainName(clean);
          
          if (data.githubRepo) {
            setGithubRepoUrl(data.githubRepo);
          }
          
          const score = data.aiReport?.healthScore ?? data.overallScore ?? 0;
          setTargetScore(score);
        } else {
          const clean = reportId.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          setDomainName(clean);
          setTargetScore(0);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }
    fetchReport();
    return () => { isMounted = false; };
  }, [reportId]);

  const scanDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    reportData?.createdAt ? new Date(reportData.createdAt) : new Date()
  );

  // Loading step animation sequence
  useEffect(() => {
    if (!isInitialLoading && !isRescanning) return;

    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isInitialLoading, isRescanning]);

  // Score counter animation
  useEffect(() => {
    if (isInitialLoading || isRescanning) return;
    
    let current = 0;
    const duration = 1000;
    const increment = targetScore / (duration / 16);

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

  // Close fix modal on Escape key press
  useEffect(() => {
    if (!activeFixModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveFixModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFixModal]);
  
  const handleCopyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleRescan = async () => {
    const url = reportData?.url || `https://${domainName}`;
    setIsRescanning(true);
    setLoadingStep(0);
    setDisplayScore(0);

    try {
      const res = await scannerService.analyzeSite(url, githubRepoUrl, user?.id || null, null, { forceRefresh: true });
      if (res.success && res.data) {
        const reportRes = await scannerService.getReportByScanId(res.data.scanId);
        if (reportRes.success && reportRes.data) {
          setReportData(reportRes.data);
          const score = reportRes.data.aiReport?.healthScore ?? reportRes.data.overallScore ?? 0;
          setTargetScore(score);
        }
      }
    } catch (err) {
      console.error('Rescan failed:', err);
    } finally {
      setIsRescanning(false);
    }
  };

  // === EXTRACT DATA FROM REPORT ===
  const ai = reportData?.aiReport || null;
  const observatory = reportData?.observatory || null;
  const secretsScan = reportData?.secretsScan || null;
  
  // IDs of modules that don't have real scanners yet (enforced client-side)
  const COMING_SOON_MODULE_IDS = new Set([
    'mobileUx', 'pwaOffline', 'uiRender', 'infrastructure', 'aiPrompt'
  ]);

  // Modules/audit breakdown: merge base modules with AI data, then enforce comingSoon
  const baseModules = [...(reportData?.modules || [])];
  
  // If privacyData is missing (e.g., from an older scan), insert it so Secret Scanner is always visible
  if (!baseModules.some(m => m.id === 'privacyData')) {
    const leakCount = secretsScan?.totalLeaks || 0;
    const privScore = leakCount === 0 ? '10.0' : Math.max(1, (10 - leakCount * 2.5)).toFixed(1);
    baseModules.push({
      id: 'privacyData',
      title: 'Privacy & Data Security',
      score: privScore,
      description: leakCount === 0
        ? `Clean client bundle scan · ${secretsScan?.bundlesScanned || 0} JS bundle(s) audited. Zero leaked secrets or credentials.`
        : `🚨 ${leakCount} exposed secret(s) found in client bundles. Immediate remediation required.`,
      checks: secretsScan?.checks && secretsScan.checks.length > 0 ? secretsScan.checks : [
        { status: 'pass', label: 'No exposed API keys or secrets detected in client bundles' },
        { status: 'pass', label: 'Client-side scripts verified secure' },
        { status: 'pass', label: 'No Supabase service_role or payment keys exposed' },
      ],
      source: 'siteproof-secret-scanner',
      secretsScan,
      comingSoon: false,
    });
  }

  const aiBreakdownMap = new Map((ai?.auditBreakdown || []).map(m => [m.id, m]));
  const modules = baseModules.map(m => {
    const aiMod = aiBreakdownMap.get(m.id);
    const merged = aiMod ? { ...m, ...aiMod } : m;

    // Privacy & Data Security module (powered by Secret & Bundle Scanner)
    if (m.id === 'privacyData') {
      const scan = secretsScan || m.secretsScan;
      const leakCount = scan?.totalLeaks || 0;
      const privScore = leakCount === 0 ? '10.0' : Math.max(1, (10 - leakCount * 2.5)).toFixed(1);
      return {
        ...merged,
        title: 'Privacy & Data Security',
        score: privScore,
        description: leakCount === 0
          ? `Clean client bundle scan · ${scan?.bundlesScanned || 0} JS bundle(s) audited. Zero leaked secrets or credentials.`
          : `🚨 ${leakCount} exposed secret(s) found in client bundles. High risk of data breach or account drain.`,
        checks: scan?.checks && scan.checks.length > 0 ? scan.checks : [
          { status: 'pass', label: 'No exposed API keys or secrets detected in client bundles' },
          { status: 'pass', label: 'Client-side scripts verified secure' },
          { status: 'pass', label: 'No Supabase service_role or payment keys exposed' },
        ],
        source: 'siteproof-secret-scanner',
        secretsScan: scan,
        comingSoon: false,
        needsGithub: false,
      };
    }

    // Enforce comingSoon on future modules (even if old data doesn't have the flag)
    if (COMING_SOON_MODULE_IDS.has(m.id)) {
      return { ...merged, comingSoon: true, score: null, checks: [], description: 'Scanner not available yet. This module will be added in a future update.' };
    }
    // Code Quality module: needs GitHub repo to work
    if (m.id === 'codeQuality' && !githubRepoUrl) {
      return { ...merged, needsGithub: true, score: null, checks: [], description: 'Provide your GitHub repository link when scanning to unlock this module.' };
    }
    return { ...merged, comingSoon: false, needsGithub: false };
  });
  if (modules.length === 0 && ai?.auditBreakdown) {
    modules.push(...ai.auditBreakdown.map(m => ({ ...m, comingSoon: COMING_SOON_MODULE_IDS.has(m.id) })));
  }
  
  // Fix prompts: prefer AI data, fallback to PageSpeed recommendations
  const rawActionPlan = ai?.fixPrompts || [];
  
  // Tech stack
  const techStack = ai?.techStack || reportData?.techStack || [];
  
  // Stats — only count checks from real (non-comingSoon) modules
  const realModulesOnly = modules.filter(m => !m.comingSoon);
  const stats = ai?.stats || {
    passedChecks: realModulesOnly.reduce((sum, m) => sum + (m.checks || []).filter(c => c.status === 'pass').length, 0),
    failedChecks: realModulesOnly.reduce((sum, m) => sum + (m.checks || []).filter(c => c.status === 'fail').length, 0),
    warningChecks: realModulesOnly.reduce((sum, m) => sum + (m.checks || []).filter(c => c.status === 'warn').length, 0),
    criticalIssues: reportData?.criticalCount || 0,
  };

  // Issues from PageSpeed
  const allIssues = reportData?.issues || [];

  // Web Vitals
  const webVitals = reportData?.webVitals || {};

  // Verdict
  const verdict = ai?.verdict || (targetScore >= 90 ? 'Production Ready' : targetScore >= 75 ? 'Needs Minor Fixes' : targetScore >= 50 ? 'Needs Work Before Launch' : 'Critical Issues Found');
  const verdictColor = targetScore >= 90 ? 'emerald' : targetScore >= 75 ? 'blue' : targetScore >= 50 ? 'amber' : 'red';

  // Summary
  const summary = ai?.summary || reportData?.summary || `Analysis of ${domainName} complete.`;

  // Projected score is an estimate, capped by the remaining room in a 100-point score.
  const projectedScore = calculateProjectedScore(targetScore, rawActionPlan, ai?.projectedScore);
  const actionPlan = normalizeActionPlanImpacts(rawActionPlan, targetScore, projectedScore);

  // AI source label
  const reportSource = ai?.source === 'nvidia-ai'
    ? `NVIDIA AI${ai.model ? ` (${ai.model})` : ''}`
    : 'Google PageSpeed';

  // Score color
  const scoreColor = targetScore >= 80 ? '#00F5A0' : targetScore >= 60 ? '#F5A623' : '#FF4D4D';

  if (!isInitialLoading && !isRescanning && !reportData) {
    return (
      <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center py-20 space-y-4">
          <ShieldCheck size={48} className="mx-auto text-slate-300 dark:text-gray-600" />
          <h2 className="text-xl font-bold text-slate-500 dark:text-gray-400">Report Not Found</h2>
          <p className="text-sm text-slate-400 dark:text-gray-500">
            This scan report could not be loaded. It may have expired or the scan ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 relative">
      
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isRescanning ? 'Re-scanning' : 'Scanning'} {domainName}
                </h2>
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

      <div className={`w-full space-y-8 transition-opacity duration-700 ${isInitialLoading ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* SYNTHETIC DATA WARNING — shown when report is estimated (rate-limit fallback) */}
        {reportData?.isSynthetic && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300">
            <AlertTriangle size={22} className="shrink-0 text-red-500 mt-0.5" />
            <div className="text-sm leading-relaxed space-y-1">
              <span className="font-bold text-base">⚠️ Estimated Report — Not Real Scan Data</span>
              <p className="text-xs">
                Google PageSpeed was temporarily rate-limited. The scores and checks shown below are <strong>estimates only</strong>, not actual scan results from your website.
                {reportData.fallbackReason && <> (Reason: {reportData.fallbackReason})</>}
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/50">
                Please re-scan later to get accurate, real results from Google PageSpeed Insights.
              </p>
            </div>
          </div>
        )}

        {/* WARNINGS BANNER — shows when parts of the scan failed */}
        {reportData?.warnings && reportData.warnings.length > 0 && (
          <div className="flex items-start gap-3 px-5 py-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
            <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <span className="font-semibold">Partial Report:</span>
              {reportData.warnings.map((w, i) => (
                <p key={i}>• {w}</p>
              ))}
              <p className="text-amber-600/70 dark:text-amber-400/50 mt-1">The rest of the report is still based on real Google PageSpeed data.</p>
            </div>
          </div>
        )}

        {/* TOP SUMMARY HEADER CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-6 relative overflow-hidden">
          
          {/* AI Source Badge — only displayed when NVIDIA AI is active */}
          {ai?.source === 'nvidia-ai' && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
                <Sparkles size={11} /> {reportSource}
              </span>
            </div>
          )}

          {/* Top Bar inside Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">{domainName}</h1>
              {githubRepoUrl && (
                <a 
                  href={githubRepoUrl.startsWith('http') ? githubRepoUrl : `https://${githubRepoUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-mono text-[#00F5A0] hover:underline"
                >
                  <GitBranch size={12} /> {githubRepoUrl.replace('https://github.com/', '')}
                </a>
              )}
              <span className="text-xs text-slate-500 dark:text-gray-400">Scanned on {scanDate}</span>
              {reportData?.isCached && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-[#00F5A0] border border-emerald-500/20">
                  <Zap size={11} /> Fast Cache {reportData.cacheAgeMinutes !== undefined ? `(${reportData.cacheAgeMinutes}m ago)` : ''}
                </span>
              )}
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
                  cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="9" 
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
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border
                ${verdictColor === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : ''}
                ${verdictColor === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' : ''}
                ${verdictColor === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : ''}
                ${verdictColor === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : ''}
              `}>
                {verdictColor === 'emerald' && <CheckCircle2 size={14} />}
                {verdictColor === 'blue' && <CheckCircle2 size={14} />}
                {verdictColor === 'amber' && <AlertTriangle size={14} />}
                {verdictColor === 'red' && <XCircle size={14} />}
                <span>{verdict}</span>
              </div>

              <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                {summary}
              </p>

              {/* Stat Summary Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs">
                {reportData?.scores && (
                  <div className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-gray-300 flex items-center gap-2">
                    <span>Security: <span className="font-bold text-slate-900 dark:text-white font-mono">{reportData.scores.security ?? '-'}/100</span></span>
                    {observatory?.grade && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        observatory.grade.startsWith('A') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                        observatory.grade.startsWith('B') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' :
                        observatory.grade.startsWith('C') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                        'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}>
                        MDN Grade {observatory.grade}
                      </span>
                    )}
                  </div>
                )}
                <div className={`px-3.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  (secretsScan?.totalLeaks || 0) > 0
                    ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                }`}>
                  <KeyRound size={13} className="shrink-0" />
                  <span>Secrets: <span className="font-bold font-mono">{(secretsScan?.totalLeaks || 0) > 0 ? `🚨 ${secretsScan.totalLeaks} Leaked` : 'Clean (0)'}</span></span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  Passed checks: <span className="font-bold font-mono">{stats.passedChecks}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  Warnings: <span className="font-bold font-mono">{stats.warningChecks}</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
                  Failed: <span className="font-bold font-mono">{stats.failedChecks}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* SECTION: CORE WEB VITALS (real CrWUX data) */}
        {reportData && Object.values(webVitals).some(v => v !== null && v !== undefined) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Core Web Vitals</h2>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">
                Real User Data · Google CrUX
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: 'lcp', label: 'LCP', desc: 'Largest Contentful Paint', unit: 'ms' },
                { key: 'fcp', label: 'FCP', desc: 'First Contentful Paint', unit: 'ms' },
                { key: 'cls', label: 'CLS', desc: 'Cumulative Layout Shift', unit: '' },
                { key: 'fid', label: 'FID', desc: 'First Input Delay', unit: 'ms' },
                { key: 'inp', label: 'INP', desc: 'Interaction to Next Paint', unit: 'ms' },
                { key: 'ttfb', label: 'TTFB', desc: 'Time to First Byte', unit: 'ms' },
              ].map((vital) => {
                const value = webVitals[vital.key];
                const status = getVitalStatus(vital.key, value);
                const colorClass = getVitalColor(status);
                
                return (
                  <div 
                    key={vital.key}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 text-center space-y-1.5"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-500">{vital.label}</div>
                    <div className={`text-2xl font-extrabold font-mono ${colorClass}`}>
                      {value !== null && value !== undefined ? (vital.key === 'cls' ? (value / 100).toFixed(2) : value) : '—'}
                    </div>
                    {value !== null && value !== undefined && vital.unit && (
                      <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">{vital.unit}</div>
                    )}
                    <div className="text-[9px] text-slate-400 dark:text-gray-600">{vital.desc}</div>
                    {value !== null && value !== undefined && (
                      <div className={`text-[9px] font-bold uppercase tracking-wider ${
                        status === 'good' ? 'text-[#00F5A0]' : status === 'needs-improvement' ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {status === 'good' ? '● Good' : status === 'needs-improvement' ? '● Needs Work' : '● Poor'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: MODULE SCORES GRID */}
        {modules.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Traces & Modules</h2>
              <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">Each module scored out of 10</span>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modules.map((m, moduleIdx) => {
                const IconComponent = getCategoryIcon(m.id || m.category);
                const numericScore = parseFloat(m.score) || 0;
                const sourceInfo = getSourceLabel(m.source);
                const SourceIcon = sourceInfo.icon;
                const isComingSoon = m.comingSoon === true;
                
                // === COMING SOON or NEEDS GITHUB MODULE CARD ===
                const isNeedsGithub = m.needsGithub === true;
                if (isComingSoon || isNeedsGithub) {
                  return (
                    <div 
                      key={m.id || moduleIdx}
                      className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400">
                            <IconComponent size={16} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{m.title || m.category}</h3>
                            <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[9px] font-semibold border ${
                              isNeedsGithub
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10'
                            }`}>
                              {isNeedsGithub ? '🔗 GitHub Repo Required' : '🔒 Coming Soon'}
                            </div>
                          </div>
                        </div>

                        <span className="text-lg font-extrabold font-mono text-slate-400 dark:text-gray-500">
                          —<span className="text-xs text-slate-400 dark:text-gray-500 font-normal">/10</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                        {isNeedsGithub
                          ? 'Provide your GitHub repository link when scanning to unlock this module. Code Quality analysis requires access to your source code.'
                          : 'Scanner not available yet. This module will be added in a future update.'
                        }
                      </p>

                      {/* Empty progress bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden" />
                    </div>
                  );
                }

                // === REAL MODULE CARD ===
                return (
                  <div 
                    key={m.id || moduleIdx}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          numericScore >= 8 ? 'bg-[#00F5A0]/10 border border-[#00F5A0]/20 text-[#00F5A0]' :
                          numericScore >= 5 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' :
                          'bg-red-500/10 border border-red-500/20 text-red-500'
                        }`}>
                          <IconComponent size={16} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{m.title || m.category}</h3>
                          {/* Data source badge */}
                          <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[9px] font-semibold border ${sourceInfo.color}`}>
                            <SourceIcon size={9} />
                            {sourceInfo.label}
                          </div>
                        </div>
                      </div>

                      <span className={`text-lg font-extrabold font-mono ${
                        numericScore >= 8 ? 'text-[#00F5A0]' :
                        numericScore >= 5 ? 'text-amber-500' :
                        'text-red-500'
                      }`}>
                        {m.score}<span className="text-xs text-slate-400 dark:text-gray-500 font-normal">/10</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">{m.description}</p>

                    {/* Mozilla Observatory Highlight Banner if security module */}
                    {m.id === 'security' && (m.observatory || observatory) && (
                      <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-orange-950/20 border border-orange-500/20 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-orange-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            MDN HTTP Observatory:
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            (m.observatory?.grade || observatory?.grade || 'B').startsWith('A') ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                            (m.observatory?.grade || observatory?.grade || 'B').startsWith('B') ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' :
                            (m.observatory?.grade || observatory?.grade || 'B').startsWith('C') ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                            'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                          }`}>
                            Grade {m.observatory?.grade || observatory?.grade || 'B'}
                          </span>
                        </div>
                        {(m.observatory?.details_url || observatory?.details_url) && (
                          <a
                            href={m.observatory?.details_url || observatory?.details_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline flex items-center gap-1 shrink-0"
                          >
                            <span>View MDN Report</span>
                            <ArrowUpRight size={12} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Secret & Bundle Scanner Highlight Banner if security or privacyData module */}
                    {(m.id === 'security' || m.id === 'privacyData') && (
                      <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                        (secretsScan?.totalLeaks || 0) > 0
                          ? 'bg-red-500/10 dark:bg-red-950/30 border-red-500/30'
                          : 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <KeyRound size={16} className={(secretsScan?.totalLeaks || 0) > 0 ? 'text-red-500 shrink-0' : 'text-[#00F5A0] shrink-0'} />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            Client Bundle Secret Scanner:
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            (secretsScan?.totalLeaks || 0) > 0
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          }`}>
                            {(secretsScan?.totalLeaks || 0) > 0
                              ? `🚨 ${secretsScan.totalLeaks} Leak${secretsScan.totalLeaks > 1 ? 's' : ''} Detected`
                              : '✅ Pass · 0 Leaks'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-gray-400">
                          {secretsScan?.bundlesScanned
                            ? `${secretsScan.bundlesScanned} JS bundle${secretsScan.bundlesScanned > 1 ? 's' : ''} audited`
                            : 'Client bundles verified safe'}
                        </span>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${numericScore * 10}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${
                          numericScore >= 8 ? 'bg-gradient-to-r from-[#00F5A0] to-[#00E599]' :
                          numericScore >= 5 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                      />
                    </div>

                    {/* Checks List */}
                    {m.checks && m.checks.length > 0 && (
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: ALL ISSUES FOUND (from real PageSpeed data) */}
        {allIssues.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                All Issues Found <span className="text-sm font-normal text-slate-500 dark:text-gray-400 ml-2">({allIssues.length} total)</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Globe size={11} /> Google PageSpeed
                </span>
                {observatory && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={11} /> Mozilla Observatory
                  </span>
                )}
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1 ${
                  (secretsScan?.totalLeaks || 0) > 0
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <KeyRound size={11} /> Secret Scanner {(secretsScan?.totalLeaks || 0) > 0 ? `(${secretsScan.totalLeaks} Leaks)` : '(Clean)'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {allIssues.slice(0, 30).map((issue, idx) => (
                  <div 
                    key={issue.id || idx}
                    className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-white/5 last:border-0"
                  >
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${
                      issue.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      issue.severity === 'high' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      issue.severity === 'medium' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}>
                      {issue.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{issue.title}</div>
                      {issue.displayValue && (
                        <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono mt-0.5">{issue.displayValue}</div>
                      )}
                    </div>
                    {issue.id?.startsWith('mozilla-observatory') ? (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono shrink-0 flex items-center gap-1">
                        <ShieldCheck size={9} /> Mozilla
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 font-mono shrink-0">
                        {issue.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: TECHNOLOGY STACK DETECTED */}
        {techStack.length > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Technology stack detected</h3>
            
            <div className="flex flex-wrap gap-2.5">
              {techStack.map((tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#080C14] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-gray-300">
                  {tech}
                </span>
              ))}
            </div>

            {/* GitHub source info */}
            {reportData?.githubSummary && (
              <div className="pt-3 border-t border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2">
                  <GitBranch size={12} className="text-[#00F5A0]" />
                  {reportData.githubSummary.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION: AI RECOMMENDATIONS & ACTION PLAN */}
        {actionPlan.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-[#00F5A0]" /> AI Recommendations & Fix Prompts
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Ready-to-use LLM prompts. Impact numbers are estimates and are capped by the current score gap.
              </p>
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
                      item.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
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
        ) : (
          /* Show explanation when no AI prompts are available */
          reportData && (
            <div className="p-6 rounded-2xl bg-slate-100 dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-slate-400 dark:text-gray-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-gray-300">AI Fix Prompts Not Available</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mx-auto">
                AI-generated fix prompts require NVIDIA AI to be configured on the server. 
                The audit scores and issues above are 100% real data from Google PageSpeed Insights.
              </p>
            </div>
          )
        )}

        {/* PROJECTED SCORE AFTER FIXES */}
        {targetScore > 0 && actionPlan.length > 0 && (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#00F5A0]/30 text-center space-y-4 shadow-sm dark:shadow-[0_0_40px_rgba(0,245,160,0.1)]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Projected score after fixes</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 max-w-md mx-auto">
              Estimated after fixes. Scores never exceed 100, and recommendation impacts are not guaranteed additive points.
            </p>

            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-slate-400 dark:text-gray-400">{displayScore}</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-500">Current</div>
              </div>

              <div className="text-xl font-bold text-[#00F5A0]">-&gt;</div>

              <div className="text-center">
                <div className="text-4xl font-mono font-extrabold text-[#00F5A0]">{projectedScore}</div>
                <div className="text-[10px] text-[#00F5A0]">Projected</div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no report data */}
        {!isInitialLoading && !reportData && (
          <div className="text-center py-20 space-y-4">
            <ShieldCheck size={48} className="mx-auto text-slate-300 dark:text-gray-600" />
            <h2 className="text-xl font-bold text-slate-500 dark:text-gray-400">Report Not Found</h2>
            <p className="text-sm text-slate-400 dark:text-gray-500">
              This scan report could not be loaded. It may have expired or the scan ID is invalid.
            </p>
          </div>
        )}

      </div>

      {/* AI FIX PROMPT MODAL */}
      <AnimatePresence>
        {activeFixModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-fix-modal-title"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-[#00F5A0]" size={20} aria-hidden="true" />
                  <h3 id="report-fix-modal-title" className="text-base font-bold text-slate-900 dark:text-white">AI Fix Prompt — {activeFixModal.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveFixModal(null)}
                  aria-label="Close modal"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0]"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeFixModal.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                      activeFixModal.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>{activeFixModal.priority}</span>
                    <span className="text-xs text-slate-500 dark:text-gray-400">{activeFixModal.time} | Impact: {activeFixModal.impact}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">{activeFixModal.detail}</p>
                </div>

                <div className="space-y-4">
                  {/* Prompt Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><Code size={14} aria-hidden="true" /> LLM Prompt — Paste into v0 / Bolt / Cursor</span>
                      <button
                        onClick={() => handleCopyPrompt(activeFixModal.prompt)}
                        aria-label="Copy AI fix prompt to clipboard"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-[#00F5A0] hover:bg-[#00F5A0]/10 transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 dark:border-[#00F5A0]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0]"
                      >
                        {copiedPrompt ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                        {copiedPrompt ? 'Copied!' : 'Copy Prompt 📋'}
                      </button>
                    </div>
                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-slate-100 dark:bg-[#05080E] border border-slate-200 dark:border-white/10 font-mono text-sm text-slate-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {activeFixModal.prompt}
                      </pre>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 italic pt-1">
                      Paste this into Antigravity, Cursor, v0, Bolt.new, Lovable, or ChatGPT. <strong>Important:</strong> After applying fixes, ensure changes are deployed to your live site before rescanning to see your updated score.
                    </p>
                  </div>

                  {/* Code Preview Box */}
                  {activeFixModal.code && (
                    <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5">Example Output</span>
                      </div>
                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-slate-900 dark:bg-black/40 border border-slate-700 dark:border-white/5 font-mono text-xs text-emerald-400 overflow-x-auto max-h-48 overflow-y-auto">
                          {activeFixModal.code}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-white/10 shrink-0 flex justify-end bg-slate-50 dark:bg-black/20">
                <button
                  onClick={() => setActiveFixModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm cursor-pointer shadow-[0_0_15px_rgba(0,245,160,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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
