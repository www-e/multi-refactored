import { LucideIcon } from 'lucide-react';
import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary';
}

export function ActionButton({
  icon: Icon,
  label,
  variant = 'primary',
  ...props
}: ActionButtonProps) {
  const baseClasses = 'flex items-center space-x-2 space-x-reverse px-4 py-3 rounded-xl transition-all duration-200';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}