import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Calendar, Package, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EditWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  warranty: any;
}

export default function EditWarrantyModal({ isOpen, onClose, onUpdate, warranty }: EditWarrantyModalProps) {
  const [productName, setProductName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (warranty) {
      setProductName(warranty.productName || '');
      // Format dates to YYYY-MM-DD for input[type="date"]
      if (warranty.purchaseDate) {
        setPurchaseDate(new Date(warranty.purchaseDate).toISOString().split('T')[0]);
      }
      if (warranty.expiryDate) {
        setExpiryDate(new Date(warranty.expiryDate).toISOString().split('T')[0]);
      }
      setReason('');
      setError('');
    }
  }, [warranty, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !purchaseDate || !expiryDate || !reason.trim()) {
      setError('Please fill in all fields and provide a reason for the edit.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onUpdate(warranty.id, {
        productName: productName.trim(),
        purchaseDate,
        expiryDate,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update warranty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card w-full max-w-lg p-8 relative overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                id="close-edit-modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/25">
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Warranty</h2>
                  <p className="text-sm text-[var(--text-muted)]">Securely update warranty details (Audited)</p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex gap-3"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Product Name</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="input-field pl-10"
                        placeholder="e.g., iPhone 15 Pro"
                        required
                        disabled={loading}
                        id="edit-product-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Purchase Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="input-field pl-10"
                        required
                        disabled={loading}
                        id="edit-purchase-date"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="input-field pl-10"
                        required
                        disabled={loading}
                        id="edit-expiry-date"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Reason for Edit (Mandatory)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="input-field pl-10 pt-2 min-h-[100px] resize-none"
                      placeholder="e.g., Corrected typo in product name / Updated expiry date based on physical invoice"
                      required
                      disabled={loading}
                      id="edit-reason"
                    />
                  </div>
                  <p className="text-xs text-amber-500 mt-2 font-medium">
                    ⚠️ This edit will be permanently recorded in the audit trail.
                  </p>
                </div>

                <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={loading} id="submit-edit-btn">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
