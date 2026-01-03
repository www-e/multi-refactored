'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, PhoneCall, Eye, Edit, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ActionItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface ActionMenuProps {
  actions: ActionItem[];
  position?: 'left' | 'right';
}

export default function ActionMenu({ actions, position = 'right' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate dropdown position to avoid being clipped by parent containers
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return { top: 0, left: 0, right: 'auto' };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const positionClass = position === 'left' ? 'left' : 'right';

    // Calculate position relative to viewport
    let top = buttonRect.bottom + window.scrollY + 8; // 8px offset from button
    let left = positionClass === 'left' ? buttonRect.left + window.scrollX : 'auto';
    let right = positionClass === 'right' ? window.innerWidth - buttonRect.right + window.scrollX : 'auto';

    // Ensure the dropdown doesn't go off-screen
    const dropdownWidth = 192; // 48 * 4px (w-48)
    const dropdownHeight = actions.length * 40 + 32; // Approximate height of dropdown

    // Adjust for viewport boundaries
    if (positionClass === 'right') {
      const adjustedRight = window.scrollX + (window.innerWidth - buttonRect.right);
      if (adjustedRight + dropdownWidth > window.innerWidth) {
        // If it would go off the right edge, position to the left of the button
        left = buttonRect.left + window.scrollX - dropdownWidth;
        right = 'auto';
      }
    } else {
      // If it would go off the left edge
      if (buttonRect.left - dropdownWidth < 0) {
        left = buttonRect.left + window.scrollX;
        right = 'auto';
      }
    }

    // Adjust top position if dropdown would go off the bottom of the screen
    if (buttonRect.bottom + dropdownHeight > window.innerHeight) {
      top = buttonRect.top + window.scrollY - dropdownHeight - 8;
    }

    return { top, left, right };
  }, [actions.length, position]);

  const { top, left, right } = calculatePosition();

  // Render dropdown in portal to escape parent overflow containers
  const dropdown = isOpen ? (
    <div
      ref={menuRef}
      className="fixed z-[60] w-48 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 origin-top"
      style={{
        top: `${top}px`,
        left: left !== 'auto' ? `${left}px` : 'auto',
        right: right !== 'auto' ? `${right}px` : 'auto',
      }}
    >
      <ul className="py-1">
        {actions.map((action, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => {
                action.onClick();
                setIsOpen(false); // Close menu after clicking
              }}
              disabled={action.disabled}
              className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                action.disabled
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className={action.color || 'text-slate-600 dark:text-slate-400'}>
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="قائمة الإجراءات"
      >
        <MoreVertical size={16} />
      </button>

      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}