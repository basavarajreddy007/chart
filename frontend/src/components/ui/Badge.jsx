import React from 'react';

export const Badge = ({ className = '', variant = 'neutral', children, ...props }) => {
  const baseStyle =
    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider select-none border';

  const variants = {
    neutral: 'bg-theme-bg text-theme-muted border-theme-border',
    primary: 'bg-theme-accent/10 text-theme-accent border-theme-accent/25',
    success: 'bg-theme-success/10 text-theme-success border-theme-success/25',
    warning: 'bg-theme-warning/10 text-theme-warning border-theme-warning/25',
    error: 'bg-theme-error/10 text-theme-error border-theme-error/25',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
