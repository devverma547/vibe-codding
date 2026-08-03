import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Compass, Users, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-gray-100 font-sans flex flex-col transition-colors duration-300">
      <main className="flex-1 pt-28 pb-24">
        
        {/* HERO SECTION */}
        <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight"
          >
            AI ships sites fast.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] via-[#00E093] to-[#00B4D8]">Nobody checks them.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            A generated site looks finished the moment it renders. The gaps show up later — a missing privacy policy, contrast that fails WCAG, a 2 MB hero image, no security headers. SiteProof is the review step between "it looks done" and "it is done".
          </motion.p>
        </section>

        {/* 3 STATS CARDS - Accurate, grounded metrics */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
              <div className="text-4xl font-extrabold text-[#00F5A0] font-mono">12</div>
              <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">quality & security modules</div>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
              <div className="text-4xl font-extrabold text-[#00F5A0] font-mono">60+</div>
              <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">individual technical checks</div>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
              <div className="text-4xl font-extrabold text-[#00F5A0] font-mono">2 min</div>
              <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">average scan completion</div>
            </div>

          </div>
        </section>

        {/* SECTION: WHAT WE HOLD OURSELVES TO */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-8">
            What we hold ourselves to
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0]">
                <Eye size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Show the evidence</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                Every score links back to the exact check that produced it. No black-box grades.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0]">
                <Compass size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rank by impact</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                A missing privacy policy outranks a stray console warning. We sort your work for you.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0]">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Written for builders</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                Plain language over jargon, with the fix spelled out — not just the failure.
              </p>
            </div>

          </div>
        </section>

        {/* BOTTOM CALLOUT CTA */}
        <section className="max-w-5xl mx-auto px-4 pt-16">
          <div className="p-10 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 text-center space-y-4 relative overflow-hidden shadow-md dark:shadow-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,160,0.1)_0%,transparent_70%)] pointer-events-none" />
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white relative z-10">
              Run your first audit
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 max-w-lg mx-auto relative z-10">
              Paste a URL and see all 12 modules scored in under 2 minutes.
            </p>

            <div className="pt-4 relative z-10">
              <Link
                to="/#scan"
                className="px-8 py-3 rounded-full bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm inline-flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] hover:shadow-[0_0_30px_rgba(0,245,160,0.5)] cursor-pointer"
              >
                Scan a website <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

