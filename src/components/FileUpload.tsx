'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  onUpload: (file: File, title: string, type: string) => Promise<void>;
  isUploading?: boolean;
}

export default function FileUpload({ onUpload, isUploading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('WARRANTY');
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadSuccess(false);

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      // Auto-set title from filename
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
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
      await onUpload(selectedFile, title.trim(), docType);
      setUploadSuccess(true);
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setTitle('');
        setDocType('WARRANTY');
        setUploadSuccess(false);
      }, 2000);
    } catch (err) {
      // Error is now handled by parent with toast
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
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

          <div className="flex items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2 text-xs font-medium text-brand-400">
            <Shield className="h-3.5 w-3.5" />
            Files are encrypted with AES-256 before storage
          </div>
        </motion.div>
      </div>

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 space-y-5"
          >
            {/* Preview header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Document Details
              </h3>
              <button
                onClick={removeFile}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* File info + preview */}
            <div className="flex gap-5">
              {preview ? (
                <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)]">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="h-12 w-12 text-red-400" />
                  ) : (
                    <Image className="h-12 w-12 text-blue-400" />
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
              </div>
            </div>

            {/* Form fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g., iPhone 15 Warranty"
                  id="doc-title"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="input-field"
                  id="doc-type"
                >
                  <option value="WARRANTY">Warranty</option>
                  <option value="INVOICE">Invoice / Bill</option>
                  <option value="POLICY">Insurance Policy</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Upload button */}
            <button
              onClick={handleSubmit}
              disabled={isUploading || uploadSuccess}
              className={`btn-primary w-full ${uploadSuccess ? '!bg-gradient-to-r !from-emerald-600 !to-emerald-500' : ''}`}
              id="upload-submit"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Encrypting & Uploading...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Uploaded Successfully!
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Encrypt & Upload Document
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
