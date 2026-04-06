'use client';

import { useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export default function StatsCard({ title, value, subtitle, icon: Icon, gradient, delay = 0 }: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay: delay, ease: 'power2.out' }
      );
    }
  }, { scope: cardRef });

  useGSAP(() => {
    if (numberRef.current && typeof value === 'number') {
      const el = numberRef.current;
      gsap.fromTo(el, 
        { innerHTML: 0 }, 
        {
          innerHTML: value,
          duration: 1.5,
          delay: delay + 0.2, // start counting after pop in
          snap: { innerHTML: 1 },
          ease: "power2.out",
          onUpdate() {
            el.innerHTML = Math.round(Number(el.innerHTML)).toString();
          }
        }
      );
    }
  }, [value, delay]);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -4, duration: 0.2 });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.2 });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="glass-card p-6 relative overflow-hidden group opacity-0"
    >
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {title}
          </p>
          <p ref={numberRef} className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {typeof value === 'number' ? 0 : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
