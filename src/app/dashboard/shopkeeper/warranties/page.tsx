'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Calendar, User as UserIcon, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CreateWarrantyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [productName, setProductName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/shopkeeper/customers');
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !productName || !purchaseDate || !expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Creating warranty...');

    try {
      const formData = new FormData();
      formData.append('customerId', customerId);
      formData.append('productName', productName);
      formData.append('purchaseDate', purchaseDate);
      formData.append('expiryDate', expiryDate);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/shopkeeper/warranties', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create warranty');
      }

      toast.success('Warranty created successfully!', { id: toastId });
      router.push('/dashboard/shopkeeper');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create warranty', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard/shopkeeper" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Create Warranty</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Add a warranty record for one of your customers. They'll be notified before it expires.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <UserIcon className="inline h-4 w-4 mr-1" />
              Select Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="input-field"
              required
              id="warranty-customer"
            >
              <option value="">Choose a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} ({c.email})
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="text-xs text-amber-500 mt-1.5">
                No customers found. <Link href="/dashboard/shopkeeper" className="underline">Add a customer first</Link>.
              </p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <Package className="inline h-4 w-4 mr-1" />
              Product Name *
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="input-field"
              placeholder="e.g., Samsung Galaxy S24"
              required
              id="warranty-product"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                <Calendar className="inline h-4 w-4 mr-1" />
                Purchase Date *
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="input-field"
                required
                id="warranty-purchase-date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                <Calendar className="inline h-4 w-4 mr-1" />
                Expiry Date *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="input-field"
                required
                id="warranty-expiry-date"
              />
            </div>
          </div>

          {/* Optional File */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <Upload className="inline h-4 w-4 mr-1" />
              Warranty Document (optional)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20"
              id="warranty-file"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Upload warranty card or receipt. Will be encrypted with customer's key.
            </p>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting} id="warranty-submit">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Warranty...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Warranty
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
