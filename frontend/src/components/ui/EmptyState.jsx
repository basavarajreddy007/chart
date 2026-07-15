import React from 'react';
import { Lock } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between text-center p-8 bg-theme-bg/10 relative overflow-hidden select-none whatsapp-bg">
      {/* Spacer to align center */}
      <div />

      {/* Main Content Area */}
      <div className="flex flex-col items-center max-w-md space-y-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Large Premium Communication Illustration */}
        <div className="relative flex items-center justify-center w-64 h-48">
          <svg
            viewBox="0 0 200 150"
            className="w-full h-full text-theme-accent/20 drop-shadow-[0_8px_24px_rgba(0,168,132,0.1)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Background connection waves */}
            <path d="M100,55 A55,55 0 0,1 155,110" strokeDasharray="3 3" className="text-theme-muted/30" />
            <path d="M45,110 A55,55 0 0,1 100,55" strokeDasharray="3 3" className="text-theme-muted/30" />
            
            {/* Desktop / Computer representation */}
            <rect x="50" y="30" width="100" height="65" rx="4" fill="var(--theme-card)" stroke="var(--theme-border)" strokeWidth="2" />
            <line x1="80" y1="95" x2="120" y2="95" stroke="var(--theme-border)" strokeWidth="3" />
            <line x1="90" y1="95" x2="90" y2="105" stroke="var(--theme-border)" strokeWidth="3" />
            <line x1="110" y1="95" x2="110" y2="105" stroke="var(--theme-border)" strokeWidth="3" />
            <line x1="75" y1="105" x2="125" y2="105" stroke="var(--theme-border)" strokeWidth="2" />
            
            {/* Laptop screen divider */}
            <line x1="50" y1="85" x2="150" y2="85" stroke="var(--theme-border)" />
            
            {/* Phone representation overlapping the laptop */}
            <rect x="135" y="70" width="30" height="55" rx="5" fill="var(--theme-card)" stroke="var(--theme-accent)" strokeWidth="2" />
            {/* Phone speaker/camera and button */}
            <line x1="145" y1="75" x2="155" y2="75" stroke="var(--theme-border)" strokeWidth="1.5" />
            <circle cx="150" cy="118" r="1.5" fill="var(--theme-accent)" />
            
            {/* Chat bubble indicators on screen */}
            <rect x="65" y="45" width="45" height="12" rx="3" fill="var(--theme-accent)" opacity="0.15" />
            <rect x="90" y="62" width="45" height="12" rx="3" fill="var(--theme-muted)" opacity="0.15" />
            <circle cx="143" cy="85" r="2" fill="var(--theme-accent)" />
            <circle cx="157" cy="95" r="2" fill="var(--theme-muted)" />
          </svg>
          
          {/* Decorative glowing green light dot */}
          <div className="absolute top-[85px] right-[55px] w-3 h-3 bg-theme-accent rounded-full animate-ping opacity-75" />
          <div className="absolute top-[85px] right-[55px] w-3 h-3 bg-theme-accent rounded-full border-2 border-theme-bg" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-light text-theme-text tracking-wide">
            ChatApp Web
          </h2>
          <p className="text-xs text-theme-muted leading-relaxed font-normal px-4">
            Send and receive messages without keeping your phone online.
            <br />
            Use ChatApp on up to 4 companion devices and one phone simultaneously.
          </p>
        </div>
      </div>

      {/* Footer Encryption Label */}
      <div className="flex items-center gap-1.5 text-[10px] text-theme-muted font-normal z-10 pb-4 select-none">
        <Lock className="w-3 h-3" /> End-to-end encrypted
      </div>
    </div>
  );
};

export default EmptyState;
