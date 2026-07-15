import React from 'react';

export const Tabs = ({ items, activeTab, onChange, className = '' }) => {
  return (
    <div
      role="tablist"
      aria-label="Settings Options"
      className={`flex items-center gap-1 border-b border-theme-border pb-1 ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.id}`}
            id={`tab-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-[5px] transition-all duration-150 focus:outline-none ${
              isActive
                ? 'border-theme-accent text-theme-text font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-text hover:border-theme-border-hover'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
