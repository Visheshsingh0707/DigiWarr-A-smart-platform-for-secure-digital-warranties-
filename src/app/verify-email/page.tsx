'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('An unexpected error occurred.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md mx-auto z-10 glass-card p-8 lg:p-12 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center w-full"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/30 mb-8">
          <Lock className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Email Verification</h2>
        
        <div className="mt-6 mb-8 w-full flex flex-col items-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center text-brand-400">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-[var(--text-secondary)]">{message}</p>
            </div>
          )}
          {status === 'success' && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center text-green-500">
              <CheckCircle className="h-16 w-16 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              <p className="text-[var(--text-primary)] font-medium text-lg">{message}</p>
              <p className="text-[var(--text-muted)] text-sm mt-2">You can now access your vault.</p>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center text-red-500">
              <XCircle className="h-16 w-16 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
              <p className="text-[var(--text-primary)] font-medium text-lg">{message}</p>
              <p className="text-[var(--text-muted)] text-sm mt-2">The link may be invalid or has expired.</p>
            </motion.div>
          )}
        </div>

        <Link href="/login" className="btn-primary w-full group flex justify-center mt-2">
          {status === 'success' ? 'Go to Login' : 'Back to Login'}
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <Suspense fallback={<div className="glass-card p-12"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
