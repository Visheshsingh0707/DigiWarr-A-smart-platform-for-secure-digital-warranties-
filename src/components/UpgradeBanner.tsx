'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
  currentCount: number;
  limit: number;
}

export default function UpgradeBanner({ currentCount, limit }: UpgradeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 p-6"
    >
      {/* Decorative sparkle */}
      <div className="absolute top-3 right-3">
        <Sparkles className="h-6 w-6 text-amber-500/40 animate-pulse" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 shrink-0">
          <Crown className="h-7 w-7 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Free Tier Limit Reached
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            You've added <span className="font-bold text-amber-500">{currentCount}/{limit}</span> customers.
            Upgrade to DigiWarr Pro for unlimited customers, priority support, and advanced analytics.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 whitespace-nowrap group">
          Upgrade to Pro
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
