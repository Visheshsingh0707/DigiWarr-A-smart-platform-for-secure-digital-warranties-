'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Shield,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createWorker } from 'tesseract.js';
import { extractDocumentData, ExtractedData } from '@/lib/parser';
import { enhanceImageForOcr } from '@/lib/ocrUtils';

interface FileUploadProps {
  onUpload: (file: File, extractedData: ExtractedData & { title: string }) => Promise<void>;
  isUploading?: boolean;
}

export default function FileUpload({ onUpload, isUploading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    productName: '',
    provider: '',
    purchaseDate: '',
    expiryDate: '',
    renewalDate: '',
    amount: '',
    type: 'WARRANTY'
  });

  const [ocrStatus, setOcrStatus] = useState<{ status: string; progress: number } | null>(null);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const processOCR = async (file: File, previewUrl: string) => {
    try {
      setOcrStatus({ status: 'Enhancing image for OCR...', progress: 0 });
      const enhancedImageData = await enhanceImageForOcr(previewUrl);

      setOcrStatus({ status: 'Loading OCR engine...', progress: 5 });
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrStatus({ status: 'Extracting text...', progress: Math.max(10, Math.round(m.progress * 100)) });
          }
        }
      });
      
      const ret = await worker.recognize(enhancedImageData);
      const text = ret.data.text;
      await worker.terminate();

      const parsed = extractDocumentData(text);
      setExtractedData(parsed);
      
      if (!title) {
        setTitle(parsed.productName || file.name.replace(/\.[^/.]+$/, ''));
      }
      
      setOcrStatus(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze document text.');
      setOcrStatus(null);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadSuccess(false);
      setTitle('');

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const res = reader.result as string;
          setPreview(res);
          await processOCR(file, res);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        // PDF support for tesseract natively is tricky without converting to canvas.
        setOcrStatus(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejections) => {
      if (rejections[0]?.errors[0]?.code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 10MB.');
      } else {
        toast.error('Invalid file type. Please upload an image or PDF.');
      }
    },
  });

  const handleSubmit = async () => {
    if (!selectedFile) return;
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    try {
      setError('');
      await onUpload(selectedFile, { ...extractedData, title: title.trim() });
      setUploadSuccess(true);
      setTimeout(() => {
        removeFile();
        setUploadSuccess(false);
      }, 2000);
    } catch (err) {
      // Error handled by parent
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    setTitle('');
    setExtractedData({
      productName: '',
      provider: '',
      purchaseDate: '',
      expiryDate: '',
      renewalDate: '',
      amount: '',
      type: 'WARRANTY'
    });
    setOcrStatus(null);
  };

  const handleFieldChange = (field: keyof ExtractedData, value: string) => {
    setExtractedData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          isDragActive
            ? 'border-brand-400 bg-brand-500/10 scale-[1.02]'
            : 'border-[var(--border)] hover:border-brand-400/50 hover:bg-[var(--bg-tertiary)]'
        }`}
      >
        <input {...getInputProps()} id="file-dropzone" />

        <motion.div
          animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
            isDragActive
              ? 'bg-brand-500/20 text-brand-400'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
          }`}>
            <Upload className="h-8 w-8" />
          </div>

          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your document'}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Supports JPG, PNG, WEBP, and PDF up to 10MB
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2 text-xs font-medium text-brand-400">
              <RefreshCw className="h-3.5 w-3.5" />
              Smart OCR Extraction (Images only)
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-500">
              <Shield className="h-3.5 w-3.5" />
              Files are encrypted with AES-256 before storage
            </div>
          </div>
        </motion.div>
      </div>

      {/* File Preview & Editor */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {ocrStatus ? 'Analyzing Document...' : 'Verify Details'}
              </h3>
              <button
                onClick={removeFile}
                disabled={isUploading || !!ocrStatus}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* File Info */}
            <div className="flex gap-5">
              {preview ? (
                <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)] relative group">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  {ocrStatus && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2">
                      <Loader2 className="h-8 w-8 text-brand-400 animate-spin mb-2" />
                      <span className="text-[10px] text-white font-medium text-center">{ocrStatus.status}</span>
                      <span className="text-[10px] text-brand-300 font-bold">{ocrStatus.progress}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="h-12 w-12 text-red-400" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-blue-400" />
                  )}
                </div>
              )}
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                </p>
                {ocrStatus ? (
                  <div className="bg-brand-500/10 border border-brand-500/20 p-3 rounded-lg text-xs text-brand-400">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-2" />
                    Our system is extracting dates and details from your document. Please wait...
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-500">
                    <CheckCircle2 className="inline h-3 w-3 mr-2" />
                    Extraction complete. Please review and correct any inaccurate fields below before saving.
                  </div>
                )}
              </div>
            </div>

            {/* Editable Form */}
            <div className={`grid gap-4 sm:grid-cols-2 transition-opacity duration-300 ${ocrStatus ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Document Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g., iPhone 15 Warranty"
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Document Type</label>
                <select
                  value={extractedData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="input-field"
                >
                  <option value="WARRANTY">Warranty</option>
                  <option value="INVOICE">Invoice / Bill</option>
                  <option value="POLICY">Insurance Policy</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Product Name / Model</label>
                <input
                  type="text"
                  value={extractedData.productName}
                  onChange={(e) => handleFieldChange('productName', e.target.value)}
                  className="input-field"
                  placeholder="Found automatically..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Provider / Brand</label>
                <input
                  type="text"
                  value={extractedData.provider}
                  onChange={(e) => handleFieldChange('provider', e.target.value)}
                  className="input-field"
                  placeholder="Found automatically..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Purchase Date</label>
                <input
                  type="date"
                  value={extractedData.purchaseDate}
                  onChange={(e) => handleFieldChange('purchaseDate', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Expiry Date</label>
                <input
                  type="date"
                  value={extractedData.expiryDate}
                  onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Amount (Optional)</label>
                <input
                  type="text"
                  value={extractedData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  className="input-field"
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isUploading || uploadSuccess || !!ocrStatus}
              className={`btn-primary w-full ${uploadSuccess ? '!bg-gradient-to-r !from-emerald-600 !to-emerald-500' : ''}`}
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Encrypting & Uploading...</>
              ) : uploadSuccess ? (
                <><CheckCircle2 className="h-4 w-4" /> Uploaded Successfully!</>
              ) : ocrStatus ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Document...</>
              ) : (
                <><Upload className="h-4 w-4" /> Save & Encrypt Document</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
