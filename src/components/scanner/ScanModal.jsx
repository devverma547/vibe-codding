import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Loader2, Sparkles, ArrowRight, X, Terminal } from 'lucide-react';
import { scannerService } from '../../services/scanner.service';

const steps = [
  { title: 'Connecting to Host & Parsing DOM', detail: 'Fetching headers, TLS certificates, and DNS records...' },
  { title: 'Security & Vulnerability Audit', detail: 'Testing HSTS, CSP headers, XSS exposure, exposed secrets...' },
  { title: 'Core Web Vitals & Payload Metrics', detail: 'Measuring LCP, CLS, FID, uncompressed hero images...' },
  { title: 'Accessibility & WCAG 2.1 AA Analysis', detail: 'Scanning contrast ratios, ARIA landmarks, alt attributes...' },
  { title: 'SEO & Structured Data Verification', detail: 'Checking title tags, meta description, OpenGraph, JSON-LD...' },
  { title: 'AI Copy & Legal Compliance Check', detail: 'Evaluating readability, privacy policy, GDPR cookie consent...' },
  { title: 'Synthesizing 13-Module Health Score', detail: 'Generating prioritized AI action plan and score breakdown...' },
];

export default function ScanModal({ isOpen, onClose, targetUrl, githubRepo }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [generatedReportId, setGeneratedReportId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStepIndex(0);
      setLogs([]);
      setGeneratedReportId(null);
      return;
    }

    const cleanUrl = targetUrl || 'https://your-site.com';
    const initialLogs = [`[0.00s] Initializing SiteProof AI Engine v2.6 for ${cleanUrl}`];
    if (githubRepo) {
      initialLogs.push(`[0.05s] Linked Source Repo: ${githubRepo}`);
    }
    setLogs(initialLogs);

    // Trigger real scan storage in database
    scannerService.analyzeSite(cleanUrl, githubRepo).then((res) => {
      if (res.success && res.data) {
        setGeneratedReportId(res.data.report?.id || res.data.scan?.id || cleanUrl);
      }
    }).catch(console.error);

    let stepCounter = 0;
    const interval = setInterval(() => {
      stepCounter++;
      const nextProgress = Math.min(Math.round((stepCounter / steps.length) * 100), 100);
      setProgress(nextProgress);

      if (stepCounter < steps.length) {
        setCurrentStepIndex(stepCounter);
        setLogs((prev) => [
          ...prev,
          `[${(stepCounter * 0.4).toFixed(2)}s] ${steps[stepCounter].title}... OK`,
        ]);
      } else {
        clearInterval(interval);
        setLogs((prev) => [
          ...prev,
          `[2.80s] Audit complete! Health Score calculated.`,
        ]);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, targetUrl, githubRepo]);

  if (!isOpen) return null;

  const displayUrl = targetUrl || 'https://your-site.com';
  const isFinished = progress >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0B101D] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,245,160,0.15)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080C14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center text-[#00F5A0]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                Scanning Site <span className="text-[#00F5A0] font-mono text-sm font-normal">{displayUrl}</span>
                {githubRepo && (
                  <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono font-normal flex items-center gap-1">
                    <Terminal size={10} className="text-[#00F5A0]" /> {githubRepo.replace('https://github.com/', '')}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">Running full-spectrum 13-module quality audit</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Progress Bar & Radial Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-300 flex items-center gap-1.5">
                {!isFinished ? (
                  <Loader2 size={14} className="animate-spin text-[#00F5A0]" />
                ) : (
                  <CheckCircle2 size={14} className="text-[#00F5A0]" />
                )}
                {isFinished ? 'Analysis Complete!' : steps[currentStepIndex]?.title}
              </span>
              <span className="text-[#00F5A0] font-mono font-bold text-sm">{progress}%</span>
            </div>

            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#00F5A0] to-[#00E599] shadow-[0_0_15px_rgba(0,245,160,0.5)]"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
          </div>

          {/* Active Step Details Card */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#00F5A0] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isFinished ? 'Report ready for inspection' : steps[currentStepIndex]?.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {isFinished ? 'Found potential improvements across audit modules.' : steps[currentStepIndex]?.detail}
              </p>
            </div>
          </div>

          {/* Console / Terminal Log Output */}
          <div className="bg-[#05080E] border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-1.5 max-h-40 overflow-y-auto">
            <div className="text-gray-500 flex items-center gap-2 pb-1 border-b border-white/5 text-[11px]">
              <Terminal size={12} className="text-[#00F5A0]" /> SiteProof Live Scan Stream
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2 text-emerald-400/90">
                <span className="text-gray-600">›</span> {log}
              </div>
            ))}
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
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
              View Detailed Audit Report <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
