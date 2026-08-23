import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Menu, X, Home, LayoutDashboard, 
  FileText, Info, Mail, ArrowRight, Zap, LogOut, History 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Toggle from '../ui/Toggle';

/**
 * SiteProof Navbar
 * - Supports light & dark mode theme switching
 * - Displays links in the top navbar header
 * - Left 3-line hamburger menu button opens left sidebar
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle ESC key press to close sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Public links (always shown)
  const publicNavLinks = [
    { label: 'Home', href: '/', icon: <Home size={18} /> },
    { label: 'Live Demo', href: '/sample-report', icon: <FileText size={18} /> },
    { label: 'About us', href: '/about', icon: <Info size={18} /> },
    { label: 'Contact us', href: '/contact', icon: <Mail size={18} /> },
  ];

  // Links only shown when logged in
  const authNavLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'History', href: '/history', icon: <History size={18} /> },
  ];

  const allNavLinks = isAuthenticated 
    ? [publicNavLinks[0], ...authNavLinks, ...publicNavLinks.slice(1)]
    : publicNavLinks;

  return (
    <>
      <nav aria-label="Main Navigation" className={`fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-50/95 dark:bg-[#080C14]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-lg shadow-black/10 dark:shadow-black/60' 
          : 'bg-slate-50/80 dark:bg-[#080C14]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* LEFT SIDE: Three-Line Menu Button + Brand Logo */}
          <div className="flex items-center gap-3.5">
            
            {/* 3-Line Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-gray-200 hover:text-[#00F5A0] dark:hover:text-[#00F5A0] hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm flex items-center gap-2 active:scale-95 group"
              aria-label="Toggle Left Menu Sidebar"
            >
              <Menu size={20} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Brand Logo */}
            <Link to="/" aria-label="SiteProof Homepage" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.2)] group-hover:scale-105 transition-transform">
                <ShieldCheck size={22} className="text-[#00F5A0]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                SiteProof
              </span>
            </Link>

          </div>

          {/* CENTER TOP NAVBAR: ALL 6 LINKS */}
          <div 
            className="hidden md:flex items-center gap-3 lg:gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap px-2 max-w-[50vw] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {allNavLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`transition-all hover:text-[#00F5A0] ${
                  location.pathname === link.href 
                    ? 'text-[#00F5A0] font-bold bg-[#00F5A0]/10 px-3 py-1 rounded-full' 
                    : 'text-slate-700 dark:text-gray-300 px-3 py-1'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
            
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2 rounded-full bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 text-xs sm:text-sm font-bold transition-all duration-200 shadow-[0_0_20px_rgba(0,245,160,0.3)] hover:shadow-[0_0_30px_rgba(0,245,160,0.5)] active:scale-95 cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={async () => { await logout(); navigate('/'); }}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2 rounded-full bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 text-xs sm:text-sm font-bold transition-all duration-200 shadow-[0_0_20px_rgba(0,245,160,0.3)] hover:shadow-[0_0_30px_rgba(0,245,160,0.5)] active:scale-95 cursor-pointer"
              >
                Sign Up Free
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* POPUP LEFT SIDEBAR DRAWER OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            
            {/* Click Outside Area to hide sidebar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto"
              aria-hidden="true"
            />

            {/* Left Sliding Drawer Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="SiteProof Navigation Drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-80 max-w-[85vw] h-full bg-slate-50 dark:bg-[#080C14] border-r border-slate-200 dark:border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.3)] dark:shadow-[20px_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between p-6 overflow-y-auto pointer-events-auto z-10"
            >
              <div className="space-y-6">
                
                {/* Sidebar Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0]">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">SiteProof Menu</span>
                  </div>

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    aria-label="Close Left Sidebar Menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Sidebar Navigation Items */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase text-[#00F5A0] tracking-widest px-3 mb-2 font-semibold">
                    Navigation Pages
                  </div>

                  {allNavLinks.map((link) => {
                    const isActive = location.pathname === link.href;
                    return (
                      <Link
                        key={link.label}
                        to={link.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                          isActive
                            ? 'bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 font-bold'
                            : 'text-slate-700 dark:text-gray-300 hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-[#00F5A0]' : 'text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white'}>
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                        </div>
                        <span className={`text-xs ${isActive ? 'text-[#00F5A0]' : 'text-slate-400 dark:text-gray-500 group-hover:text-[#00F5A0]'}`}>
                          {isActive ? '●' : '→'}
                        </span>
                      </Link>
                    );
                  })}
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00F5A0]">
                    <Zap size={14} /> Instant AI Audit
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed">
                    Scan any live URL across 12 quality modules in under 2 minutes.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    if (isAuthenticated) {
                      navigate('/dashboard');
                    } else {
                      navigate('/signup');
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Sign Up Free'} <ArrowRight size={14} />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
