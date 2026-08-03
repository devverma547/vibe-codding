import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      priceMonthly: '$0',
      description: 'Ideal for indie hackers, founders, and single website launches.',
      badge: 'Free Forever',
      popular: false,
      features: [
        '1 Monitored Website Slot',
        '5 Analysis Modules',
        'Prioritized AI Action Plan & Fix Guides',
        'Unlimited One-Off Quick Scans',
        'Weekly Automated Health Re-scans',
        'Security, SEO, Speed & WCAG Analysis'
      ],
      buttonText: 'Start Free Forever',
      buttonVariant: 'secondary'
    },
    {
      name: 'Pro',
      priceMonthly: '$19',
      originalPrice: '$29',
      description: 'Built for agencies, active SaaS teams, and growing web apps.',
      badge: 'Most Popular',
      popular: true,
      features: [
        '10 Monitored Website Slots',
        '13 Analysis Modules',
        'Continuous Real-Time Re-scanning',
        'White-Label PDF & Print Reports',
        'Instant Slack & Email Security Alerts',
        'Historical Score Trend Analytics',
        'Copy-Paste AI Code Fix Assistant',
        'Priority Engine Queueing'
      ],
      buttonText: 'Get started',
      buttonVariant: 'primary'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-gray-100 transition-colors duration-300 font-sans flex flex-col">
      <main className="flex-1 pt-28 pb-24">
        
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-xs font-semibold text-[#00F5A0]">
            <Zap size={14} /> Simple & Transparent Pricing
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simple plans for every builder
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Audit your sites in seconds. Upgrade whenever you need more monitored slots, white-label PDF reports, or API integrations.
          </p>
        </section>

        {/* PRICING CARDS GRID */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl bg-white dark:bg-[#0D1527] border transition-all flex flex-col justify-between relative ${
                  plan.popular 
                    ? 'border-[#00F5A0] shadow-[0_0_40px_rgba(0,245,160,0.15)] md:scale-105 z-10' 
                    : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#00F5A0] text-slate-950 text-[11px] font-extrabold tracking-wider uppercase shadow-[0_0_15px_rgba(0,245,160,0.5)]">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div>
                    <div className="flex items-end gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-slate-900 dark:text-white font-mono">
                          {plan.priceMonthly}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">/ month</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="text-xl font-bold text-red-400/60 line-through mb-1.5 font-mono">
                          {plan.originalPrice}
                        </div>
                      )}
                    </div>
                    {plan.originalPrice && (
                      <div className="inline-flex mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-[#00F5A0] border border-emerald-500/30">
                        Launch Discount Applied
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/signup')}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 shadow-[0_0_20px_rgba(0,245,160,0.3)]'
                        : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {plan.buttonText} <ArrowRight size={14} />
                  </button>

                  <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-white/5 text-xs">
                    <div className="font-semibold text-slate-700 dark:text-gray-300">Included features:</div>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-slate-600 dark:text-gray-300">
                        <Check size={14} className="text-[#00F5A0] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

