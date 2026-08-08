import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Bug, Lightbulb, AlertCircle, ShieldCheck } from 'lucide-react';
import { contactService } from '../../services/database.service';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedTicket, setSavedTicket] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Report a Bug / Website Issue',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await contactService.save(formData);
      setSavedTicket(result.data);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (formData.subject) {
      case 'Report a Bug / Website Issue':
        return 'Please describe the bug or problem you encountered on the website (e.g., page where it happened, error message, or steps to reproduce)...';
      case 'Feature Request & Improvement':
        return 'Tell us about the new feature, audit check, or improvement you would like us to add...';
      case 'Audit Report Support':
        return 'Describe your question regarding scan scores, recommendations, or false positives...';
      default:
        return 'Share your thoughts, questions, or feedback with us...';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-gray-100 transition-colors duration-300 font-sans flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 space-y-10">
        
        {/* Banner / Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00F5A0] text-xs font-semibold">
            <Bug size={14} /> Help Us Improve • Bug Reports & Feedback Welcome
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Get in touch with <span className="text-gradient">SiteProof</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 leading-relaxed">
            Spotted a bug, glitch, or broken link on our website? Or have ideas to make SiteProof better? 
            <br className="hidden sm:inline" />
            Let us know! Your bug reports and feedback directly help us fix issues and build a better experience for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Contact Details Column */}
          <div className="space-y-4">
            
            {/* Bug & Problem Reporting Card */}
            <div className="p-6 rounded-2xl bg-emerald-500/5 dark:bg-[#0D1527] border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#00F5A0] flex items-center justify-center">
                <Bug size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Found a Bug or Issue?</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                If something isn't working right or you see an error on the site, tell us right away. We prioritize fixing bugs reported by our users!
              </p>
              <div className="pt-1 text-[11px] font-semibold text-[#00F5A0] flex items-center gap-1.5">
                <AlertCircle size={13} /> Average resolution time: &lt; 24 hours
              </div>
            </div>

            {/* Email Support Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Direct Email Support</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400">support@siteproof.io</p>
              <p className="text-[11px] text-slate-500 dark:text-gray-500">For security & general concerns</p>
            </div>

            {/* Feature Suggestions Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                <Lightbulb size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Suggestions & Ideas</h3>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Want a new scanner module or feature? Share your suggestions with our dev team.
              </p>
            </div>

          </div>

          {/* Contact Form Column */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/5 shadow-2xl">
            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 className="w-14 h-14 text-[#00F5A0] mx-auto animate-bounce" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Thank You for Your Feedback!</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  Your message has been securely logged. If you reported a website bug or technical issue, our development team will inspect and fix it promptly.
                </p>
                {savedTicket && (
                  <div className="inline-flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-[#00F5A0]">
                    <div className="flex items-center gap-1 font-semibold">
                      <ShieldCheck size={14} /> Ticket Logged Successfully
                    </div>
                    <div>Ref ID: {savedTicket.id?.slice(0, 13) || 'LOC-SAVED'}</div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400">Stored & saved in database/inbox</div>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setSavedTicket(null);
                      setFormData({ name: '', email: '', subject: 'Report a Bug / Website Issue', message: '' });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Submit another report or question
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Us a Message</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    Select a topic below to let us know how we can help or what needs fixing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Alex Mercer"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Useful & Relevant Subject Options */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center justify-between">
                    <span>What is this regarding? (Subject)</span>
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-[#00F5A0]">Select topic</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/30 transition-colors cursor-pointer"
                  >
                    <option value="Report a Bug / Website Issue">🐛 Report a Bug / Website Issue (Glitch, error, broken link)</option>
                    <option value="Feature Request & Improvement">💡 Feature Request & Improvement (Suggest an enhancement)</option>
                    <option value="Audit Report Support">📊 Audit Report Support (Help understanding scan results)</option>
                    <option value="General Inquiry & Feedback">💬 General Inquiry & Feedback</option>
                    <option value="Enterprise & Business Plan">💼 Enterprise & Business Inquiry</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Message / Details</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={getPlaceholder()}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#080C14] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/30 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? 'Saving Message...' : 'Send Message / Report'} <Send size={16} />
                </button>
              </form>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

