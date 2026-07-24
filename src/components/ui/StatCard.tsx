import { ReactNode } from 'react';
import { Card, CardContent } from './Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeType = 'neutral',
  description,
  className = '',
}: StatCardProps) {
  const trendColors = {
    increase: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    decrease: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/30',
  };

  const TrendIcon = {
    increase: ArrowUpRight,
    decrease: ArrowDownRight,
    neutral: Minus,
  }[changeType];

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-400 tracking-tight">{label}</p>
          {icon && (
            <div className="p-2 bg-zinc-800/40 rounded-lg text-zinc-300 border border-zinc-800/50">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-zinc-50">{value}</span>
          
          {change && (
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border ${trendColors[changeType]}`}>
              <TrendIcon className="h-3 w-3" />
              {change}
            </span>
          )}
        </div>

        {(description || change) && (
          <p className="mt-1 text-xs text-zinc-500">
            {description || (changeType === 'increase' ? 'Up' : changeType === 'decrease' ? 'Down' : 'Stable') + ' from last month'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
