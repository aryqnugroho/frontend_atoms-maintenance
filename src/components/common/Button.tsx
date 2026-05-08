import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';



interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary',
      secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90 focus-visible:ring-brand-secondary',
      outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-slate-900 focus-visible:ring-brand-primary',
      ghost: 'hover:bg-gray-100 hover:text-slate-900 text-slate-700 focus-visible:ring-brand-primary',
      danger: 'bg-maintenance-abnormal text-white hover:bg-maintenance-abnormal/90 focus-visible:ring-maintenance-abnormal',
    };
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
