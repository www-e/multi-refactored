import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ChangeIndicatorProps {
  change: number;
}

export function ChangeIndicator({ change }: ChangeIndicatorProps) {
  if (change === 0) return null;

  const isPositive = change > 0;
  const colorClass = isPositive ? 'text-success' : 'text-destructive';
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={`flex items-center text-sm font-medium ${colorClass}`}>
      <Icon className="w-4 h-4" />
      <span className="mr-1">
        {isPositive ? '+' : ''}
        {change}%
      </span>
    </div>
  );
}