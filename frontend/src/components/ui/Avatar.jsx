import React from 'react';
import { resolveFileUrl } from '../../utils/url';

export const Avatar = ({ src, name = '?', size = 'md', isOnline, className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-20 h-20 text-2xl font-black',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5 border-[1px]',
    sm: 'w-2 h-2 border-[1px]',
    md: 'w-3 h-3 border-[2px]',
    lg: 'w-4 h-4 border-[2.5px]',
    xl: 'w-5 h-5 border-[3px]',
  };

  const getFallbackLetter = () => {
    return name.trim()[0]?.toUpperCase() || '?';
  };

  const getBackgroundColor = () => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-indigo-600/30 text-indigo-200 border-indigo-500/20',
      'bg-emerald-600/30 text-emerald-200 border-emerald-500/20',
      'bg-rose-600/30 text-rose-200 border-rose-500/20',
      'bg-amber-600/30 text-amber-200 border-amber-500/20',
      'bg-cyan-600/30 text-cyan-200 border-cyan-500/20',
      'bg-violet-600/30 text-violet-200 border-violet-500/20',
      'bg-pink-600/30 text-pink-200 border-pink-500/20',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src ? (
        <img
          src={resolveFileUrl(src)}
          alt={name}
          className={`${sizes[size].split(' ')[0]} ${sizes[size].split(' ')[1]} rounded-md object-cover border border-theme-border`}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-md border flex items-center justify-center select-none ${getBackgroundColor()}`}
        >
          {getFallbackLetter()}
        </div>
      )}

      {isOnline !== undefined && (
        <div
          className={`absolute -bottom-1 -right-1 ${statusSizes[size]} rounded-full border-theme-bg ${
            isOnline ? 'bg-theme-success' : 'bg-theme-muted'
          }`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
