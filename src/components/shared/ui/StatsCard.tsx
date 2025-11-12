import { Card } from './Card';
import { ChangeIndicator } from './ChangeIndicator';
import { IStatsCard } from './types';

export function StatsCard({
  icon: Icon,
  iconBgColor,
  label,
  value,
  change,
  period,
}: IStatsCard) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {value}
          </p>
          <div className="flex items-center mt-2">
            <ChangeIndicator change={change} />
            <span className="text-xs text-slate-500 mr-2">{period}</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}