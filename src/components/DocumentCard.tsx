'use client';

import React, { useRef } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import gsap from 'gsap';
import {
  FileText,
  Shield,
  Receipt,
  Calendar,
  Building2,
  Package,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Store,
  Edit2,
  Lock as LockIcon,
} from 'lucide-react';

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    type: string;
    productName: string | null;
    provider: string | null;
    purchaseDate: string | null;
    expiryDate: string | null;
    renewalDate: string | null;
    amount: string | null;
    originalName: string;
    fileSize: number;
    createdAt: string;
    createdByShopkeeper?: boolean;
    editCount?: number;
    shopkeeper?: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    extendedStatus?: string;
    extendedWarrantyExpiry?: string | null;
    isExtendedOffered?: boolean;
    extendedPrice?: number | null;
    extensionDurationDays?: number | null;
  };
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onEdit?: (document: any) => void;
  onOfferExtended?: (document: any) => void;
  index?: number;
}

function getStatus(expiryDate: string | null) {
  if (!expiryDate) return { label: 'No Expiry', color: 'status-active', icon: CheckCircle2, urgency: 'none' as const };
  const expiry = new Date(expiryDate);
  const daysLeft = differenceInDays(expiry, new Date());

  if (isPast(expiry)) return { label: 'Expired', color: 'status-expired', icon: XCircle, urgency: 'expired' as const };
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'status-expired', icon: AlertTriangle, urgency: 'critical' as const };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'status-expiring', icon: AlertTriangle, urgency: 'warning' as const };
  return { label: 'Active', color: 'status-active', icon: CheckCircle2, urgency: 'none' as const };
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'WARRANTY': return FileText;
    case 'POLICY': return Shield;
    case 'INVOICE': return Receipt;
    default: return FileText;
  }
}

function getTypeGradient(type: string) {
  switch (type) {
    case 'WARRANTY': return 'from-blue-500 to-indigo-600';
    case 'POLICY': return 'from-emerald-500 to-teal-600';
    case 'INVOICE': return 'from-orange-500 to-amber-600';
    default: return 'from-gray-500 to-gray-600';
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentCard({ document: doc, onDelete, onDownload, onEdit, onOfferExtended, index = 0 }: DocumentCardProps) {
  const effectiveExpiry = doc.extendedStatus === 'purchased' && doc.extendedWarrantyExpiry ? doc.extendedWarrantyExpiry : doc.expiryDate;
  const status = getStatus(effectiveExpiry);
  const TypeIcon = getTypeIcon(doc.type);
  const StatusIcon = status.icon;
  const gradient = getTypeGradient(doc.type);
  const cardRef = useRef<HTMLDivElement>(null);

  const isUrgent = status.urgency === 'critical' || status.urgency === 'expired';
  const isWarning = status.urgency === 'warning';

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -4, duration: 0.2, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.2, ease: "power2.out" });
  };

  const shopkeeperName = doc.shopkeeper?.name || doc.provider;

  // 24-hr edit limit logic
  const createdAt = new Date(doc.createdAt);
  const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const isEditLocked = (doc.editCount || 0) >= 1 || hoursSinceCreation > 24;

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`glass-card group cursor-pointer transition-all duration-300 ${
        isUrgent ? 'ring-1 ring-red-500/30 border-red-500/20' :
        isWarning ? 'ring-1 ring-amber-500/20 border-amber-500/15' : ''
      }`}
    >
      {/* Top gradient bar */}
      <div className={`h-1 bg-gradient-to-r ${
        isUrgent ? 'from-red-500 to-red-600' :
        isWarning ? 'from-amber-500 to-orange-500' :
        gradient
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
              <TypeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1 text-sm">
                {doc.title}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-[var(--text-muted)] capitalize">
                  {doc.type.toLowerCase()}
                </p>
                {doc.extendedStatus === 'purchased' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    <Shield className="h-2.5 w-2.5" />
                    Extended ✓
                  </span>
                )}
                {doc.createdByShopkeeper && !doc.extendedStatus && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-500 bg-accent-500/10 px-1.5 py-0.5 rounded-full">
                    <Store className="h-2.5 w-2.5" />
                    Shopkeeper
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`status-badge ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-4">
          {doc.productName && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Package className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="truncate">{doc.productName}</span>
            </div>
          )}
          {shopkeeperName && doc.createdByShopkeeper && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Store className="h-3.5 w-3.5 text-accent-500" />
              <span className="truncate font-medium">{shopkeeperName}</span>
            </div>
          )}
          {doc.provider && !doc.createdByShopkeeper && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Building2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="truncate">{doc.provider}</span>
            </div>
          )}
          {doc.expiryDate && (
            <div className={`flex items-center gap-2 text-xs ${
              isUrgent ? 'text-red-500 font-medium' :
              isWarning ? 'text-amber-500 font-medium' :
              'text-[var(--text-secondary)]'
            }`}>
              <Calendar className={`h-3.5 w-3.5 ${
                isUrgent ? 'text-red-500' :
                isWarning ? 'text-amber-500' :
                'text-[var(--text-muted)]'
              }`} />
              <span>Expires: {format(new Date(effectiveExpiry!), 'MMM dd, yyyy')} {doc.extendedStatus === 'purchased' ? '(Extended)' : ''}</span>
            </div>
          )}
          {doc.purchaseDate && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>Purchased: {format(new Date(doc.purchaseDate), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className="text-xs text-[var(--text-muted)]">
            {formatFileSize(doc.fileSize)}
          </span>
          <div className="flex gap-1 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!isEditLocked) onEdit(doc);
                }}
                disabled={isEditLocked}
                className={`rounded-lg p-2 transition-colors ${
                  isEditLocked 
                    ? 'text-[var(--text-muted)] cursor-not-allowed opacity-50' 
                    : 'text-[var(--text-muted)] hover:bg-brand-500/10 hover:text-brand-500'
                }`}
                title={isEditLocked ? "Editing is locked. Contact admin." : "Edit Warranty"}
              >
                {isEditLocked ? <LockIcon className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </button>
            )}
            {onOfferExtended && doc.extendedStatus === 'not_offered' && (
              <button
                onClick={(e) => { e.stopPropagation(); onOfferExtended(doc); }}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors"
                title="Offer Extended Warranty"
              >
                <Store className="h-4 w-4" />
              </button>
            )}
            {doc.extendedStatus === 'offered' && (
              <span className="inline-flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg mr-2" title="Extended warranty is currently offered to the customer">
                Offer Pending
              </span>
            )}
            {onDownload && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(doc.id); }}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {onEdit && isEditLocked && (
          <div className="mt-2 text-[10px] text-amber-500 font-medium flex items-center gap-1">
            <LockIcon className="h-2.5 w-2.5" />
            Editing is locked. Contact admin.
          </div>
        )}
      </div>
    </div>
  );
}
