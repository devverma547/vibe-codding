import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Code, Eye } from 'lucide-react';

export default function InteractiveDemoVideo() {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'fixes', 'comparison'

  return (
    <div className="w-full max-w-5xl mx-auto my-16 px-4">
      {/* Container Wrapper with Cyber-Glow styling */}
      <div className="relative rounded-2xl bg-[#090E1A] border border-white/10 shadow-[0_0_50px_rgba(0,245,160,0.12)] overflow-hidden">
        
        {/* Top Control Header */}
        <div className="px-6 py-4 bg-[#060912] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-gray-400 pl-2 border-l border-white/10">
              SiteProof Live Audit Stream v2.6
            </span>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'scan' ? 'bg-[#00F5A0] text-slate-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={13} className="inline mr-1.5" /> Live Scan Demo
            </button>
            <button
              onClick={() => setActiveTab('fixes')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'fixes' ? 'bg-[#00F5A0] text-slate-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code size={13} className="inline mr-1.5" /> AI Fix Generator
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'comparison' ? 'bg-[#00F5A0] text-slate-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} className="inline mr-1.5" /> Before / After
            </button>
          </div>
        </div>

        {/* Video Player Display Screen */}
        <div className="relative min-h-[380px] bg-[#04060C] flex flex-col justify-between p-6 overflow-hidden">
          
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* TAB CONTENT 1: LIVE SCAN IN ACTION */}
          {activeTab === 'scan' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 space-y-6"
            >
              {/* Animated Scan Beam */}
              <motion.div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00F5A0] to-transparent shadow-[0_0_15px_#00F5A0] pointer-events-none"
                animate={{ y: [0, 280, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <div>
                  <div className="text-xs font-mono text-[#00F5A0] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
                    LIVE SCANNING · target: novaflow-ai.vercel.app
                  </div>
                  <h4 className="text-lg font-bold text-white mt-1">Analyzing 13 Quality & Security Modules</h4>
                </div>
                <div className="flex items-center gap-2 bg-[#00F5A0]/10 border border-[#00F5A0]/30 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-[#00F5A0]">
                  Score: 72/100
                </div>
              </div>

              {/* Grid of detected issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Critical Vulnerability</div>
                    <div className="text-sm font-semibold text-white mt-0.5">Strict-Transport-Security (HSTS) Missing</div>
                    <div className="text-xs text-gray-400 mt-1">Exposes users to SSL stripping attacks on insecure HTTP requests.</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Accessibility Warning</div>
                    <div className="text-sm font-semibold text-white mt-0.5">WCAG Contrast Ratio Failed (2.8:1)</div>
                    <div className="text-xs text-gray-400 mt-1">Button text contrast fails level AA accessibility standard.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT 2: AI CODE FIX GENERATOR */}
          {activeTab === 'fixes' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-[#00F5A0] font-semibold flex items-center gap-2">
                  <Code size={14} /> SiteProof AI Code Generator Output
                </div>
                <span className="text-xs text-gray-400 font-mono">vercel.json / headers.config</span>
              </div>

              <div className="bg-[#020408] border border-emerald-500/30 rounded-xl p-4 font-mono text-xs text-gray-300 leading-relaxed space-y-2 shadow-[0_0_20px_rgba(0,245,160,0.1)]">
                <div className="text-gray-500">// Copy and paste into your project root to immediately fix 2 critical issues:</div>
                <div className="text-emerald-400">{"{"}</div>
                <div className="pl-4 text-emerald-400">{"\"headers\": ["}</div>
                <div className="pl-8 text-blue-300">{"{"}</div>
                <div className="pl-12 text-gray-300">{"\"source\": \"/(.*)\","}</div>
                <div className="pl-12 text-gray-300">{"\"headers\": ["}</div>
                <div className="pl-16 text-yellow-300">{"{ \"key\": \"Strict-Transport-Security\", \"value\": \"max-age=63072000; includeSubDomains; preload\" },"}</div>
                <div className="pl-16 text-yellow-300">{"{ \"key\": \"X-Content-Type-Options\", \"value\": \"nosniff\" }"}</div>
                <div className="pl-12 text-gray-300">{"]"}</div>
                <div className="pl-8 text-blue-300">{"}"}</div>
                <div className="pl-4 text-emerald-400">{"]"}</div>
                <div className="text-emerald-400">{"}"}</div>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT 3: BEFORE VS AFTER COMPARISON */}
          {activeTab === 'comparison' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 my-auto"
            >
              <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 text-center space-y-3">
                <div className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">BEFORE AUDIT</div>
                <div className="text-5xl font-extrabold text-red-400 font-mono">64<span className="text-lg font-normal text-gray-500">/100</span></div>
                <p className="text-xs text-gray-400">7 Critical security header failures & unoptimized hero images.</p>
              </div>

              <div className="p-6 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-center space-y-3 shadow-[0_0_30px_rgba(0,245,160,0.15)]">
                <div className="text-xs font-mono text-[#00F5A0] uppercase tracking-widest font-bold">AFTER SITEPROOF FIXES</div>
                <div className="text-5xl font-extrabold text-[#00F5A0] font-mono">91<span className="text-lg font-normal text-gray-500">/100</span></div>
                <p className="text-xs text-[#00F5A0]/90 font-medium">100% WCAG compliant, fast LCP under 0.8s, full SSL headers.</p>
              </div>
            </motion.div>
          )}



        </div>
      </div>
    </div>
  );
}
