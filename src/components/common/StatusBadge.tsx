import React from 'react';
import { cn } from '@/lib/utils';

type StatusKey =
  | 'open' | 'in_progress' | 'pending' | 'closed'
  | 'normal' | 'abnormal'
  | 'draft' | 'pending_manager' | 'final' | 'rejected'
  | 'baik' | 'tidak_baik';

interface StatusConfig {
  dot: string;
  text: string;
  pill: string;
  label: string;
}

const statusConfig: Record<StatusKey, StatusConfig> = {
  open:             { dot: 'bg-blue-500',   text: 'text-blue-700',   pill: 'bg-blue-100 text-blue-700 ring-blue-600/20',     label: 'Open' },
  in_progress:      { dot: 'bg-amber-500',  text: 'text-amber-700',  pill: 'bg-amber-100 text-amber-700 ring-amber-600/20',   label: 'In Progress' },
  pending:          { dot: 'bg-orange-500', text: 'text-orange-700', pill: 'bg-orange-100 text-orange-700 ring-orange-600/20', label: 'Pending' },
  closed:           { dot: 'bg-green-500',  text: 'text-green-700',  pill: 'bg-green-100 text-green-700 ring-green-600/20',   label: 'Closed' },
  normal:           { dot: 'bg-green-500',  text: 'text-green-700',  pill: 'bg-green-100 text-green-700 ring-green-600/20',   label: 'Normal' },
  abnormal:         { dot: 'bg-red-500',    text: 'text-red-700',    pill: 'bg-red-100 text-red-700 ring-red-600/20',         label: 'Abnormal' },
  draft:            { dot: 'bg-slate-400',   text: 'text-slate-600',   pill: 'bg-slate-100 text-slate-600 ring-slate-500/20',     label: 'Draft' },
  pending_manager:  { dot: 'bg-amber-500',  text: 'text-amber-700',  pill: 'bg-amber-100 text-amber-700 ring-amber-600/20',   label: 'Menunggu Persetujuan' },
  final:            { dot: 'bg-green-500',  text: 'text-green-700',  pill: 'bg-green-100 text-green-700 ring-green-600/20',   label: 'Final' },
  rejected:         { dot: 'bg-red-500',    text: 'text-red-700',    pill: 'bg-red-100 text-red-700 ring-red-600/20',         label: 'Ditolak' },
  baik:             { dot: 'bg-green-500',  text: 'text-green-700',  pill: 'bg-green-100 text-green-700 ring-green-600/20',   label: 'Baik' },
  tidak_baik:       { dot: 'bg-red-500',    text: 'text-red-700',    pill: 'bg-red-100 text-red-700 ring-red-600/20',         label: 'Tidak Baik' },
};

interface StatusBadgeProps {
  status: string;
  variant?: 'dot' | 'pill';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'dot', className }) => {
  const config = statusConfig[status as StatusKey] ?? { dot: 'bg-gray-400', text: 'text-gray-600', pill: 'bg-gray-100 text-gray-600', label: status };

  if (variant === 'pill') {
    return (
      <span className={cn('inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset w-24', config.pill, className)}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.text, className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};
