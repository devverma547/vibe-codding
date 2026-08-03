import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-[#05080E] border-t border-slate-200 dark:border-white/5 py-16 text-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0]">
                <ShieldCheck size={18} />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">SiteProof</span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed max-w-[240px]">
              AI-powered website auditing engine. Scan any URL across 12 quality modules and get AI prompts to fix every issue.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] hover:border-[#00F5A0]/30 transition-all" aria-label="Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] hover:border-[#00F5A0]/30 transition-all" aria-label="GitHub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] hover:border-[#00F5A0]/30 transition-all" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Features</Link></li>
              <li><Link to="/pricing" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Pricing</Link></li>
              <li><Link to="/dashboard" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Dashboard</Link></li>
              <li><Link to="/report/novaflow-ai.vercel.app" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Sample Report</Link></li>
              <li><a href="#" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">API Docs</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Company</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">About Us</Link></li>
              <li><Link to="/contact" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Contact</Link></li>
              <li><a href="#" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Blog</a></li>
              <li><a href="#" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Careers</a></li>
            </ul>
          </div>

          {/* Column 4: Legal + Newsletter */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Terms of Service</a></li>
                <li><a href="#" className="text-slate-500 dark:text-gray-400 hover:text-[#00F5A0] transition-colors text-xs">Cookie Policy</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Stay Updated</h4>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#00F5A0]/50 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 text-xs font-bold transition-all cursor-pointer"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-gray-500">
            © 2026 SiteProof. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-500">
            <a href="#" className="hover:text-[#00F5A0] transition-colors">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-[#00F5A0] transition-colors">Terms</a>
            <span>·</span>
            <a href="#" className="hover:text-[#00F5A0] transition-colors">Cookies</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
