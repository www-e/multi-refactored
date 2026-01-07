'use client';

import { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type DropdownContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

interface DropdownMenuProps {
  children: ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          contentRef.current &&
          !contentRef.current.contains(event.target as Node)
        ) {
          close();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close, triggerRef, contentRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

const DropdownMenuTrigger = ({ children, asChild = false }: DropdownMenuTriggerProps) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  // If asChild is true, we should strictly clonelement, but for safety in this codebase
  // we will wrap in button if not asChild, or just clone if we could.
  // Given the existing usage (wrapping Button in Trigger), we'll keep the button wrapper 
  // but ensure it forwards refs if possible. 
  // However, simpler is to just use a div or button that handles the click.
  
  return (
    <button
      ref={context.triggerRef}
      onClick={context.toggle}
      type="button"
      className="inline-flex items-center justify-center focus:outline-none"
    >
      {children}
    </button>
  );
};

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'end' | 'start';
}

const DropdownMenuContent = ({ children, align = 'end' }: DropdownMenuContentProps) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');
  const { isOpen, triggerRef, contentRef } = context;

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      let top = rect.bottom + scrollTop + 4; // 4px gap
      let left = rect.left + scrollLeft;

      if (align === 'end') {
        left = rect.right + scrollLeft - 192; // Assuming width 48 (12rem = 192px)
      }

      // Basic viewport check could be added here similar to ActionMenu
      // For now, valid basic positioning relative to document
      
      setPosition({ top, left });
    }
  }, [isOpen, align, triggerRef]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={contentRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999, // High z-index
      }}
      className="w-48 rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-slate-700 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="py-1" role="none">
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const DropdownMenuItem = ({ children, onClick, disabled = false }: DropdownMenuItemProps) => {
  const context = useContext(DropdownContext);
  
  return (
    <button
      onClick={(e) => {
        if (disabled) return;
        onClick?.();
        context?.close();
      }}
      disabled={disabled}
      className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 group transition-colors ${
        disabled
          ? 'text-slate-400 cursor-not-allowed'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};