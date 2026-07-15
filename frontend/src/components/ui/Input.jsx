import React, { forwardRef, useId } from 'react';

export const Input = forwardRef(
  ({ className = '', label, error, helperText, icon, type = 'text', ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-theme-muted"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-theme-muted pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`w-full bg-theme-bg border rounded-md py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-text placeholder:text-theme-muted/50 ${
              icon ? 'pl-11 pr-4' : 'px-4'
            } ${
              error ? 'border-theme-error focus:border-theme-error focus:ring-theme-error' : 'border-theme-border'
            } ${className}`}
            aria-invalid={!!error}
            aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-theme-error font-medium" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-theme-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
