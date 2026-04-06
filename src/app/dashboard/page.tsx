'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  FileText, Shield, Receipt, AlertTriangle,
  Search, Plus, Target, Store, Bell, Crown,
  CheckCircle2, XCircle, Filter, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import StatsCard from '@/components/StatsCard';
import DocumentCard from '@/components/DocumentCard';
import ExtendedWarrantyCard from '@/components/ExtendedWarrantyCard';
import { SkeletonCard, SkeletonStats } from '@/components/SkeletonCard';
import { toast } from 'react-hot-toast';

type StatusFilter = 'ALL' | 'active' | 'expiring' | 'expired';
type TypeFilter = 'ALL' | 'WARRANTY' | 'INVOICE' | 'POLICY';

interface Shopkeeper {
  id: string;
  name: string | null;
  email: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<any[]>([]);
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [shopkeeperFilter, setShopkeeperFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync tab from URL param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'WARRANTY' || tab === 'INVOICE' || tab === 'POLICY') {
      setTypeFilter(tab);
    } else if (tab === 'expiring') {
      setStatusFilter('expiring');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents);
        setShopkeepers(data.shopkeepers || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document? It cannot be recovered.')) {
      return;
    }
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(documents.filter(doc => doc.id !== id));
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/download?id=${id}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `document-${id}`;
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) filename = decodeURIComponent(matches[1]);
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handlePurchaseExtended = async (id: string) => {
    try {
      const res = await fetch('/api/documents/purchase-extended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to purchase extended warranty');
      }
      toast.success('Extended warranty purchased successfully!');
      await fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Payment simulation failed');
    }
  };

  // Compute stats
  const getDocStatus = (doc: any) => {
    if (!doc.expiryDate) return 'active';
    const daysLeft = (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'active';
  };

  const activeCount = documents.filter(d => getDocStatus(d) === 'active').length;
  const expiringCount = documents.filter(d => getDocStatus(d) === 'expiring').length;
  const expiredCount = documents.filter(d => getDocStatus(d) === 'expired').length;

  const criticalItems = documents.filter(d => {
    if (!d.expiryDate) return false;
    const daysLeft = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return daysLeft > 0 && daysLeft <= 7;
  });

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    // Search filter
    const matchesSearch = !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.productName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.provider?.toLowerCase().includes(search.toLowerCase()) ||
      doc.shopkeeper?.name?.toLowerCase().includes(search.toLowerCase());

    // Type filter
    const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = getDocStatus(doc) === statusFilter;
    }

    // Shopkeeper filter
    const matchesShopkeeper = shopkeeperFilter === 'ALL' ||
      doc.shopkeeperId === shopkeeperFilter;

    return matchesSearch && matchesType && matchesStatus && matchesShopkeeper;
  });

  // Group by shopkeeper (for display)
  const shopkeeperGroups = shopkeepers.length > 0
    ? shopkeepers.map(sk => ({
        shopkeeper: sk,
        docs: filteredDocs.filter(d => d.shopkeeperId === sk.id && d.createdByShopkeeper),
      })).filter(g => g.docs.length > 0)
    : [];

  const personalDocs = filteredDocs.filter(d => !d.createdByShopkeeper);

  const extendedOffers = filteredDocs.filter(d => d.extendedStatus === 'offered');

  // GSAP Animations
  useGSAP(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.dash-header',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo('.gsap-doc-card',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out', overwrite: true }
      );
      gsap.fromTo('.gsap-section',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
      );
      if (criticalItems.length > 0) {
        gsap.to('.notification-pulse', {
          scale: 1.05,
          duration: 0.8,
          yoyo: true,
          repeat: -1,
          ease: "power1.inOut"
        });
      }
    }
  }, { dependencies: [loading, filteredDocs.length], scope: containerRef });

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        {/* Skeleton header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-[var(--bg-tertiary)]" />
            <div className="h-4 w-48 rounded bg-[var(--bg-tertiary)]" />
          </div>
          <div className="h-11 w-36 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
        </div>

        {/* Skeleton stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonStats key={i} />)}
        </div>

        {/* Skeleton cards */}
        <div className="glass-card p-6 shadow-xl border border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" ref={containerRef}>
      {/* Header */}
      <div className="dash-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent pb-1">
            Welcome, {session?.user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Your encrypted vault is secure and synced.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {expiringCount > 0 && (
            <div className="notification-badge flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
              <Bell className="h-4 w-4" />
              <span>{expiringCount} expiring</span>
            </div>
          )}
          <Link href="/dashboard/upload" className="btn-primary hover-scale" id="add-document-btn">
            <Plus className="h-4 w-4" />
            Add Document
          </Link>
        </div>
      </div>

      {/* Critical Expiry Banner */}
      {criticalItems.length > 0 && (
        <div className="notification-pulse gsap-section rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-600/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-500 mb-1">
                ⚠️ {criticalItems.length} {criticalItems.length === 1 ? 'warranty expires' : 'warranties expire'} within 7 days
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {criticalItems.map((doc) => {
                  const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                  return (
                    <span key={doc.id} className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20">
                      {doc.productName || doc.title} — {daysLeft}d left
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extended Warranty Offers */}
      {extendedOffers.length > 0 && (
        <div className="gsap-section">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-500">
            <Crown className="h-5 w-5" /> Special Offers: Extend Your Peace of Mind
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {extendedOffers.map(doc => (
              <ExtendedWarrantyCard key={doc.id} document={doc} onPurchase={handlePurchaseExtended} />
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 gsap-section">
        <StatsCard title="Total Documents" value={documents.length} icon={FileText} gradient="from-blue-500 to-indigo-600" delay={0.1} />
        <StatsCard title="Active" value={activeCount} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" delay={0.2} />
        <StatsCard title="Expiring Soon" value={expiringCount} icon={AlertTriangle} gradient="from-amber-500 to-orange-500" delay={0.3} />
        <StatsCard title="Expired" value={expiredCount} icon={XCircle} gradient="from-red-500 to-pink-600" delay={0.4} />
      </div>

      {/* Shopkeeper Warranties Highlight */}
      {shopkeeperGroups.length > 0 && shopkeeperFilter === 'ALL' && statusFilter === 'ALL' && typeFilter === 'ALL' && !search && (
        <div className="gsap-section space-y-4">
          {shopkeeperGroups.map(({ shopkeeper, docs }) => (
            <div key={shopkeeper.id} className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-5">
              <h2 className="text-base font-bold text-accent-500 mb-1 flex items-center gap-2">
                <Store className="h-4 w-4" />
                From {shopkeeper.name || shopkeeper.email}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                {docs.length} {docs.length === 1 ? 'warranty' : 'warranties'} from this shopkeeper
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.slice(0, 3).map((doc, i) => (
                  <div key={doc.id} className="gsap-doc-card">
                    <DocumentCard document={doc} index={i} onDelete={handleDelete} onDownload={handleDownload} />
                  </div>
                ))}
              </div>
              {docs.length > 3 && (
                <button
                  onClick={() => setShopkeeperFilter(shopkeeper.id)}
                  className="mt-3 text-sm font-medium text-accent-500 hover:text-accent-600 transition-colors"
                >
                  View all {docs.length} warranties →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content Section */}
      <div className="glass-card mt-2 p-6 shadow-xl border border-[var(--border)] gsap-section">
        {/* Filter Bar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Type Tabs */}
            <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
              {(['ALL', 'WARRANTY', 'INVOICE', 'POLICY'] as const).map((type) => {
                const labels: Record<string, string> = {
                  'ALL': 'All',
                  'WARRANTY': 'Warranties',
                  'INVOICE': 'Invoices',
                  'POLICY': 'Policies',
                };
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`flex-1 lg:flex-none px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-300 ${
                      typeFilter === type
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10 h-11 w-full"
                  id="doc-search"
                />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                  showFilters || statusFilter !== 'ALL' || shopkeeperFilter !== 'ALL'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-300'
                }`}
                id="filter-toggle"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(statusFilter !== 'ALL' || shopkeeperFilter !== 'ALL') && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold">
                    {(statusFilter !== 'ALL' ? 1 : 0) + (shopkeeperFilter !== 'ALL' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border)]">
              {/* Status filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</label>
                <div className="flex gap-1.5">
                  {([
                    { value: 'ALL', label: 'All', color: '' },
                    { value: 'active', label: 'Active', color: 'text-emerald-500' },
                    { value: 'expiring', label: 'Expiring', color: 'text-amber-500' },
                    { value: 'expired', label: 'Expired', color: 'text-red-500' },
                  ] as const).map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                        statusFilter === value
                          ? 'bg-brand-500 text-white shadow-sm'
                          : `bg-[var(--bg-secondary)] ${color || 'text-[var(--text-secondary)]'} hover:bg-[var(--card-hover)]`
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shopkeeper filter */}
              {shopkeepers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Shopkeeper</label>
                  <select
                    value={shopkeeperFilter}
                    onChange={(e) => setShopkeeperFilter(e.target.value)}
                    className="input-field h-9 text-xs py-0 pr-8"
                    id="shopkeeper-filter"
                  >
                    <option value="ALL">All Shopkeepers</option>
                    {shopkeepers.map(sk => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name || sk.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear filters */}
              {(statusFilter !== 'ALL' || shopkeeperFilter !== 'ALL') && (
                <div className="flex items-end">
                  <button
                    onClick={() => { setStatusFilter('ALL'); setShopkeeperFilter('ALL'); }}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="gsap-doc-card">
                <DocumentCard document={doc} index={0} onDelete={handleDelete} onDownload={handleDownload} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 px-4 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-tertiary)]/50">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 mb-6 relative">
              <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full" />
              <Target className="h-10 w-10 relative z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">
              {search || statusFilter !== 'ALL' || shopkeeperFilter !== 'ALL'
                ? "No matches found"
                : typeFilter === 'ALL'
                  ? "Your vault feels empty"
                  : `No ${typeFilter.toLowerCase()}s found`}
            </h3>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto text-base">
              {search || statusFilter !== 'ALL' || shopkeeperFilter !== 'ALL'
                ? "Try adjusting your filters to find what you're looking for."
                : "Upload your first warranty, bill, or policy to keep it secure and never lose track of expiry dates again."}
            </p>
            {!search && statusFilter === 'ALL' && shopkeeperFilter === 'ALL' && (
              <Link href="/dashboard/upload" className="btn-primary inline-flex hover-scale text-base px-6 py-3">
                <Plus className="h-5 w-5" />
                Upload New Document
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
