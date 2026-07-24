import { ReactNode } from 'react';
import { Card, CardContent } from './Card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed border-zinc-800 bg-zinc-900/10 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center text-center p-12">
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4 shadow-inner">
            {icon}
          </div>
        )}
        <h3 className="text-base font-semibold text-zinc-200 tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm leading-relaxed">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}
