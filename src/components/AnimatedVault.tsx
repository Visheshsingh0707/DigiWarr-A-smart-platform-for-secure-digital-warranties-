'use client';

import { Shield, Lock } from 'lucide-react';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export default function AnimatedVault() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const outerRingRef = useRef<HTMLDivElement>(null);
  const innerRingRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Continuous floating animation
    gsap.to(containerRef.current, {
      y: 15,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Outer ring 3D rotation
    gsap.to(outerRingRef.current, {
      rotationX: 360,
      rotationY: 180,
      rotationZ: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
      transformStyle: 'preserve-3d',
    });

    // Inner ring 3D counter-rotation
    gsap.to(innerRingRef.current, {
      rotationX: -360,
      rotationY: 360,
      rotationZ: -180,
      duration: 15,
      repeat: -1,
      ease: 'none',
      transformStyle: 'preserve-3d',
    });

    // Shield pulsing glow
    gsap.to(shieldRef.current, {
      boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)',
      scale: 1.05,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });

  }, { scope: containerRef });

  // Mouse tracking physics for that premium interactive feel
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) * 0.1;
    const y = (e.clientY - top - height / 2) * 0.1;
    
    gsap.to(orbRef.current, {
      x, y,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    gsap.to(orbRef.current, {
      x: 0, y: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.3)'
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center cursor-crosshair [perspective:1000px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={orbRef} className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
        
        {/* Core Glowing Background Blob */}
        <div className="absolute w-64 h-64 bg-emerald-500/30 rounded-full blur-[80px] -z-10" />
        <div className="absolute w-48 h-48 bg-brand-500/20 rounded-full blur-[60px] translate-x-12 translate-y-12 -z-10" />

        {/* Outer Ring (Glass) */}
        <div 
          ref={outerRingRef}
          className="absolute w-72 h-72 rounded-full border border-white/10 bg-gradient-to-tr from-white/5 to-transparent backdrop-blur-[2px] shadow-2xl"
        >
           {/* Floating elements on ring */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
           <div className="absolute bottom-1/4 right-0 w-2 h-2 bg-brand-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
        </div>

        {/* Inner Ring (Glass) */}
        <div 
          ref={innerRingRef}
          className="absolute w-56 h-56 rounded-full border-2 border-emerald-500/20 bg-emerald-900/10 backdrop-blur-sm flex items-center justify-center"
        >
            <div className="absolute bottom-0 left-1/4 w-3 h-3 bg-red-400 rounded-full shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
        </div>

        {/* Center Shield / Vault Icon */}
        <div 
          ref={shieldRef}
          className="relative z-10 w-32 h-32 rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
            <Shield className="h-12 w-12 text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <Lock className="h-5 w-5 text-white/70" />
        </div>
      </div>
    </div>
  );
}
