import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement;
      // Focus modal container
      modalRef.current?.focus();
      
      // Disable body scroll
      document.body.style.overflow = 'hidden';

      // Focus trap setup
      const handleTab = (e) => {
        if (e.key !== 'Tab' || !modalRef.current) return;
        
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        } else {
          handleTab(e);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        // Restore focus on close
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Body */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={`w-full ${sizes[size]} bg-theme-card border border-theme-border rounded-lg shadow-popover relative z-10 flex flex-col focus:outline-none animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between">
          {title && (
            <h2 id="modal-title" className="text-sm font-semibold tracking-wide text-theme-text">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-card-hover transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh] text-left text-sm leading-relaxed text-theme-text/90">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
