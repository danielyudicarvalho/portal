import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gaming' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'default', 
  padding = 'md',
  hover = false,
  onClick
}) => {
  const baseClasses = 'rounded-lg transition-all duration-200';
  
  const variants = {
    default: 'bg-white dark:bg-gaming-dark border border-gray-200 dark:border-gray-700 shadow-sm',
    gaming: 'bg-gradient-to-br from-gaming-dark to-gaming-darker border border-gaming-accent/20 shadow-lg',
    elevated: 'bg-white dark:bg-gaming-dark shadow-xl border border-gray-200 dark:border-gray-700'
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg hover-desktop cursor-pointer touch-manipulation active:scale-[0.98]' : '';

  return (
    <div 
      className={clsx(
        baseClasses,
        variants[variant],
        paddings[padding],
        hoverClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={clsx('mb-4', className)}>
    {children}
  </div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)}>
    {children}
  </h3>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={clsx('text-gray-600 dark:text-gray-300', className)}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={clsx('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)}>
    {children}
  </div>
);

export default Card;
export { CardHeader, CardTitle, CardContent, CardFooter };