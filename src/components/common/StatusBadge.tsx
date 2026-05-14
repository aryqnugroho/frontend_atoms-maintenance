import React from 'react';
import { cn } from '@/lib/utils';

type StatusKey =
  | 'completed' | 'on_hold' | 'ongoing'
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
  completed:        { dot: 'bg-status-green-dot',  text: 'text-status-green-text',  pill: 'bg-status-green-bg text-status-green-text ring-status-green-ring',   label: 'Completed' },
  on_hold:          { dot: 'bg-status-amber-dot',  text: 'text-status-amber-text',  pill: 'bg-status-amber-bg text-status-amber-text ring-status-amber-ring',   label: 'On Hold' },
  ongoing:          { dot: 'bg-blue-500',          text: 'text-blue-700',           pill: 'bg-blue-50 text-blue-700 ring-blue-200',                            label: 'Ongoing' },
  normal:           { dot: 'bg-status-green-dot',  text: 'text-status-green-text',  pill: 'bg-status-green-bg text-status-green-text ring-status-green-ring',   label: 'Normal' },
  abnormal:         { dot: 'bg-status-red-dot',    text: 'text-status-red-text',    pill: 'bg-status-red-bg text-status-red-text ring-status-red-ring',         label: 'Abnormal' },
  draft:            { dot: 'bg-status-slate-dot',   text: 'text-status-slate-text',   pill: 'bg-status-slate-bg text-status-slate-text ring-status-slate-ring',     label: 'Draft' },
  pending_manager:  { dot: 'bg-status-amber-dot',  text: 'text-status-amber-text',  pill: 'bg-status-amber-bg text-status-amber-text ring-status-amber-ring',   label: 'Menunggu Persetujuan' },
  final:            { dot: 'bg-status-green-dot',  text: 'text-status-green-text',  pill: 'bg-status-green-bg text-status-green-text ring-status-green-ring',   label: 'Final' },
  rejected:         { dot: 'bg-status-red-dot',    text: 'text-status-red-text',    pill: 'bg-status-red-bg text-status-red-text ring-status-red-ring',         label: 'Ditolak' },
  baik:             { dot: 'bg-status-green-dot',  text: 'text-status-green-text',  pill: 'bg-status-green-bg text-status-green-text ring-status-green-ring',   label: 'Baik' },
  tidak_baik:       { dot: 'bg-status-red-dot',    text: 'text-status-red-text',    pill: 'bg-status-red-bg text-status-red-text ring-status-red-ring',         label: 'Tidak Baik' },
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
