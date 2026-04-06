'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Users, FileText, AlertTriangle, Plus, Crown, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import StatsCard from '@/components/StatsCard';
import CustomerCard from '@/components/CustomerCard';
import AddCustomerModal from '@/components/AddCustomerModal';
import UpgradeBanner from '@/components/UpgradeBanner';
import EditWarrantyModal from '@/components/EditWarrantyModal';
import DocumentCard from '@/components/DocumentCard';
import OfferExtendedModal from '@/components/OfferExtendedModal';
import { toast } from 'react-hot-toast';

function ShopkeeperDashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'customers');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<any>(null);
  const [offeringWarranty, setOfferingWarranty] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'customers' || tab === 'warranties' || tab === 'expiring')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([fetchStats(), fetchCustomers(), fetchWarranties()]).finally(() => setLoading(false));
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/shopkeeper/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/shopkeeper/customers');
      const data = await res.json();
      if (res.ok) setCustomers(data.customers);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchWarranties = async () => {
    try {
      const res = await fetch('/api/shopkeeper/warranties');
      const data = await res.json();
      if (res.ok) setWarranties(data.warranties);
    } catch (error) {
      console.error('Failed to fetch warranties:', error);
    }
  };

  const handleAddCustomer = async (name: string, email: string) => {
    const res = await fetch('/api/shopkeeper/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add customer');
    }
    toast.success('Customer added successfully!');
    await Promise.all([fetchStats(), fetchCustomers(), fetchWarranties()]);
  };

  const handleUpdateWarranty = async (id: string, data: any) => {
    const res = await fetch(`/api/shopkeeper/warranties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to update warranty');
    }
    toast.success('Warranty updated successfully!');
    await fetchWarranties();
  };

  const handleOfferExtended = async (id: string, price: number, duration: number) => {
    const res = await fetch('/api/shopkeeper/offer-extended', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: id, extendedPrice: price, extensionDurationDays: duration }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to offer extended warranty');
    }
    toast.success('Extended warranty offered successfully!');
    await fetchWarranties();
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

  // GSAP Animations
  useGSAP(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.shop-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.gsap-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out', delay: 0.3 });
    }
  }, { dependencies: [loading, customers.length, warranties.length, activeTab], scope: containerRef });

  const filteredCustomers = customers.filter((customer) => {
    if (activeTab === 'expiring') {
      return customer.documents?.some((d: any) => {
        if (!d.expiryDate) return false;
        const daysLeft = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
        return daysLeft > 0 && daysLeft <= 30;
      });
    }
    return true; // 'customers' or default shows all
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" ref={containerRef}>
      {/* Header */}
      <div className="shop-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-500 to-brand-500 bg-clip-text text-transparent pb-1">
            Hi, {session?.user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Manage your customers and warranties from here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-primary hover-scale" id="add-customer-btn">
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
          <Link href="/dashboard/shopkeeper/warranties" className="btn-secondary hover-scale">
            <FileText className="h-4 w-4" />
            Create Warranty
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => setActiveTab('customers')} className="cursor-pointer">
            <StatsCard title="Total Customers" value={stats.totalCustomers} icon={Users} gradient="from-brand-500 to-indigo-600" delay={0.1} />
          </div>
          <div onClick={() => setActiveTab('warranties')} className="cursor-pointer">
            <StatsCard title="Active Warranties" value={stats.activeWarranties} icon={FileText} gradient="from-emerald-500 to-teal-600" delay={0.2} />
          </div>
          <div onClick={() => setActiveTab('expiring')} className="cursor-pointer">
            <StatsCard title="Expiring Soon" value={stats.expiringSoon} icon={AlertTriangle} gradient="from-red-500 to-pink-600" delay={0.3} />
          </div>
          <StatsCard title="Remaining Slots" value={stats.remainingSlots} subtitle={`${stats.totalCustomers}/${stats.limit} used`} icon={Crown} gradient="from-amber-500 to-orange-600" delay={0.4} />
          <StatsCard title="Extended Sold" value={stats.extendedWarrantiesSold || 0} icon={Package} gradient="from-indigo-500 to-violet-600" delay={0.5} />
          <StatsCard title="Extended Revenue" value={`₹${stats.extendedRevenue || 0}`} icon={TrendingUp} gradient="from-emerald-400 to-emerald-600" delay={0.6} />
        </div>
      )}

      {/* Upgrade Banner */}
      {stats?.isAtLimit && (
        <UpgradeBanner currentCount={stats.totalCustomers} limit={stats.limit} />
      )}

      {/* Customers & Warranties Tabs */}
      <div className="glass-card p-6 shadow-xl border border-[var(--border)] overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('customers')}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === 'customers' ? 'text-brand-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customers
              </span>
              {activeTab === 'customers' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('warranties')}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === 'warranties' ? 'text-brand-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Warranties
              </span>
              {activeTab === 'warranties' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === 'expiring' ? 'text-brand-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Expiring
              </span>
              {activeTab === 'expiring' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          </div>
          <span className="text-sm text-[var(--text-muted)] font-medium">
            {activeTab === 'warranties' ? `${warranties.length} warranties` : `${customers.length} total`}
          </span>
        </div>

        {activeTab === 'warranties' ? (
          warranties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warranties.map((warranty, i) => (
                <div key={warranty.id} className="gsap-card">
                  <DocumentCard 
                    document={warranty} 
                    index={i} 
                    onDownload={handleDownload}
                    onEdit={(doc) => setEditingWarranty(doc)}
                    onOfferExtended={(doc) => setOfferingWarranty(doc)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-tertiary)]/50">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">No warranties issued yet</h3>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto text-sm">
                Start by creating a warranty for your customers.
              </p>
              <Link href="/dashboard/shopkeeper/warranties" className="btn-primary inline-flex hover-scale">
                <Plus className="h-4 w-4" />
                Create Your First Warranty
              </Link>
            </div>
          )
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="gsap-card">
                <CustomerCard customer={customer} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-tertiary)]/50">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {activeTab === 'expiring' ? 'No customers expiring soon' : 'No customers yet'}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto text-sm">
              {activeTab === 'expiring' 
                ? "Great job! None of your customers have warranties expiring in the next 30 days."
                : "Start by adding your first customer. They'll receive warranty notifications automatically."}
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex hover-scale">
              <Plus className="h-4 w-4" />
              Add Your First Customer
            </button>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustomer}
      />

      {/* Edit Warranty Modal */}
      <EditWarrantyModal
        isOpen={!!editingWarranty}
        onClose={() => setEditingWarranty(null)}
        onUpdate={handleUpdateWarranty}
        warranty={editingWarranty}
      />

      {/* Offer Extended Modal */}
      {offeringWarranty && (
        <OfferExtendedModal
          isOpen={!!offeringWarranty}
          onClose={() => setOfferingWarranty(null)}
          onOffer={handleOfferExtended}
          documentId={offeringWarranty.id}
        />
      )}
    </div>
  );
}

export default function ShopkeeperDashboard() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    }>
      <ShopkeeperDashboardContent />
    </Suspense>
  );
}
