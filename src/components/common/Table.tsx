import React from 'react';
import { cn } from '@/lib/utils';

// Table Root
export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full caption-bottom text-sm min-w-[600px]', className)} {...props} />
  </div>
);

// Table Header
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
);

// Table Body
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

// Table Row
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('border-b border-gray-100 transition-colors hover:bg-gray-50/50', className)} {...props} />
);

// Table Head Cell
export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('h-10 px-3 text-left align-middle font-medium text-slate-500 text-xs uppercase tracking-wider bg-gray-50/80', className)} {...props} />
);

// Table Cell
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-3 py-3 align-middle text-sm text-slate-700', className)} {...props} />
);
