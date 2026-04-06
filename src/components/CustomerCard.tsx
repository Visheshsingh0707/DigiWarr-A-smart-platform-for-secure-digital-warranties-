'use client';

import { useRef } from 'react';
import { Mail, FileText, Calendar } from 'lucide-react';
import gsap from 'gsap';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    documents?: {
      id: string;
      title: string;
      type: string;
      expiryDate: string | null;
      productName: string | null;
    }[];
  };
  onClick?: () => void;
}

export default function CustomerCard({ customer, onClick }: CustomerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const warrantyCount = customer.documents?.length || 0;
  const expiringSoon = customer.documents?.filter((d) => {
    if (!d.expiryDate) return false;
    const daysLeft = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return daysLeft > 0 && daysLeft <= 30;
  }).length || 0;

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -4, duration: 0.2, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.2, ease: 'power2.out' });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-400 text-white font-bold text-lg shrink-0">
          {customer.name?.[0]?.toUpperCase() || customer.email[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">
            {customer.name || 'Unnamed Customer'}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{customer.email}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <FileText className="h-3.5 w-3.5 text-brand-500" />
          <span>{warrantyCount} warranties</span>
        </div>
        {expiringSoon > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{expiringSoon} expiring</span>
          </div>
        )}
        <div className="ml-auto text-xs text-[var(--text-muted)]">
          Added {new Date(customer.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
