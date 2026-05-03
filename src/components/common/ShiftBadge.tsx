import React from 'react';
import { cn } from '@/lib/utils';
import type { ShiftType } from '@/types';

const shiftStyles: Record<ShiftType, { bg: string; label: string }> = {
  pagi:   { bg: 'bg-amber-100 text-amber-800 ring-amber-600/20',     label: 'Pagi' },
  siang:  { bg: 'bg-blue-100 text-blue-800 ring-blue-600/20',       label: 'Siang' },
  malam:  { bg: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20', label: 'Malam' },
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
