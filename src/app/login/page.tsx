'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Mail, Key, User, ArrowRight, Loader2, AlertCircle, Store, UserCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'SHOPKEEPER' | 'CUSTOMER'>('CUSTOMER');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
        } else {
          // Fetch session to determine role-based redirect
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();
          if (session?.user?.role === 'SHOPKEEPER') {
            router.push('/dashboard/shopkeeper');
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to register');
        }

        toast.success(data.message || 'Account created successfully.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-10 glass-card p-2">
        {/* Left Side - Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">
                DigiWarr
              </h1>
            </div>

            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Create Vault'}
            </h2>
            <p className="text-[var(--text-muted)] mb-8">
              {isLogin 
                ? 'Enter your credentials to access your secure locker.' 
                : 'Sign up to start securing your warranties and policies with AES-256 encryption.'}
            </p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="space-y-5"
                  >
                    {/* Role Selector */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2.5 ml-1">I am a</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole('CUSTOMER')}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                            role === 'CUSTOMER'
                              ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                              : 'border-[var(--border)] hover:border-brand-400/50 bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            role === 'CUSTOMER' ? 'bg-brand-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          }`}>
                            <UserCircle className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Customer</p>
                            <p className="text-xs text-[var(--text-muted)]">Track my documents</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('SHOPKEEPER')}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                            role === 'SHOPKEEPER'
                              ? 'border-accent-500 bg-accent-500/10 shadow-lg shadow-accent-500/10'
                              : 'border-[var(--border)] hover:border-accent-400/50 bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            role === 'SHOPKEEPER' ? 'bg-accent-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          }`}>
                            <Store className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Shopkeeper</p>
                            <p className="text-xs text-[var(--text-muted)]">Manage customers</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
                        {role === 'SHOPKEEPER' ? 'Business / Your Name' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input-field pl-11"
                          placeholder={role === 'SHOPKEEPER' ? 'ABC Electronics' : 'John Doe'}
                          required={!isLogin}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    disabled={loading}
                    id="login-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">Master Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Key className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 pr-11"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={loading}
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    disabled={loading}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-[var(--text-muted)] mt-2 ml-1">Must be at least 8 characters long.</p>
                )}
                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <Link href="/forgot-password" className="text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full mt-8 group"
                disabled={loading}
                id="login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Access Vault' : `Create ${role === 'SHOPKEEPER' ? 'Business' : 'Secure'} Account`}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="font-semibold text-brand-500 hover:text-brand-400 transition-colors"
                  disabled={loading}
                >
                  {isLogin ? 'Create one now' : 'Sign in instead'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Features / Illustration */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-900 to-indigo-950 rounded-2xl p-12 text-white relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-6">Zero-Trust Architecture</h3>
            
            <div className="space-y-6">
              {[
                { icon: Shield, title: 'End-to-End Encryption', desc: 'Your files are encrypted with AES-256 before being stored. Only you hold the key.' },
                { icon: Lock, title: 'Absolute Privacy', desc: 'We cannot read your documents, warranties, or policies. Your data is strictly yours.' },
                { icon: Store, title: 'Shopkeeper Ecosystem', desc: 'Shopkeepers manage warranties for customers. Customers track everything in one place.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm shadow-inner shadow-white/20">
                    <feature.icon className="h-5 w-5 text-brand-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-50">{feature.title}</h4>
                    <p className="text-sm text-brand-200/80 leading-relaxed mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10 mt-12">
            <div className="flex -space-x-3 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-indigo-950 bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center font-bold text-xs shadow-md">
                  US
                </div>
              ))}
              <div className="h-10 w-10 rounded-full border-2 border-indigo-950 bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-semibold shadow-md">
                +1k
              </div>
            </div>
            <p className="text-sm text-brand-200">
              Join thousands securing their digital assets with DigiWarr Vault.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
