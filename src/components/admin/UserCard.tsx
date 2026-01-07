import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import ActionMenu from '@/components/shared/ui/ActionMenu';
import { formatDate } from '@/lib/utils';
import { User } from '@/lib/apiClient';
import { User as UserIcon, Mail, KeyRound, BadgeCheck, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const actions = [
    {
      label: 'تعديل',
      icon: <Edit size={16} />,
      onClick: () => onEdit(user),
      color: 'text-slate-600 dark:text-slate-400'
    },
    {
      label: 'حذف',
      icon: <Trash2 size={16} />,
      onClick: () => onDelete(user),
      color: 'text-destructive'
    }
  ];

  return (
    <Card className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 text-slate-400 ml-2" />
            <span className="font-medium">{user.name}</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">#{user.id.substring(0, 8)}</span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">البريد:</span>
            </div>
            <p className="text-slate-900 dark:text-slate-100">{user.email}</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck size={14} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">الدور:</span>
            </div>
            <div className="mt-1">
              <StatusBadge
                status={user.role === 'admin' ? 'AI' : 'Human'}
                type="pill"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <KeyRound size={14} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">الحالة:</span>
            </div>
            <div className="mt-1">
              <StatusBadge
                status={user.is_active ? 'confirmed' : 'canceled'}
                type="pill"
              />
            </div>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400">تاريخ الإنشاء:</span>
            <p className="text-slate-900 dark:text-slate-100">{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <StatusBadge
              status={user.role === 'admin' ? 'AI' : 'Human'}
              type="pill"
            />
          </div>
          <ActionMenu
            position="left"
            actions={actions}
          />
        </div>
      </div>
    </Card>
  );
}