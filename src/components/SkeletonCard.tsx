'use client';

export function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-1 bg-[var(--bg-tertiary)]" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)]" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-lg bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-20 rounded-lg bg-[var(--bg-tertiary)]" />
            </div>
          </div>
          <div className="h-6 w-16 rounded-full bg-[var(--bg-tertiary)]" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3 w-40 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-36 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-44 rounded bg-[var(--bg-tertiary)]" />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
          <div className="h-3 w-16 rounded bg-[var(--bg-tertiary)]" />
          <div className="flex gap-1">
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)]" />
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="glass-card p-6 relative overflow-hidden animate-pulse">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--bg-tertiary)] opacity-30 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-8 w-12 rounded-lg bg-[var(--bg-tertiary)]" />
        </div>
        <div className="h-12 w-12 rounded-2xl bg-[var(--bg-tertiary)]" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-[var(--bg-tertiary)]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-[var(--bg-tertiary)]" />
        <div className="h-3 w-32 rounded bg-[var(--bg-tertiary)]" />
      </div>
      <div className="h-6 w-20 rounded-full bg-[var(--bg-tertiary)]" />
    </div>
  );
}
