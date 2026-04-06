"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    id: 1,
    title: "Upload Your Bills Easily",
    description:
      "Simply snap a picture or upload a digital copy of your invoice. Our secure vault takes care of the rest, organizing your documents in one reliable place.",
    // Placeholder image URLs - using a nice unsplash gradient / abstract for placeholders
    image: "https://images.unsplash.com/photo-1554224154-26032ffc0d04?w=800&q=80",
    alt: "Invoice Upload UI Demo",
  },
  {
    id: 2,
    title: "AI Extracts Key Details",
    description:
      "No more manual entry. VaultDoc's intelligent AI instantly parses your document, extracting purchase dates, amounts, and critical warranty terms automatically.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    alt: "OCR AI Extraction Demo",
  },
  {
    id: 3,
    title: "Track Warranties Smartly",
    description:
      "Navigate a clean, simple dashboard. Instantly separate active coverages from expired items so you never have to guess what's still protected.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    alt: "Warranty Tracking Dashboard",
  },
  {
    id: 4,
    title: "Never Miss Expiry Again",
    description:
      "Proactive notifications ensure you act before it's too late. Receive timely alerts right when your coverage is about to lapse.",
    image: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=800&q=80",
    alt: "Expiry Notification Demo",
  },
];

export default function ScrollFeatureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Create a matchMedia instance for responsiveness
      // Only pin and animate like this on desktop (viewport > 768px)
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // Pin the right column
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: rightColRef.current,
          pinSpacing: false,
        });

        // We have multiple texts, let's trigger image changes
        const textElements = gsap.utils.toArray<HTMLElement>(".text-step");
        
        // Ensure first state is properly set initially
        gsap.set(".image-layer-0", { opacity: 1, scale: 1 });
        gsap.set(".text-step-0", { opacity: 1, x: 0 });
        
        for(let i=1; i<textElements.length; i++) {
          gsap.set(`.image-layer-${i}`, { opacity: 0, scale: 0.95 });
          gsap.set(`.text-step-${i}`, { opacity: 0.3, x: -20 });
        }

        textElements.forEach((text, i) => {
          ScrollTrigger.create({
            trigger: text,
            start: "top center", // when the top of the text hits the center of the screen
            end: "bottom center",
            onEnter: () => animateToStep(i),
            onEnterBack: () => animateToStep(i),
          });
        });

        function animateToStep(activeIndex: number) {
          features.forEach((_, i) => {
            if (i === activeIndex) {
              // Fade in and scale up active image
              gsap.to(`.image-layer-${i}`, {
                opacity: 1,
                scale: 1,
                duration: 0.6,
                ease: "power3.out",
                zIndex: 10,
              });
              // Emphasize active text
              gsap.to(`.text-step-${i}`, {
                opacity: 1,
                x: 0,
                duration: 0.4,
                ease: "power2.out",
              });
            } else {
              // Fade out and scale down inactive images
              gsap.to(`.image-layer-${i}`, {
                opacity: 0,
                scale: 0.95,
                duration: 0.6,
                ease: "power3.out",
                zIndex: 0,
              });
              // De-emphasize inactive texts
              gsap.to(`.text-step-${i}`, {
                opacity: 0.3,
                x: -20,
                duration: 0.4,
                ease: "power2.out",
              });
            }
          });
        }
      });

      return () => {
        // Cleanup will happen automatically thanks to useGSAP and matchMedia context
      };
    },
    { scope: containerRef }
  );

  return (
    <section 
      ref={containerRef} 
      className="relative w-full bg-slate-950 text-white selection:bg-indigo-500/30"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row relative z-10">
          
          {/* LEFT COLUMN: Text Content (Scrolls Naturally) */}
          <div 
            ref={leftColRef} 
            className="w-full md:w-1/2 flex flex-col pt-[10vh] md:pt-[20vh] pb-[10vh]"
          >
            {features.map((feature, i) => (
              <div 
                key={feature.id} 
                className={`text-step text-step-${i} min-h-[60vh] md:min-h-screen flex flex-col justify-center py-10`}
              >
                <div className="md:max-w-md">
                  <div className="text-indigo-400 font-semibold tracking-wider text-sm lg:text-base mb-4 uppercase">
                    Step {feature.id}
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
                    {feature.title}
                  </h2>
                  <p className="text-lg lg:text-xl text-slate-400 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
                
                {/* Mobile Fallback Image (Only visible on small screens) */}
                <div className="md:hidden mt-10 w-full relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    className="object-cover"
                  />
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                </div>
              </div>
            ))}
            {/* Extra padding at bottom to allow the last item to scroll into center */}
            <div className="hidden md:block h-[30vh]"></div>
          </div>

          {/* RIGHT COLUMN: Pinned Image Container (Hidden on Mobile) */}
          <div 
            ref={rightColRef}
            className="hidden md:flex w-1/2 h-screen top-0 items-center justify-center pt-[10vh] pb-[10vh]"
          >
            <div className="relative w-full max-w-lg aspect-[4/5] lg:aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.1)] bg-slate-900 group">
              {features.map((feature, i) => (
                <div 
                  key={feature.id}
                  className={`image-layer image-layer-${i} absolute inset-0 w-full h-full will-change-transform`}
                >
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={i === 0} // prioritize the first image loading
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  {/* Apple-like subtle gloss/gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 via-transparent to-white/5 mix-blend-overlay pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
