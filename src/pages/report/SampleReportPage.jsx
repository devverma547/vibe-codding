import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Sparkles, Globe, GitBranch, Zap,
  Printer, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, Copy, Check,
  X, Code, Eye, Palette, Info, Database, ArrowRight
} from 'lucide-react';
import demoSnapshot from '../../data/demo-snapshot.json';
import { formatAiFixPrompt } from '../../utils/reportScoring';

// Map category IDs to icons
const categoryIcons = {
  security: ShieldCheck,
  performance: Zap,
  seo: Eye,
  accessibility: Palette,
  bestPractices: CheckCircle2,
  'best-practices': CheckCircle2,
  'code-quality': Code,
};

function getCategoryIcon(id) {
  const key = (id || '').toLowerCase().replace(/\s+/g, '-');
  return categoryIcons[key] || ShieldCheck;
}

function getSourceLabel(source) {
  switch (source) {
    case 'google-pagespeed': return { label: 'Google PageSpeed', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'github-code-review': return { label: 'GitHub Code Review', icon: Code, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    default: return { label: 'PageSpeed Data', icon: Database, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  }
}

function getVitalStatus(metric, value) {
  if (value === null || value === undefined) return 'unknown';
  const thresholds = {
    lcp: [2500, 4000], fcp: [1800, 3000], cls: [100, 250],
    fid: [100, 300], inp: [200, 500], ttfb: [800, 1800],
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

export default function SampleReportPage() {
  const [displayScore, setDisplayScore] = useState(0);
  const [activeFixModal, setActiveFixModal] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Use the static snapshot data
  const reportData = demoSnapshot;
  const targetScore = reportData.overallScore;
  const domainName = reportData.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const githubRepoUrl = reportData.githubRepo;
  const modules = reportData.modules || [];
  const allIssues = reportData.issues || [];
  const webVitals = reportData.webVitals || {};
  const techStack = reportData.techStack || [];
  const recommendations = reportData.recommendations || [];

  const stats = {
    passedChecks: modules.reduce((sum, m) => sum + (m.checks || []).filter(c => c.status === 'pass').length, 0),
    failedChecks: modules.reduce((sum, m) => sum + (m.checks || []).filter(c => c.status === 'fail').length, 0),
    warningChecks: modules.reduce((sum, m) => sum + (m.checks || []).filter(c => c.status === 'warn').length, 0),
    criticalIssues: reportData.criticalCount || 0,
  };

  const verdict = targetScore >= 90 ? 'Production Ready' : targetScore >= 75 ? 'Needs Minor Fixes' : targetScore >= 50 ? 'Needs Work Before Launch' : 'Critical Issues Found';
  const verdictColor = targetScore >= 90 ? 'emerald' : targetScore >= 75 ? 'blue' : targetScore >= 50 ? 'amber' : 'red';
  const scoreColor = targetScore >= 80 ? '#00F5A0' : targetScore >= 60 ? '#F5A623' : '#FF4D4D';

  const scanDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(reportData.createdAt)
  );

  // Score counter animation
  useEffect(() => {
    let current = 0;
    const duration = 1200;
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
  }, [targetScore]);

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

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 relative">
      <Helmet>
        <title>Sample Report — SiteProof AI Web Quality Audit</title>
        <meta name="description" content="See a sample SiteProof audit report showcasing how our platform analyzes sites and provides AI recommendations." />
      </Helmet>

        {/* DEMO BANNER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3 rounded-2xl bg-[#00F5A0]/5 dark:bg-[#00F5A0]/10 border border-[#00F5A0]/20">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#00F5A0]" />
            <span className="text-xs font-bold text-[#00F5A0] uppercase tracking-wider">Sample Report</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
            This is a <span className="font-semibold text-slate-900 dark:text-white">sample report</span> showcasing how SiteProof presents audit results and AI recommendations. 
            <Link to="/#scan" className="text-[#00F5A0] hover:underline ml-1 font-semibold">Scan your own site →</Link>
          </p>
        </div>

        {/* DATA SOURCE TRANSPARENCY BANNER */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
          <Info size={18} className="shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">Data Source:</span> This report was generated from <span className="font-bold">Google PageSpeed Insights</span> — all scores, issues, and metrics are from real scan data.
          </p>
        </div>

        {/* TOP SUMMARY HEADER CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-6 relative overflow-hidden">
          
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Google PageSpeed Insights
            </span>
          </div>

          {/* Top Bar inside Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">{domainName}</h1>
              {githubRepoUrl && (
                <a href={githubRepoUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-mono text-[#00F5A0] hover:underline">
                  <GitBranch size={12} /> {githubRepoUrl.replace('https://github.com/', '')}
                </a>
              )}
              <span className="text-xs text-slate-500 dark:text-gray-400">Scanned on {scanDate}</span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,245,160,0.3)] transition-all cursor-pointer">
                <Printer size={14} /> Print / PDF
              </button>
            </div>
          </div>

          {/* Score & Verdict Row */}
          <div className="flex flex-col md:flex-row items-center gap-8 pt-2">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="9" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="9"
                  strokeDasharray="263" strokeDashoffset={263 - (263 * displayScore) / 100}
                  strokeLinecap="round" className="transition-all duration-300 ease-out" />
              </svg>
              <div className="absolute text-center">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{displayScore}</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">out of 100</div>
              </div>
            </div>

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

              <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl">{reportData.summary}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs">
                <div className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-gray-300">
                  Security: <span className="font-bold text-slate-900 dark:text-white font-mono">{reportData.scores.security}/100</span>
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

        {/* SECTION: CORE WEB VITALS */}
        {Object.values(webVitals).some(v => v !== null && v !== undefined) && (
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
                  <div key={vital.key} className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 text-center space-y-1.5">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modules.map((m, moduleIdx) => {
                const IconComponent = getCategoryIcon(m.id || m.category);
                const numericScore = parseFloat(m.score) || 0;
                const sourceInfo = getSourceLabel(m.source);
                const SourceIcon = sourceInfo.icon;
                
                return (
                  <div key={m.id || moduleIdx}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all space-y-4">
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
                          <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[9px] font-semibold border ${sourceInfo.color}`}>
                            <SourceIcon size={9} />
                            {sourceInfo.label}
                          </div>
                        </div>
                      </div>
                      <span className={`text-lg font-extrabold font-mono ${
                        numericScore >= 8 ? 'text-[#00F5A0]' : numericScore >= 5 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {m.score}<span className="text-xs text-slate-400 dark:text-gray-500 font-normal">/10</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">{m.description}</p>

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${numericScore * 10}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${
                          numericScore >= 8 ? 'bg-gradient-to-r from-[#00F5A0] to-[#00E599]' :
                          numericScore >= 5 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`} />
                    </div>

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

        {/* SECTION: ALL ISSUES FOUND */}
        {allIssues.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                All Issues Found <span className="text-sm font-normal text-slate-500 dark:text-gray-400 ml-2">({allIssues.length} total)</span>
              </h2>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">
                Google PageSpeed
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {allIssues.map((issue, idx) => (
                  <div key={issue.id || idx}
                    className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
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
                    <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 font-mono shrink-0">
                      {issue.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: TECHNOLOGY STACK */}
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
          </div>
        )}

        {/* SECTION: RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-[#00F5A0]" /> Recommendations & Fix Prompts
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Actionable fixes based on real PageSpeed audit data. Use the prompts with AI coding assistants.
              </p>
            </div>

            <div className="space-y-3">
              {recommendations.map((item, idx) => (
                <div key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                    <button onClick={() => setActiveFixModal(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#00F5A0]/10 hover:bg-[#00F5A0] text-[#00F5A0] hover:text-slate-950 font-bold text-xs border border-[#00F5A0]/30 transition-all flex items-center gap-1.5 cursor-pointer">
                      View Fix <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA: Scan your own site */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#00F5A0]/30 text-center space-y-4 shadow-sm dark:shadow-[0_0_40px_rgba(0,245,160,0.1)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Want to scan your own website?</h3>
          <p className="text-xs text-slate-600 dark:text-gray-400 max-w-md mx-auto">
            Get an actionable audit and AI recommendations for your own site in under 30 seconds.
          </p>
          <Link to="/#scan"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm transition-all shadow-[0_0_25px_rgba(0,245,160,0.35)] hover:shadow-[0_0_40px_rgba(0,245,160,0.6)] cursor-pointer">
            Scan Your Site Now <ArrowRight size={18} />
          </Link>
        </div>

      {/* FIX DETAIL MODAL */}
      <AnimatePresence>
        {activeFixModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sample-fix-modal-title"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-[#00F5A0]" size={20} aria-hidden="true" />
                  <h3 id="sample-fix-modal-title" className="text-base font-bold text-slate-900 dark:text-white">Fix — {activeFixModal.title}</h3>
                </div>
                <button onClick={() => setActiveFixModal(null)}
                  aria-label="Close modal"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0]">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    activeFixModal.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                    activeFixModal.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>{activeFixModal.priority}</span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">⏱ {activeFixModal.time} · Impact: {activeFixModal.impact}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">{activeFixModal.detail}</p>

                {/* Generated prompt */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><Code size={14} aria-hidden="true" /> LLM Prompt — Paste into v0 / Bolt / Cursor</span>
                    <button onClick={() => handleCopyPrompt(formatAiFixPrompt(domainName, activeFixModal.title, activeFixModal.detail, githubRepoUrl))}
                      aria-label="Copy AI fix prompt to clipboard"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-[#00F5A0] hover:bg-[#00F5A0]/10 transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 dark:border-[#00F5A0]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0]">
                      {copiedPrompt ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                      {copiedPrompt ? 'Copied!' : 'Copy Prompt 📋'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-100 dark:bg-[#05080E] border border-slate-200 dark:border-white/10 font-mono text-sm text-slate-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {formatAiFixPrompt(domainName, activeFixModal.title, activeFixModal.detail, githubRepoUrl)}
                  </pre>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 italic pt-1">
                    Paste this into Antigravity, Cursor, v0, Bolt.new, Lovable, or ChatGPT. <strong>Important:</strong> After applying fixes, ensure changes are deployed to your live site before rescanning to see your updated score.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/10 shrink-0 flex justify-end bg-slate-50 dark:bg-black/20">
                <button onClick={() => setActiveFixModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm cursor-pointer shadow-[0_0_15px_rgba(0,245,160,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
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
