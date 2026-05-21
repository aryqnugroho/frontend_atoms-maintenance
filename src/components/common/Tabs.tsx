import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultKey, onChange, className }) => {
  const [activeKey, setActiveKey] = useState(defaultKey || items[0]?.key || '');

  const handleClick = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  return (
    // min-w-0 + overflow-x-auto: when the tab list is wider than the parent
    // (e.g. ATC SYSTEM has 12 long-named sections), tabs scroll horizontally
    // INSIDE this container instead of pushing the whole page wider — which
    // previously caused the topbar and tables on detail pages to look offset.
    <div className={cn('border-b border-gray-200 min-w-0', className)}>
      <nav className="flex gap-x-1 -mb-px overflow-x-auto" aria-label="Tabs">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => handleClick(item.key)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeKey === item.key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
