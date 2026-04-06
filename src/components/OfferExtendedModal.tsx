import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OfferExtendedModal({ isOpen, onClose, documentId, onOffer }: { isOpen: boolean, onClose: () => void, documentId: string, onOffer: (docId: string, price: number, duration: number) => Promise<void> }) {
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !duration) return;
    setSubmitting(true);
    try {
      await onOffer(documentId, Number(price), Number(duration));
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to offer extended warranty');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Offer Extended Warranty</h2>
              <p className="text-sm text-[var(--text-muted)]">Set price and duration to extend coverage.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="1" className="input-field" placeholder="e.g. 999" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Duration (Days)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required min="1" className="input-field" placeholder="e.g. 365" />
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500 hover:shadow-emerald-500/20">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                {submitting ? 'Offering...' : 'Offer Warranty'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
