import React from 'react';
import { cn } from '@/lib/utils';
import type { ShiftType } from '@/types';

const shiftStyles: Record<ShiftType, { bg: string; label: string }> = {
  pagi:   { bg: 'bg-status-amber-bg text-status-amber-text ring-status-amber-ring',     label: 'Pagi' },
  siang:  { bg: 'bg-status-blue-bg text-status-blue-text ring-status-blue-ring',       label: 'Siang' },
  malam:  { bg: 'bg-status-indigo-bg text-status-indigo-text ring-status-indigo-ring', label: 'Malam' },
};

interface ShiftBadgeProps {
  shift: ShiftType;
  className?: string;
}

export const ShiftBadge: React.FC<ShiftBadgeProps> = ({ shift, className }) => {
  const config = shiftStyles[shift];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', config.bg, className)}>
      {config.label}
    </span>
  );
};
