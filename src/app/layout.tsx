import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'DigiWarr - Secure Digital Locker for Warranties, Bills & Policies',
  description: 'A privacy-first, zero-trust digital vault to securely store your warranties, invoices, and insurance policies with AES-256 encryption.',
  keywords: ['digital locker', 'warranty tracker', 'secure vault', 'insurance policy', 'document encryption'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
