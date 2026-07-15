import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 4000 }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title) => {
      toast({ type: 'success', title, message });
    },
    [toast]
  );

  const error = useCallback(
    (message, title) => {
      toast({ type: 'error', title, message });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {/* Toast Portal Container */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastCard = ({ toast, onClose }) => {
  const titleId = useId();
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-theme-success" />,
    error: <AlertCircle className="w-5 h-5 text-theme-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-theme-warning" />,
    info: <Info className="w-5 h-5 text-theme-accent" />,
  };

  const borders = {
    success: 'border-theme-success/30',
    error: 'border-theme-error/30',
    warning: 'border-theme-warning/30',
    info: 'border-theme-border',
  };

  return (
    <div
      role="alert"
      aria-labelledby={titleId}
      className={`w-full flex items-start gap-3 p-4 bg-theme-card border rounded-lg shadow-popover animate-in slide-in-from-bottom-5 duration-200 ${borders[toast.type]}`}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 text-left">
        {toast.title && (
          <h4 id={titleId} className="text-xs font-bold text-theme-text uppercase tracking-wider">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-theme-text/95 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 text-theme-muted hover:text-theme-text p-0.5 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
