import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileVideo,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

interface LogEntry {
  id: string;
  status: string;
  videoName: string;
  caption: string | null;
  scheduledAt: string;
  publishedAt: string | null;
  instagramMediaId: string | null;
  errorLog: string | null;
  retries: number;
  updatedAt: string;
}

const STATUS_FILTERS = ['all', 'PUBLISHED', 'FAILED', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PUBLISHED: { label: 'Published', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', icon: XCircle },
  PENDING: { label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
  PROCESSING: { label: 'Processing', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Loader2 },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function UploadLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLogs = useCallback(async () => {
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const data = await api.get(`/api/v1/dashboard/logs?limit=50${statusParam}`);
      setLogs(data?.logs || []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  const handleRetry = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      await api.post(`/api/v1/scheduler/jobs/${jobId}/retry`);
      showToast('success', 'Job queued for retry.');
      await fetchLogs();
    } catch (err: any) {
      showToast('error', err.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const filteredLogs = logs.filter(l =>
    l.videoName.toLowerCase().includes(search.toLowerCase()) ||
    (l.caption || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 p-4 rounded-xl border shadow-xl z-50 flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'success' ? 'bg-zinc-900 border-emerald-500/30 text-zinc-100' : 'bg-zinc-900 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Publishing Logs</h1>
          <p className="text-xs text-zinc-500 mt-1">Complete history of all publishing attempts, failures, and retries.</p>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          {total} total entries
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-zinc-900/30 border border-zinc-900 px-3 py-2 rounded-xl text-zinc-400 flex-1">
          <Search className="h-4 w-4 text-zinc-600 shrink-0" />
          <input
            type="text"
            placeholder="Search by filename or caption..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-zinc-200 outline-none w-full placeholder-zinc-600"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                filter === f
                  ? 'bg-zinc-50 border-zinc-50 text-zinc-950'
                  : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900/20 border border-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 border border-zinc-900 rounded-xl bg-zinc-900/5">
          <FileVideo className="h-8 w-8 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-400">No logs found</p>
          <p className="text-xs text-zinc-600">
            {filter !== 'all' ? `No ${filter.toLowerCase()} jobs yet.` : 'Schedule and publish your first reel to see logs here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;
            const Icon = cfg.icon;
            const isExpanded = expandedId === log.id;

            return (
              <motion.div
                key={log.id}
                layout
                className="border border-zinc-900 hover:border-zinc-800 rounded-xl bg-zinc-900/10 overflow-hidden transition-all"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${cfg.color.split(' ')[0]} ${log.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-zinc-200 truncate max-w-[300px]">{log.videoName}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Scheduled: {formatDate(log.scheduledAt)}
                        {log.publishedAt && ` · Published: ${formatDate(log.publishedAt)}`}
                        {log.retries > 0 && ` · ${log.retries} retries`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {log.status === 'FAILED' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRetry(log.id); }}
                        disabled={retryingId === log.id}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                        title="Retry"
                      >
                        {retryingId === log.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                      </button>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-zinc-900"
                    >
                      <div className="p-4 space-y-3 bg-zinc-950/30">
                        {log.caption && (
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Caption</span>
                            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{log.caption}</p>
                          </div>
                        )}
                        {log.instagramMediaId && (
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Instagram Media ID</span>
                            <code className="text-[11px] text-emerald-400 font-mono">{log.instagramMediaId}</code>
                          </div>
                        )}
                        {log.errorLog && (
                          <div>
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Error Details</span>
                            <pre className="text-[11px] text-rose-400/80 font-mono bg-rose-950/20 border border-rose-500/10 rounded-lg p-3 whitespace-pre-wrap break-all">{log.errorLog}</pre>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono pt-2 border-t border-zinc-900">
                          <span>Job ID: {log.id}</span>
                          <span>Updated: {formatDate(log.updatedAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
