interface StatusBadgeProps {
  status:
    | 'active'
    | 'inactive'
    | 'success'
    | 'warning'
    | 'error'
    | 'pending'
    | 'scheduled'
    | 'published'
    | 'failed'
    | 'draft'
    | 'ready'
    | 'publishing'
    | 'Draft'
    | 'Ready'
    | 'Scheduled'
    | 'Publishing'
    | 'Published'
    | 'Failed';
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as
    | 'active'
    | 'inactive'
    | 'success'
    | 'warning'
    | 'error'
    | 'pending'
    | 'scheduled'
    | 'published'
    | 'failed'
    | 'draft'
    | 'ready'
    | 'publishing';

  const configs = {
    active: {
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
      text: 'Active',
    },
    success: {
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
      text: 'Connected',
    },
    published: {
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
      text: 'Published',
    },
    scheduled: {
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      dot: 'bg-indigo-400',
      text: 'Scheduled',
    },
    ready: {
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      dot: 'bg-blue-450',
      text: 'Ready',
    },
    pending: {
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
      text: 'Pending',
    },
    publishing: {
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400 animate-ping',
      text: 'Publishing',
    },
    warning: {
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
      text: 'Warning',
    },
    error: {
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
      text: 'Error',
    },
    failed: {
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
      text: 'Failed',
    },
    inactive: {
      color: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50',
      dot: 'bg-zinc-500',
      text: 'Disconnected',
    },
    draft: {
      color: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50',
      dot: 'bg-zinc-500',
      text: 'Draft',
    },
  };

  const config = configs[normalizedStatus] || configs.inactive;
  const badgeLabel = label || config.text;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span className="whitespace-nowrap">{badgeLabel}</span>
    </span>
  );
}
