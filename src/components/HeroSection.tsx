'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });

    // Text animations (Left Side)
    tl.fromTo(
      '.hero-badge',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 }
    )
    .fromTo(
      '.hero-title',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0 },
      '-=0.8'
    )
    .fromTo(
      '.hero-desc',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0 },
      '-=0.8'
    )
    .fromTo(
      '.hero-cta',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 },
      '-=0.8'
    );

    // Spline object animation (Right Side)
    tl.fromTo(
      '.hero-spline',
      { opacity: 0, x: 40, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 1.5, ease: 'power2.out' },
      '-=1'
    );
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="relative z-10 pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8"
    >
      {/* Left Axis: Text Content */}
      <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left pt-0 lg:pt-10 z-10">
        <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-500 mb-8 shadow-inner shadow-brand-500/10 opacity-0">
          <Sparkles className="h-4 w-4" />
          Now with Shopkeeper & Customer Roles
        </div>

        <h1 className="hero-title opacity-0 text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-secondary)] mb-6">
          Your Secure Digital Vault<br className="hidden md:block" />
          for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-400">Warranties & Policies</span>
        </h1>

        <p className="hero-desc opacity-0 text-lg md:text-xl text-[var(--text-muted)] max-w-2xl lg:max-w-xl mb-10 text-balance lg:text-pretty">
          Stop losing important documents. Shopkeepers create digital warranties. Customers track everything — warranties, policies, bills — in one encrypted vault.
        </p>

        <div className="hero-cta opacity-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto lg:w-full max-w-md lg:max-w-none justify-center lg:justify-start">
          <Link href="/login" className="btn-primary text-base py-4 px-8 group w-full sm:w-auto text-center flex items-center justify-center shadow-brand-500/25 shadow-xl hover:shadow-brand-500/40 transition-shadow">
            Store Your Warranty Digitally
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="btn-secondary text-base py-4 px-8 w-full sm:w-auto text-center">
            See Features
          </a>
        </div>
      </div>

      {/* Right Axis: Spline 3D Scene */}
      <div className="hero-spline opacity-0 flex-1 w-full relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] xl:h-[700px] flex items-center justify-center -mr-0 lg:-mr-12 xl:-mr-24 pointer-events-auto">
        {/* Decorative backdrop blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-500/15 rounded-full blur-[100px] -z-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[60%] h-[60%] bg-accent-500/15 rounded-full blur-[80px] -z-20 pointer-events-none translate-x-1/4 -translate-y-1/3" />
        
        {/* Spline Iframe Wrapper */}
        <div 
          className="w-full h-full relative z-10 rounded-3xl overflow-hidden pointer-events-auto mix-blend-lighten"
          style={{ 
            clipPath: 'inset(0px 0px 48px 0px)',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
          }}
        >
           <iframe 
             src='https://my.spline.design/techinspired3dassets01protection-MKhZiH0aMEm6uaw7dqf5pO8g/?transparent=1&v=2' 
             frameBorder='0' 
             width='100%' 
             height='100%'
             className="w-full h-full min-h-[550px] lg:min-h-[650px] outline-none border-none"
             title="Spline 3D Security Vault"
             style={{ backgroundColor: 'transparent' }}
           />
        </div>
      </div>
    </section>
  );
}
