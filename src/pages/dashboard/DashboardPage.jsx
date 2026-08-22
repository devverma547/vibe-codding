import React, { useState, useEffect } from 'react';
import { Bell, Plus, ArrowUpRight, MessageSquare, Trash2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import ScanModal from '../../components/scanner/ScanModal';
import OnboardingModal from '../../components/auth/OnboardingModal';
import { useAuth } from '../../contexts/AuthContext';
import { websiteService, contactService } from '../../services/database.service';
import { scannerService } from '../../services/scanner.service';
import { supabase } from '../../config/supabase';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [quickScanUrl, setQuickScanUrl] = useState('');
  const [quickScanGithubRepo, setQuickScanGithubRepo] = useState('');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [targetScanUrl, setTargetScanUrl] = useState('');
  const [targetScanGithubRepo, setTargetScanGithubRepo] = useState('');
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteGithubRepo, setNewSiteGithubRepo] = useState('');
  
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState({ totalScans: 0, avgScore: 0, criticalIssues: 0 });
  const [trendData, setTrendData] = useState([]);
  const [bestPerformer, setBestPerformer] = useState({ name: 'None', score: 0 });
  const [contactMessages, setContactMessages] = useState([]);

  useEffect(() => {
    // Load contact messages
    contactService.getAll().then(setContactMessages);
    if (!user) {
      setSites([]);
      setStats({ totalScans: 0, avgScore: 0, criticalIssues: 0 });
      setTrendData([]);
      return;
    }

    const loadData = async () => {
      try {
        // Fetch monitored websites
        const websites = await websiteService.getAll(user.id);
        const mappedSites = websites.map(w => ({
          id: w.id,
          name: w.name || w.domain,
          url: w.url,
          issues: `${w.scan_count || 0} scans`,
          lastScan: w.last_scanned_at ? new Date(w.last_scanned_at).toLocaleDateString() : 'never',
          score: w.last_score || 0,
          trend: '',
          trendUp: true
        }));
        setSites(mappedSites);

        // Best performer
        if (mappedSites.length > 0) {
          const best = [...mappedSites].sort((a, b) => b.score - a.score)[0];
          setBestPerformer({ name: best.name, score: best.score });
        }

        // Fetch stats
        const userStats = await scannerService.getUserStats(user.id);
        setStats({
          totalScans: userStats.totalScans || 0,
          avgScore: userStats.avgScore || 0,
          criticalIssues: userStats.criticalIssues || 0
        });

        // Fetch recent scans for trend line
        const scansRes = await scannerService.getUserScans(user.id);
        if (scansRes.success && scansRes.data?.length > 0) {
          // Filter completed scans that have a score
          const completedScans = scansRes.data.filter(s => s.status === 'completed' && s.overall_score);
          const recentScans = completedScans
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .slice(-7);
            
          setTrendData(recentScans.map((s, i) => ({
            scan: `Scan ${i + 1}`,
            score: s.overall_score || 0
          })));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadData();

    // Check if user is newly registered and needs onboarding
    const checkOnboarding = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!data) {
        setShowOnboarding(true);
      }
    };
    
    checkOnboarding();
  }, [user]);

  const handleQuickScan = (e) => {
    e?.preventDefault();
    if (!quickScanUrl.trim()) return;
    setTargetScanUrl(quickScanUrl.trim());
    setTargetScanGithubRepo(quickScanGithubRepo.trim());
    setIsScanModalOpen(true);
  };

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!newSiteUrl.trim() || !user) return;
    
    const newSite = await websiteService.create(user.id, newSiteUrl, newSiteGithubRepo);
    if (newSite) {
      const newEntry = {
        id: newSite.id,
        name: newSite.name || newSite.domain,
        issues: '0 scans',
        lastScan: 'just now',
        score: 0,
        trend: '',
        trendUp: true
      };
      setSites([newEntry, ...sites]);
    }
    
    setNewSiteUrl('');
    setNewSiteGithubRepo('');
    setIsAddSiteModalOpen(false);
  };

  return (
    <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* TOP DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your sites</h1>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
              {sites.length} monitored {sites.length === 1 ? 'site' : 'sites'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              disabled
              title="Coming soon"
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0D1527] hover:bg-slate-50 dark:hover:bg-[#0D1527] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-400 dark:text-gray-600 flex items-center gap-2 transition-colors cursor-not-allowed opacity-70"
            >
              <Bell size={14} className="text-slate-400 dark:text-gray-600" /> No alerts yet
            </button>
          </div>
        </div>

        {/* 4 METRIC STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
            <div className="text-xs text-slate-600 dark:text-gray-400 font-medium">Average score</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.avgScore}</div>
            <div className="text-xs text-slate-500 dark:text-gray-500">across {sites.length} sites</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
            <div className="text-xs text-slate-600 dark:text-gray-400 font-medium">Critical issues</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.criticalIssues}</div>
            <div className="text-xs text-slate-500 dark:text-gray-500">needs attention</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
            <div className="text-xs text-slate-600 dark:text-gray-400 font-medium">Total scans</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.totalScans}</div>
            <div className="text-xs text-slate-500 dark:text-gray-500">completed</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-2">
            <div className="text-xs text-slate-600 dark:text-gray-400 font-medium">Best performer</div>
            <div className="text-3xl font-extrabold text-[#00F5A0] font-mono">{bestPerformer.score}</div>
            <div className="text-xs text-slate-600 dark:text-gray-400 truncate">{bestPerformer.name}</div>
          </div>

        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: Monitored Websites */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monitored websites</h2>
              
              <button
                onClick={() => setIsAddSiteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,245,160,0.2)]"
              >
                <Plus size={14} /> Add site
              </button>
            </div>

            {/* Site List Cards */}
            <div className="space-y-3">
              {sites.length === 0 ? (
                <div className="text-center p-6 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 text-sm">
                  No monitored websites yet. Add one to get started!
                </div>
              ) : (
                sites.map((site) => (
                  <div
                    key={site.id}
                    className="p-4 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-colors shrink-0">
                        <span className="text-sm font-bold text-[#00F5A0]">{site.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00F5A0] dark:group-hover:text-[#00F5A0] transition-colors">
                          {site.name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                          {site.issues} · {site.lastScan}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className={`text-xl font-extrabold font-mono ${
                          site.score >= 80 ? 'text-[#00F5A0]' : site.score >= 70 ? 'text-amber-600 dark:text-amber-400' : site.score > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                        }`}>
                          {site.score > 0 ? site.score : '-'}
                        </span>
                        {site.trend && (
                          <span className={`text-xs ${site.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} font-mono ml-1.5`}>
                            {site.trend}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setTargetScanUrl(site.url);
                          setTargetScanGithubRepo('');
                          setIsScanModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Scan <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CUSTOMER FEEDBACK & BUG REPORTS INBOX */}
            <div className="mt-8 p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00F5A0] flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Customer Feedback & Messages
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00F5A0] text-xs font-mono">
                        {contactMessages.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Messages submitted via the Contact form
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {contactMessages.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-center text-xs text-slate-500 dark:text-gray-400">
                    No submitted contact messages yet. Form inputs from your site's contact page will be logged here automatically!
                  </div>
                ) : (
                  contactMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-white/5 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{msg.name}</span>
                            <span className="text-[11px] text-slate-500 dark:text-gray-400">&lt;{msg.email}&gt;</span>
                          </div>
                          <div className="text-xs font-semibold text-emerald-600 dark:text-[#00F5A0] mt-0.5">
                            {msg.subject}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'Just now'}
                          </span>
                          <button
                            onClick={async () => {
                              await contactService.delete(msg.id);
                              setContactMessages(prev => prev.filter(m => m.id !== msg.id));
                            }}
                            title="Delete message"
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-black/20 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SCORE TREND & QUICK SCAN */}
          <div className="space-y-6">
            
            {/* SCORE TREND CARD */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Score trend</h3>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">Recent scans history</p>
              </div>

              {/* Chart */}
              <div className="h-44 w-full">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="scan" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#080C14', borderColor: '#00F5A0', borderRadius: '8px', fontSize: '12px' }} 
                        itemStyle={{ color: '#00F5A0' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#00F5A0" 
                        strokeWidth={3}
                        dot={{ fill: '#00F5A0', r: 4 }}
                        activeDot={{ r: 6, fill: '#ffffff', stroke: '#00F5A0' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No scan data available
                  </div>
                )}
              </div>
            </div>

            {/* QUICK SCAN WIDGET */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick scan</h3>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">Audit a one-off URL without adding it.</p>
              </div>

              <form onSubmit={handleQuickScan} className="space-y-3">
                <input
                  type="text"
                  value={quickScanUrl}
                  onChange={(e) => setQuickScanUrl(e.target.value)}
                  placeholder="https://your-site.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 font-mono focus:outline-none focus:border-[#00F5A0]/50"
                />
                <input
                  type="text"
                  value={quickScanGithubRepo}
                  onChange={(e) => setQuickScanGithubRepo(e.target.value)}
                  placeholder="https://github.com/user/repo (optional)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500 font-mono focus:outline-none focus:border-[#00F5A0]/50"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)] hover:shadow-[0_0_25px_rgba(0,245,160,0.5)] active:scale-95 cursor-pointer"
                >
                  Run audit
                </button>
              </form>
            </div>

          </div>

        </div>
      
      {/* Add Site Modal */}
      {isAddSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Website to Monitor</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400">SiteProof will automatically audit and track weekly quality metrics.</p>

            <form onSubmit={handleAddSite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Website Link</label>
                <input
                  type="text"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  placeholder="https://my-awesome-app.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00F5A0]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">GitHub Repository (Optional)</label>
                <input
                  type="text"
                  value={newSiteGithubRepo}
                  onChange={(e) => setNewSiteGithubRepo(e.target.value)}
                  placeholder="https://github.com/user/repository"
                  className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00F5A0]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSiteModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00F5A0] text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(0,245,160,0.3)]"
                >
                  Start Monitoring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        targetUrl={targetScanUrl}
        githubRepo={targetScanGithubRepo}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
