import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-6 mb-8 ${className}`}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-400 max-w-2xl">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 flex items-center gap-3 flex-wrap">
          {action}
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between pb-4 mb-4 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
