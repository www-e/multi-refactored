'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, PhoneCall, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
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

  // Determine menu position classes
  const positionClass = position === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="قائمة الإجراءات"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${positionClass} origin-top`}
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
      )}
    </div>
  );
}