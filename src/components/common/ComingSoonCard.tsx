import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComingSoonCardProps {
  title: string;
  location?: string;
  description?: string;
  icon?: string;
  className?: string;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({ title, location, description, icon, className }) => {
  return (
    <div className={cn(
      'rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-90 cursor-not-allowed select-none transition-all',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1">
          {icon && <span className="text-2xl">{icon}</span>}
          <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
          {location && (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={12} />
              {location}
            </p>
          )}
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          <Clock size={12} />
          Coming Soon
        </span>
      </div>
    </div>
  );
};
