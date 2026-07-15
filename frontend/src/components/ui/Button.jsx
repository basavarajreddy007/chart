import React, { forwardRef } from 'react';

export const Button = forwardRef(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-theme-accent hover:bg-theme-accent-hover text-white focus-visible:ring-theme-accent shadow-subtle',
      secondary: 'bg-theme-card hover:bg-theme-card-hover text-theme-text border border-theme-border focus-visible:ring-theme-border',
      outline: 'bg-transparent border border-theme-border hover:bg-theme-card text-theme-text hover:border-theme-border-hover focus-visible:ring-theme-accent',
      ghost: 'bg-transparent hover:bg-theme-card text-theme-muted hover:text-theme-text focus-visible:ring-theme-accent',
      danger: 'bg-theme-error hover:bg-theme-error/90 text-white focus-visible:ring-theme-error shadow-subtle',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
