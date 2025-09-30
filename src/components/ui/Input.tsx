import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const inputClasses = clsx(
      'w-full px-3 py-2.5 bg-white dark:bg-gaming-darker border rounded-lg transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-gaming-accent/50 focus:border-gaming-accent',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      'text-gray-900 dark:text-white',
      'min-h-[44px] touch-manipulation',
      'text-base', // Prevent zoom on iOS
      error 
        ? 'border-gaming-danger focus:ring-gaming-danger/50 focus:border-gaming-danger' 
        : 'border-gray-300 dark:border-gray-600',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      props.disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400 dark:text-gray-500">
                {leftIcon}
              </div>
            </div>
          )}
          <input
            className={inputClasses}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="text-gray-400 dark:text-gray-500">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-gaming-danger">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;