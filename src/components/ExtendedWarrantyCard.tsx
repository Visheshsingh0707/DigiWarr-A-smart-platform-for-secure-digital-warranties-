import React, { useState } from 'react';
import { CreditCard, Loader2, Crown } from 'lucide-react';

interface Props {
  document: any;
  onPurchase: (id: string) => Promise<void>;
}

export default function ExtendedWarrantyCard({ document: doc, onPurchase }: Props) {
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    await onPurchase(doc.id);
    setPurchasing(false);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-emerald-500/10 hover:shadow-lg">
      <div className="absolute -right-6 -top-6 text-emerald-500/10 w-24 h-24 rotate-12">
        <Crown className="w-full h-full" />
      </div>
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-500 text-sm">Extended Warranty Offer</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium max-w-[150px] truncate" title={doc.productName || doc.title}>For {doc.productName || doc.title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[var(--text-primary)]">₹{doc.extendedPrice}</p>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">For {doc.extensionDurationDays} Days</p>
        </div>
      </div>
      <div className="relative z-10 mt-4 flex gap-3 items-center">
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {purchasing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <><CreditCard className="h-4 w-4" /> Pay & Extend Now</>
          )}
        </button>
      </div>
    </div>
  );
}
