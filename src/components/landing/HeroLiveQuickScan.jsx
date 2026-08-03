import React, { useState } from 'react';
import { Zap, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

export default function HeroLiveQuickScan({ onFullScan }) {
  const [testUrl, setTestUrl] = useState('https://novaflow-ai.vercel.app');
  const [isQuickChecking, setIsQuickChecking] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  const handleRunQuickCheck = (e) => {
    e.preventDefault();
    if (!testUrl) return;

    setIsQuickChecking(true);
    setQuickResult(null);

    // Simulate instant live check in 1.2s
    setTimeout(() => {
      setIsQuickChecking(false);
      setQuickResult({
        domain: testUrl.replace(/https?:\/\//, '').split('/')[0],
        overallScore: 94,
        sslStatus: 'Valid (TLS 1.3)',
        cspStatus: 'Active',
        lcpSpeed: '0.62s',
        seoScore: '98/100',
        quickRecommendation: '1 minor header key optimization suggested'
      });
    }, 1200);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-white/80 dark:bg-[#0D1527]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-200">
            Live Instant Quick-Check
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-600 dark:text-[#00F5A0] bg-emerald-500/10 px-2 py-0.5 rounded-full">
          2s Check
        </span>
      </div>

      <form onSubmit={handleRunQuickCheck} className="flex gap-2">
        <input
          type="url"
          required
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          placeholder="https://your-website.com"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00F5A0]"
        />
        <button
          type="submit"
          disabled={isQuickChecking}
          className="px-4 py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isQuickChecking ? (
            <>
              <Activity className="animate-spin" size={14} /> Testing...
            </>
          ) : (
            <>
              Quick Test <Zap size={14} />
            </>
          )}
        </button>
      </form>

      {/* QUICK RESULT BOX */}
      {quickResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#00F5A0]" size={18} />
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{quickResult.domain}</span>
            </div>
            <div className="text-sm font-extrabold text-[#00F5A0] font-mono">
              Score: {quickResult.overallScore}/100
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 dark:text-gray-300">
            <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5">
              <span className="block text-[10px] text-slate-400">SSL Cert</span>
              <span className="font-bold text-emerald-600 dark:text-[#00F5A0]">{quickResult.sslStatus}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5">
              <span className="block text-[10px] text-slate-400">Speed (LCP)</span>
              <span className="font-bold text-emerald-600 dark:text-[#00F5A0]">{quickResult.lcpSpeed}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5">
              <span className="block text-[10px] text-slate-400">SEO Index</span>
              <span className="font-bold text-emerald-600 dark:text-[#00F5A0]">{quickResult.seoScore}</span>
            </div>
          </div>

          <button
            onClick={() => onFullScan?.(testUrl)}
            className="w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Launch Full 12-Module Deep Audit Report <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
