import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Lucide icon component to display */
  icon: React.FC<{ size?: number; className?: string }>;
  /** Icon background color class, e.g. 'bg-sky-100' */
  iconBg?: string;
  /** Icon foreground color class, e.g. 'text-sky-600' */
  iconColor?: string;
  /** Primary page title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional right-side slot for actions (buttons, filters, etc.) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized page header used on all index pages.
 *
 * Structure:
 *   [IconBadge]  [Title]         [Actions (optional)]
 *                [Subtitle]
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  iconBg = 'bg-slate-100',
  iconColor = 'text-slate-600',
  title,
  subtitle,
  actions,
  className,
}) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3', className)}>
    <div className="flex items-center gap-3">
      {/* Icon badge */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>
      {/* Text */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {/* Actions slot */}
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
