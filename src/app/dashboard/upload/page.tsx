'use client';

import { motion } from 'framer-motion';
import { Shield, Upload as UploadIcon, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (file: File, title: string, type: string) => {
    setIsUploading(true);
    const toastId = toast.loading('Encrypting and uploading securely...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      
      toast.success('Document encrypted and saved!', { id: toastId });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to upload document', { id: toastId });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Secure Upload.</h1>
        <p className="text-[var(--text-secondary)]">
          Your documents are encrypted using AES-256 before being stored. 
          Smart OCR extracts dates locally without sending your data to external APIs.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Upload Form */}
        <div className="glass-card p-6 md:p-8">
          <FileUpload onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Security Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="glass-card p-6 border-brand-500/20 bg-brand-500/5">
            <h3 className="font-semibold flex items-center gap-2 text-brand-500 mb-4">
              <Shield className="h-5 w-5" />
              Zero-Trust Security
            </h3>
            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Files are encrypted using your unique master key derivate.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>We cannot read your documents even if the server is compromised.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>OCR text extraction runs completely locally on our servers.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
