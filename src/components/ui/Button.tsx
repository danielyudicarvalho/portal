import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95';
    
    const variants = {
      primary: 'bg-gaming-accent hover:bg-gaming-accent/90 text-white focus:ring-gaming-accent/50 shadow-lg hover:shadow-gaming-accent/25',
      secondary: 'bg-gaming-secondary hover:bg-gaming-secondary/90 text-white focus:ring-gaming-secondary/50 shadow-lg hover:shadow-gaming-secondary/25',
      outline: 'border-2 border-gaming-accent text-gaming-accent hover:bg-gaming-accent hover:text-white focus:ring-gaming-accent/50 hover:shadow-lg hover:shadow-gaming-accent/25',
      ghost: 'text-gaming-accent hover:bg-gaming-accent/10 focus:ring-gaming-accent/50',
      danger: 'bg-gaming-danger hover:bg-gaming-danger/90 text-white focus:ring-gaming-danger/50 shadow-lg hover:shadow-gaming-danger/25'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2.5 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]'
    };

    return (
      <button
        className={clsx(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;