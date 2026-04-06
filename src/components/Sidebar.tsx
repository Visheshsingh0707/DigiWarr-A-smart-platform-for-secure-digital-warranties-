'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutDashboard,
  Upload,
  Shield,
  FileText,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Lock,
  Bell,
  Users,
  Store,
  Crown,
} from 'lucide-react';
import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const customerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard?tab=WARRANTY', label: 'Warranties', icon: FileText },
  { href: '/dashboard?tab=POLICY', label: 'Policies', icon: Shield },
  { href: '/dashboard?tab=expiring', label: 'Expiring Soon', icon: Bell },
];

const shopkeeperNavItems = [
  { href: '/dashboard/shopkeeper', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/shopkeeper/warranties', label: 'Create Warranty', icon: FileText },
  { href: '/dashboard/shopkeeper?tab=warranties', label: 'Manage Warranties', icon: FileText },
  { href: '/dashboard/shopkeeper?tab=customers', label: 'Customers', icon: Users },
  { href: '/dashboard/shopkeeper?tab=expiring', label: 'Expiring Soon', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopSidebarRef = useRef<HTMLElement>(null);

  const isShopkeeper = session?.user?.role === 'SHOPKEEPER';
  const navItems = isShopkeeper ? shopkeeperNavItems : customerNavItems;

  useGSAP(() => {
    if (desktopSidebarRef.current) {
      gsap.fromTo(desktopSidebarRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, { scope: desktopSidebarRef });

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            DigiWarr
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {isShopkeeper ? 'Business Portal' : 'Secure Vault'}
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mx-3 mb-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
          isShopkeeper
            ? 'bg-accent-500/10 text-accent-500 border border-accent-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
        }`}>
          {isShopkeeper ? <Store className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
          {isShopkeeper ? 'Shopkeeper' : 'Customer'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const itemPath = item.href.split('?')[0];
          const itemParam = new URLSearchParams(item.href.split('?')[1] || '').get('tab');
          const isActive = itemParam
            ? pathname === itemPath && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === itemParam
            : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--border)] p-4 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full"
          id="theme-toggle"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User info & logout */}
        {session?.user && (
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
                isShopkeeper
                  ? 'bg-gradient-to-br from-accent-400 to-accent-600'
                  : 'bg-gradient-to-br from-brand-400 to-accent-400'
              }`}>
                {session.user.name?.[0]?.toUpperCase() ||
                  session.user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {session.user.name || 'User'}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20"
              id="logout-button"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-[var(--card-bg)] p-2 shadow-lg lg:hidden"
        id="mobile-menu-toggle"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside ref={desktopSidebarRef} className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] opacity-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--bg-secondary)] lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
