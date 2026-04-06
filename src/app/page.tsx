'use client';

import Link from 'next/link';
import { Shield, Lock, FileText, ArrowRight, CheckCircle2, Zap, Bell, Eye, ExternalLink, Globe, Mail, Store, Users, Sparkles, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRef, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function Home() {
  const { data: session, status } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (status === 'loading') return;

    // 1. Techy Text Reveal (Scrubbing opacity based on scroll)
    const textReveals = gsap.utils.toArray('.gsap-text-scrub') as HTMLElement[];
    textReveals.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0.1 },
        { 
          opacity: 1, 
          ease: 'none', 
          scrollTrigger: { 
            trigger: el, 
            start: 'top 85%', 
            end: 'top 40%', 
            scrub: true 
          } 
        }
      );
    });

    // 2. Feature Grid Stagger
    gsap.fromTo('.gsap-feature-card',
      { opacity: 0, scale: 0.9, y: 30 },
      { 
        opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)',
        scrollTrigger: { 
          trigger: '#features', 
          start: 'top 75%',
          toggleActions: 'play reverse play reverse'
        }
      }
    );

    // 3. Sticky Stacked Cards for How It Works
    const steps = gsap.utils.toArray('.gsap-step-card') as HTMLElement[];
    steps.forEach((step, i) => {
      if (i === steps.length - 1) return; // Don't animate the last card out
      gsap.to(step, {
        scale: 0.92,
        opacity: 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: step,
          start: `top ${120 + i * 20}`, // Triggers when the card hits its sticky position
          endTrigger: steps[i + 1],
          end: `top ${120 + (i + 1) * 20 + 80}`, // Ends as the next card begins layering over
          scrub: true,
        }
      });
    });

    // 4. Pricing Cards Hover/Enter
    gsap.fromTo('.gsap-price-card',
      { opacity: 0, y: 40 },
      { 
        opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', 
        scrollTrigger: { 
          trigger: '#pricing', 
          start: 'top 75%',
          toggleActions: 'play reverse play reverse'
        } 
      }
    );

    // 5. Generic Fade Reveals for basic elements
    const fadeElements = gsap.utils.toArray('.gsap-fade-in') as HTMLElement[];
    fadeElements.forEach((el) => {
      gsap.fromTo(el, 
        { opacity: 0, y: 30 }, 
        { 
          opacity: 1, y: 0, duration: 1, ease: 'power3.out', 
          scrollTrigger: { 
            trigger: el, 
            start: 'top 85%',
            toggleActions: 'play reverse play reverse'
          } 
        }
      );
    });

  }, { scope: containerRef, dependencies: [status] });

  // Magnetic button logic
  useEffect(() => {
    if (status === 'loading') return;
    const magnets = document.querySelectorAll('.gsap-magnetic');
    
    // Check if we already initialized to prevent duplicate event listeners on hot reloads
    const initialized = Array.from(magnets).some(el => el.hasAttribute('data-magnetic-init'));
    if (initialized) return;

    magnets.forEach((elem) => {
      const el = elem as HTMLElement;
      el.setAttribute('data-magnetic-init', 'true');
      
      const handleMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
      };
      
      const handleMouseLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
      };

      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
    });
  }, [status]);

  // Use gsap for parallax scrolling logic
  useGSAP(() => {
    // Parallax Orbs (Dynamic Background) mapped to overall scroll
    if (typeof window !== 'undefined') {
      gsap.to('.orb-1', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.orb-2', { yPercent: -50, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.orb-3', { yPercent: 60, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }, []);

  if (status === 'authenticated') {
    const role = (session?.user as any)?.role;
    redirect(role === 'SHOPKEEPER' ? '/dashboard/shopkeeper' : '/dashboard');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  const features = [
    { icon: Lock, title: 'AES-256 Encryption', desc: 'Every document is encrypted with your unique derived key. We cannot access your files, ever.', color: 'text-brand-500', bg: 'bg-brand-500/10', gradient: 'from-brand-500 to-indigo-600' },
    { icon: FileText, title: 'Smart OCR', desc: 'Local OCR extracts expiry dates and metadata without sending data to external APIs.', color: 'text-amber-500', bg: 'bg-amber-500/10', gradient: 'from-amber-500 to-orange-600' },
    { icon: Bell, title: 'Expiry Alerts', desc: 'Get email notifications 2 days and 1 day before warranties or policies expire.', color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-teal-600' },
    { icon: Store, title: 'Shopkeeper Portal', desc: 'Shopkeepers manage warranties for customers. Customers track everything in one vault.', color: 'text-cyan-500', bg: 'bg-cyan-500/10', gradient: 'from-cyan-500 to-blue-600' },
    { icon: Users, title: 'Customer Ecosystem', desc: 'Customers auto-discover warranties created by their shopkeepers when they register.', color: 'text-pink-500', bg: 'bg-pink-500/10', gradient: 'from-pink-500 to-rose-600' },
    { icon: Shield, title: 'Zero-Trust', desc: 'Files processed in-memory only. Encrypted before storage. Server never sees plaintext.', color: 'text-violet-500', bg: 'bg-violet-500/10', gradient: 'from-violet-500 to-purple-600' },
  ];

  const steps = [
    { step: '01', icon: Zap, title: 'Upload Your Document', desc: 'Drag & drop any warranty card, invoice, or insurance policy. We accept images and PDFs up to 10MB.', gradient: 'from-brand-500 to-indigo-600' },
    { step: '02', icon: Eye, title: 'Smart OCR Extracts Data', desc: 'Our local OCR engine reads your document and automatically pulls out product names, dates, and amounts.', gradient: 'from-amber-500 to-orange-600' },
    { step: '03', icon: Bell, title: 'Get Notified Before Expiry', desc: 'Sit back. We track every expiry and renewal date and alert you before anything expires.', gradient: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-hidden tech-grid" ref={containerRef}>
      
      {/* Dynamic Background */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 lg:mx-auto lg:max-w-7xl lg:mt-6 px-6 py-4 flex items-center justify-between !rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] tracking-tight">
            DigiWarr
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">How it Works</a>
          <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Sign In
          </Link>
          <div className="gsap-magnetic">
            <Link href="/login" className="btn-primary py-2 px-5 !text-xs md:!text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-24 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 gsap-text-scrub">Everything You Need</h2>
            <p className="text-[var(--text-muted)] gsap-fade-in">
              A complete platform for shopkeepers and customers to manage warranties, policies, and bills — all encrypted.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="gsap-feature-card relative group h-full transition-shadow hover:shadow-2xl hover:shadow-brand-500/5 cursor-default">
                <div className="absolute inset-0 animated-border rounded-2xl z-0 pointer-events-none"></div>
                <div className="relative z-10 glass-card p-8 h-full flex flex-col border-none bg-transparent m-[1px]">
                  <div className={`h-14 w-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (Stacked Cards) */}
      <section id="how-it-works" className="relative z-10 py-32 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 gsap-text-scrub">How It Works</h2>
            <p className="text-[var(--text-muted)] gsap-fade-in">Three simple steps to secure your documents forever.</p>
          </div>

          <div className="relative pb-32">
            {steps.map((item, i) => (
              <div 
                key={i} 
                className="gsap-step-card sticky"
                style={{ top: `${120 + i * 20}px`, zIndex: i }}
              >
                <div className="flex items-start gap-6 glass-card p-10 mb-8 border border-[var(--border)] shadow-2xl origin-top bg-[var(--bg-secondary)] relative">
                  <div className={`flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg shadow-brand-500/20`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Step {item.step}</div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed max-w-lg text-lg">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 bg-[var(--bg-secondary)] border-y border-[var(--border)] pt-40 -mt-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 gsap-text-scrub">Simple Pricing</h2>
            <p className="text-[var(--text-muted)] gsap-fade-in">
              Free for everyone. Upgrade when your business grows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="gsap-price-card glass-card p-8 h-full flex flex-col transition-transform hover:-translate-y-2">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-sm text-[var(--text-muted)]">Perfect for getting started</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black">₹0</span>
                <span className="text-[var(--text-muted)]"> /forever</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Up to 10 customers (Shopkeeper)',
                  'Unlimited document uploads',
                  'AES-256 encryption',
                  'Smart OCR extraction',
                  'Expiry email notifications',
                  'Customer self-service portal',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="btn-secondary w-full text-center">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="gsap-price-card relative transition-transform hover:-translate-y-2 shadow-2xl shadow-brand-500/10 h-full">
              <div className="absolute inset-0 animated-border rounded-2xl z-0 pointer-events-none"></div>
              
              <div className="absolute -top-3 right-6 z-20">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  <Star className="h-3 w-3" />
                  Popular
                </span>
              </div>

              <div className="relative z-10 glass-card p-8 h-full flex flex-col border-none bg-transparent m-[1px]">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">Pro</h3>
                  <p className="text-sm text-[var(--text-muted)]">For growing businesses</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black">₹499</span>
                  <span className="text-[var(--text-muted)]"> /month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Unlimited customers',
                    'Everything in Free',
                    'Priority support',
                    'Advanced analytics dashboard',
                    'Bulk warranty creation',
                    'Custom email templates',
                    'API access',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="gsap-magnetic">
                  <button className="btn-primary w-full text-center opacity-80 cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-6 text-center gsap-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/30 mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Secure Your<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-accent-400">Important Documents?</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg mb-10 max-w-xl mx-auto">
            Whether you're a shopkeeper managing customer warranties or a customer tracking your policies — DigiWarr has you covered.
          </p>
          <div className="gsap-magnetic inline-block">
            <Link href="/login" className="btn-primary text-lg py-5 px-10 group">
              Create Your Free Vault
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Top Footer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 gsap-fade-in">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">DigiWarr Vault</span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-sm mb-6">
                A privacy-first, zero-trust digital vault for shopkeepers and customers to securely manage warranties, invoices, and insurance policies.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-brand-500 hover:bg-brand-500/10 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-brand-500 hover:bg-brand-500/10 transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-brand-500 hover:bg-brand-500/10 transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a></li>
                <li><Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Dashboard</Link></li>
                <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              © {new Date().getFullYear()} DigiWarr Vault. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>Secured with AES-256-GCM · Zero-Trust Architecture</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
