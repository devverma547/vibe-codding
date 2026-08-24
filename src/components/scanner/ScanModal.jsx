import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Loader2, Sparkles, ArrowRight, X, Terminal, GitBranch } from 'lucide-react';
import { scannerService } from '../../services/scanner.service';
import { useAuth } from '../../contexts/AuthContext';

const steps = [
  { title: 'Connecting to Host & Parsing DOM', detail: 'Fetching headers, TLS certificates, and DNS records...' },
  { title: 'Running Google PageSpeed Insights', detail: 'Measuring performance, SEO, accessibility, and best practices via Lighthouse API...' },
  { title: 'Extracting Source Code from GitHub', detail: 'Fetching repository file tree and reading critical source files...' },
  { title: 'Security & Vulnerability Audit', detail: 'Checking HTTPS, security headers, and running vulnerability scans...' },
  { title: 'Core Web Vitals & Payload Metrics', detail: 'Analyzing LCP, CLS, FCP, INP, TTFB, and image optimization...' },
  { title: 'Sending to AI for Deep Analysis', detail: 'Bundling PageSpeed + source code for 6-module audit report...' },
  { title: 'AI Generating Fix Prompts & Action Plan', detail: 'Creating paste-ready LLM prompts for v0, Bolt.new, and Lovable...' },
  { title: 'Synthesizing Health Score & Report', detail: 'Calculating weighted score across all audit modules...' },
];

export default function ScanModal({ isOpen, onClose, targetUrl, githubRepo }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [generatedReportId, setGeneratedReportId] = useState(null);
  const [scanError, setScanError] = useState(null);
  const scanTriggered = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStepIndex(0);
      setLogs([]);
      setGeneratedReportId(null);
      setScanError(null);
      scanTriggered.current = false;
      return;
    }

    // Prevent double-triggering in React StrictMode
    if (scanTriggered.current) return;
    scanTriggered.current = true;

    const cleanUrl = targetUrl || 'https://your-site.com';
    const initialLogs = [`[0.00s] Initializing SiteProof AI Engine v3.0 for ${cleanUrl}`];
    if (githubRepo) {
      initialLogs.push(`[0.00s] Linked Source Repo: ${githubRepo}`);
      initialLogs.push(`[0.00s] GitHub code extraction will run in parallel with PageSpeed`);
    }
    initialLogs.push(`[0.00s] AI analysis will use the configured server model if available`);
    setLogs(initialLogs);

    const startTime = Date.now();

    // Trigger the REAL fresh scan pipeline (with parallel multitasking)
    scannerService
      .analyzeSite(cleanUrl, githubRepo, user?.id || null, (pct, step, msg) => {
        // Real progress callback from the scanner
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        setProgress(pct);

        // Map scanner step to our display step
        const displayStep = Math.min(step, steps.length - 1);
        setCurrentStepIndex(displayStep);

        setLogs((prev) => [
          ...prev,
          `[${elapsed}s] ${msg}`,
        ]);
      }, { forceRefresh: true })
      .then((res) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (res.success && res.data) {
          setGeneratedReportId(res.data.scanId);
          setProgress(100);
          setCurrentStepIndex(steps.length - 1);
          setLogs((prev) => [
            ...prev,
            `[${elapsed}s] Audit complete. Health Score: ${res.data.overallScore}/100`,
            res.data.aiReport?.source === 'nvidia-ai'
              ? `[${elapsed}s] AI analysis powered by NVIDIA NIM${res.data.aiReport.model ? ` (${res.data.aiReport.model})` : ''}`
              : `[${elapsed}s] Report generated from PageSpeed data`,
          ]);
        } else {
          setScanError(res.error || 'Scan failed');
          setLogs((prev) => [
            ...prev,
            `[${elapsed}s] Error: ${res.error || 'Unknown error'}`,
          ]);
        }
      })
      .catch((err) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        setScanError(err.message);
        setLogs((prev) => [
          ...prev,
          `[${elapsed}s] Fatal error: ${err.message}`,
        ]);
      });

    // Animate steps while we wait (visual feedback for long scans)
    let visualStep = 0;
    const stepInterval = setInterval(() => {
      visualStep++;
      if (visualStep < steps.length) {
        // Only update visual step if real progress hasn't surpassed it
        setCurrentStepIndex((current) => Math.max(current, Math.min(visualStep, steps.length - 1)));
      } else {
        clearInterval(stepInterval);
      }
    }, 3000); // Slower intervals since real scans take ~15-30s

    return () => clearInterval(stepInterval);
  }, [isOpen, targetUrl, githubRepo, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayUrl = targetUrl || 'https://your-site.com';
  const isFinished = progress >= 100;
  const hasError = !!scanError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0B101D] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,245,160,0.15)] overflow-hidden max-h-[90vh] flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080C14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center text-[#00F5A0]">
              <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <div>
              <h3 id="scan-modal-title" className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                Scanning Site <span className="text-[#00F5A0] font-mono text-sm font-normal">{displayUrl}</span>
                {githubRepo && (
                  <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono font-normal flex items-center gap-1">
                    <GitBranch size={10} className="text-[#00F5A0]" aria-hidden="true" /> {githubRepo.replace('https://github.com/', '')}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                {githubRepo
                  ? 'Running full-stack AI audit: PageSpeed + GitHub + NVIDIA AI'
                  : 'Running AI-powered quality audit via PageSpeed + NVIDIA AI'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close scan modal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Progress Bar & Radial Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-300 flex items-center gap-1.5">
                {hasError ? (
                  <span className="text-red-400">✕</span>
                ) : !isFinished ? (
                  <Loader2 size={14} className="animate-spin text-[#00F5A0]" />
                ) : (
                  <CheckCircle2 size={14} className="text-[#00F5A0]" />
                )}
                {hasError ? 'Scan Failed' : isFinished ? 'Analysis Complete!' : steps[currentStepIndex]?.title}
              </span>
              <span className={`font-mono font-bold text-sm ${hasError ? 'text-red-400' : 'text-[#00F5A0]'}`}>
                {progress}%
              </span>
            </div>

            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                className={`h-full rounded-full shadow-[0_0_15px_rgba(0,245,160,0.5)] ${
                  hasError
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-[#00F5A0] to-[#00E599]'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
          </div>

          {/* Live Checklist — keeps users engaged */}
          <div className="space-y-1.5 py-1">
            {steps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isActive = idx === currentStepIndex && !isFinished && !hasError;
              const isAllDone = isFinished;

              return (
                <div key={idx} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                  hasError && idx === currentStepIndex ? 'text-red-400' :
                  isDone || isAllDone ? 'text-[#00F5A0]/70' :
                  isActive ? 'text-white font-medium' :
                  'text-gray-600'
                }`}>
                  <span className="w-5 text-center shrink-0">
                    {hasError && idx === currentStepIndex ? '✕' :
                     isDone || isAllDone ? '✅' :
                     isActive ? '⏳' : '○'}
                  </span>
                  <span className={isActive ? 'animate-pulse' : ''}>{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Active Step Details Card */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            hasError
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-white/[0.03] border-white/5'
          }`}>
            <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${hasError ? 'text-red-400' : 'text-[#00F5A0]'}`} />
            <div>
              <h4 className="text-sm font-semibold text-white">
                {hasError ? 'Scan encountered an error' : isFinished ? 'Report ready for inspection' : steps[currentStepIndex]?.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {hasError
                  ? scanError
                  : isFinished
                  ? 'Found potential improvements across audit modules. Fix prompts are ready.'
                  : steps[currentStepIndex]?.detail}
              </p>
            </div>
          </div>

          {/* Console / Terminal Log Output */}
          <div className="bg-[#05080E] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-1.5 max-h-44 overflow-y-auto">
            <div className="text-gray-500 flex items-center gap-2 pb-1 border-b border-white/5 text-[11px]">
              <Terminal size={12} className="text-[#00F5A0]" /> SiteProof Live Scan Stream — AI Pipeline v3.0
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${
                log.includes('❌') ? 'text-red-400' :
                log.includes('✅') || log.includes('🤖') || log.includes('📊') ? 'text-[#00F5A0]' :
                'text-emerald-400/90'
              }`}>
                <span className="text-gray-600 shrink-0">›</span> <span className="break-all">{log}</span>
              </div>
            ))}
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
            >
              {hasError ? 'Close' : 'Cancel'}
            </button>
            <button
              disabled={!isFinished}
              onClick={() => {
                onClose();
                const targetId = generatedReportId || displayUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                navigate(`/report/${targetId}`, { state: { githubRepo } });
              }}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                isFinished
                  ? 'bg-[#00F5A0] text-slate-950 shadow-[0_0_20px_rgba(0,245,160,0.4)] hover:shadow-[0_0_30px_rgba(0,245,160,0.6)]'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              View AI Audit Report <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
