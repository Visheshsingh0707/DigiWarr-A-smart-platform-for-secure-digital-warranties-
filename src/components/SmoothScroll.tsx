'use client';

import { ReactLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Only apply smooth scroll if we are not in the dashboard routes.
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.05, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
