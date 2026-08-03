import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

const fullText = `Act as a Senior Fullstack Engineer. Refactor my Next.js App Router layout to include the following fixes:

1. Add missing HTTP Security Headers:
   - Content-Security-Policy (CSP)
   - Strict-Transport-Security (HSTS)
   - X-Content-Type-Options: nosniff

2. Compress hero images to WebP format,
   target < 100KB per asset.

3. Add WCAG aria-labels to all
   interactive buttons and form inputs.

4. Fix mobile viewport overflow on
   screens below 375px width.`;

export default function TerminalTypingCard() {
  const [displayedText, setDisplayedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <motion.div
      className="p-5 rounded-2xl bg-[#04060C] border border-[#00F5A0]/40 font-mono text-xs text-gray-300 space-y-3 shadow-[0_0_30px_rgba(0,245,160,0.15)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onViewportEnter={() => setIsVisible(true)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 text-[#00F5A0] font-bold">
          <Terminal size={14} />
          <span>SiteProof AI Generated Prompt</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-[#00F5A0]' : 'bg-[#00F5A0] animate-pulse'}`} />
          <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">
            {isDone ? '✓ Complete' : 'Generating...'}
          </span>
        </div>
      </div>

      {/* Typing content */}
      <div className="min-h-[180px] text-gray-400 text-[11px] leading-relaxed whitespace-pre-wrap">
        {displayedText}
        {!isDone && (
          <span className="inline-block w-[6px] h-[14px] bg-[#00F5A0] ml-[1px] animate-pulse" />
        )}
      </div>

      {/* Footer */}
      <div className="pt-1 flex items-center justify-between text-[11px] border-t border-white/10 pt-2.5">
        <span className="text-[#00F5A0]">✓ Tested for Cursor, Bolt & ChatGPT</span>
        <button className="font-bold text-[#00F5A0] hover:text-white transition-colors cursor-pointer flex items-center gap-1">
          1-Click Copy Prompt →
        </button>
      </div>
    </motion.div>
  );
}
