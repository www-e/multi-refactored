'use client';

import { useState, useRef, ReactNode } from 'react';

interface DropdownMenuProps {
  children: ReactNode;
  align?: 'start' | 'end';
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'end';
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

const DropdownMenuTrigger = ({ children, asChild = false }: DropdownMenuTriggerProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (asChild && !asChild) {
    // This is a simplified version - in a real implementation you'd handle asChild properly
    return (
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        className="flex items-center justify-center"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      ref={triggerRef}
      onClick={toggleMenu}
      className="flex items-center justify-center"
    >
      {children}
    </button>
  );
};

const DropdownMenuContent = ({ children, align = 'end' }: DropdownMenuContentProps) => {
  // This would normally be handled with a portal and positioning logic
  // For now, we'll implement a basic version
  return (
    <div className={`absolute z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 ${align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
      <div className="py-1" role="none">
        {children}
      </div>
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, disabled = false }: DropdownMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2 text-sm ${
        disabled 
          ? 'text-gray-400 cursor-not-allowed' 
          : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
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