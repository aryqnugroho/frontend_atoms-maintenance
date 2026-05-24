import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cnsd' | 'tfp' | 'success' | 'warning' | 'danger' | 'muted' | 'shift' | 'personal' | 'gm';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  cnsd:    'bg-sky-100 text-sky-800 ring-sky-600/20',
  tfp:     'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  success: 'bg-green-100 text-green-700 ring-green-600/20',
  warning: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  danger:  'bg-red-100 text-red-700 ring-red-600/20',
  muted:   'bg-gray-100 text-gray-500 ring-gray-300/20',
  shift:   'bg-blue-100 text-blue-700 ring-blue-600/20',
  personal: 'bg-purple-100 text-purple-700 ring-purple-600/20',
  gm:      'bg-rose-100 text-rose-700 ring-rose-600/20',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', variantStyles[variant], className)}>
      {children}
    </span>
  );
};
