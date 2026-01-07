'use client';

import { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
          <MoreVertical size={16} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={position === 'left' ? 'start' : 'end'}>
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <span className={action.color || 'text-slate-600 dark:text-slate-400'}>
              {action.icon}
            </span>
            <span>{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
