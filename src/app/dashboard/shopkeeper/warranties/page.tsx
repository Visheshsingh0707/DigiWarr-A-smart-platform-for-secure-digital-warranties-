'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, Calendar, User as UserIcon, Upload, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createWorker } from 'tesseract.js';
import { extractDocumentData } from '@/lib/parser';
import { enhanceImageForOcr } from '@/lib/ocrUtils';

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

  const [ocrStatus, setOcrStatus] = useState<{ status: string; progress: number } | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setOcrStatus({ status: 'Enhancing image for OCR...', progress: 0 });
          const enhancedImageData = await enhanceImageForOcr(reader.result as string);

          setOcrStatus({ status: 'Loading OCR engine...', progress: 5 });
          const worker = await createWorker('eng', 1, {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrStatus({ status: 'Extracting details...', progress: Math.max(10, Math.round(m.progress * 100)) });
              }
            }
          });
          
          const ret = await worker.recognize(enhancedImageData);
          await worker.terminate();

          const parsed = extractDocumentData(ret.data.text);
          if (parsed.productName && !productName) setProductName(parsed.productName);
          if (parsed.purchaseDate && !purchaseDate) setPurchaseDate(parsed.purchaseDate);
          if (parsed.expiryDate && !expiryDate) setExpiryDate(parsed.expiryDate);
          
          toast.success('Document analyzed! Check and verify extracted fields.');
        } catch (err) {
          console.error(err);
          toast.error('Failed to analyze document text.');
        } finally {
          setOcrStatus(null);
        }
      };
      reader.readAsDataURL(selectedFile);
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
          Add a warranty record for one of your customers. Upload an image to auto-fill details from OCR.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 relative"
      >
        <AnimatePresence>
          {ocrStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 p-4 bg-brand-500/10 border-b border-brand-500/20 backdrop-blur-md rounded-t-2xl z-10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-brand-500">{ocrStatus.status}</p>
                  <p className="text-xs text-brand-600/80">Auto-filling form fields (Progress: {ocrStatus.progress}%)</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className={`space-y-6 ${ocrStatus ? 'opacity-50 pointer-events-none mt-12' : ''} transition-all duration-300`}>
          
          {/* Optional File (Moved up for OCR flow) */}
          <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border)]">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Warranty Document / Image
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Upload an image first, and our smart OCR will automatically fill the fields below!
            </p>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20"
              id="warranty-file"
            />
          </div>

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

          <button type="submit" className="btn-primary w-full" disabled={submitting || !!ocrStatus} id="warranty-submit">
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
