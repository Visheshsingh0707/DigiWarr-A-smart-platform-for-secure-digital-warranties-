'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Check your email for a password reset link.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="w-full max-w-md mx-auto z-10 glass-card p-8 lg:p-12 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center w-full"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/30 mb-8">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
          
          <div className="mt-2 mb-8 w-full">
            <AnimatePresence mode="popLayout">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-6 text-center"
                >
                  <p className="text-[var(--text-primary)] font-medium mb-2">Email Sent!</p>
                  <p className="text-[var(--text-muted)] text-sm">{message}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <p className="text-[var(--text-muted)] text-center text-sm mb-6">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5 w-full">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field pl-11"
                          placeholder="you@example.com"
                          required
                          disabled={status === 'loading'}
                        />
                      </div>
                      {status === 'error' && (
                        <p className="text-red-500 text-sm mt-3 ml-1">{message}</p>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary w-full group mt-6"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mx-auto inline" />
                          <span className="ml-2">Sending...</span>
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="h-4 w-4 ml-1 inline group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/login" className="flex items-center text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
