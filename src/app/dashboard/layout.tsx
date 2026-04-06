'use client';

import Sidebar from '@/components/Sidebar';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const mainRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (status === 'authenticated' && mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, { dependencies: [status] });

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading') {
    return null; // Or a sleek loader
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main ref={mainRef} className="flex-1 overflow-y-auto lg:ml-72 p-4 md:p-8 opacity-0">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
