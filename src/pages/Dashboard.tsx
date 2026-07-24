import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Instagram,
  HardDrive,
  Cpu,
  Clock,
  Calendar,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FolderSync,
  Play,
  XCircle,
  RotateCcw,
  Loader2,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

interface DashboardStats {
  jobs: { pending: number; processing: number; published: number; failed: number; cancelled: number; paused: number };
  drive: { total: number; paired: number; unpaired: number };
  connections: {
    instagram: boolean;
    instagramUsername: string | null;
    google: boolean;
    googleEmail: string | null;
    driveFolder: string | null;
    driveFolderId: string | null;
    lastSyncAt: string | null;
  };
  workers: { syncRunning: boolean; schedulerRunning: boolean };
}

interface QueueJob {
  id: string;
  status: string;
  scheduledAt: string;
  timezone: string;
  videoName: string;
  caption: string | null;
  retries: number;
  errorLog: string | null;
}

interface ActivityEvent {
  id: string;
  type: string;
  videoName: string;
  scheduledAt: string;
  publishedAt: string | null;
  updatedAt: string;
  instagramMediaId: string | null;
  errorLog: string | null;
  retries: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PROCESSING: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  PUBLISHED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  FAILED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  CANCELLED: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  PAUSED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const DOT_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  PROCESSING: 'bg-blue-400 animate-pulse',
  PUBLISHED: 'bg-emerald-500',
  FAILED: 'bg-rose-500',
  CANCELLED: 'bg-zinc-500',
  PAUSED: 'bg-orange-500',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 h-[120px] animate-pulse">
      <div className="h-3 w-24 bg-zinc-800 rounded mb-3" />
      <div className="h-5 w-32 bg-zinc-800 rounded mb-4" />
      <div className="h-3 w-16 bg-zinc-800 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<QueueJob[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, queueData, activityData] = await Promise.all([
        api.get('/api/v1/dashboard/stats'),
        api.get('/api/v1/dashboard/queue?limit=10'),
        api.get('/api/v1/dashboard/activity?limit=20'),
      ]);
      setStats(statsData);
      setQueue(queueData?.jobs || []);
      setActivity(activityData?.events || []);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await api.post('/api/v1/google-drive/sync/wait');
      showToast('success', 'Drive sync completed. New files detected and paired.');
      await fetchAll();
    } catch (err: any) {
      showToast('error', err.message || 'Drive sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      await api.post(`/api/v1/scheduler/jobs/${jobId}/retry`);
      showToast('success', 'Job queued for retry.');
      await fetchAll();
    } catch (err: any) {
      showToast('error', err.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await api.delete(`/api/v1/scheduler/jobs/${jobId}`);
      showToast('success', 'Job cancelled.');
      await fetchAll();
    } catch (err: any) {
      showToast('error', err.message || 'Cancel failed.');
    }
  };

  const nextJob = queue[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="dashboard-page-root">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 p-4 rounded-xl border shadow-xl z-50 flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-zinc-900 border-emerald-500/30 text-zinc-100'
                : 'bg-zinc-900 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              : <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            }
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Creator Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">Live status of your Drive sync, publishing queue, and automation pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Worker status indicators */}
          {stats && (
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${stats.workers.schedulerRunning ? 'border-emerald-500/20 text-emerald-400' : 'border-zinc-800 text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stats.workers.schedulerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                Scheduler
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${stats.workers.syncRunning ? 'border-blue-500/20 text-blue-400' : 'border-zinc-800 text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stats.workers.syncRunning ? 'bg-blue-400 animate-pulse' : 'bg-zinc-600'}`} />
                Sync
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            isLoading={isSyncing}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            className="text-xs font-semibold h-9"
          >
            Force Sync Drive
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* Instagram */}
            <Card className="border-zinc-900 bg-zinc-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-[120px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Instagram Channel</span>
                    <h4 className="text-sm font-bold text-zinc-200 mt-1 truncate max-w-[120px]">
                      {stats?.connections.instagram ? `@${stats.connections.instagramUsername}` : 'No Channel Linked'}
                    </h4>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats?.connections.instagram ? 'bg-[#E1306C]/10 border-[#E1306C]/20 text-[#E1306C]' : 'bg-zinc-950 border-zinc-900 text-zinc-600'}`}>
                    <Instagram className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${stats?.connections.instagram ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                    {stats?.connections.instagram ? 'Linked' : 'Disconnected'}
                  </span>
                  <Link to="/settings" className="text-zinc-400 hover:text-zinc-200 font-semibold hover:underline underline-offset-4">
                    {stats?.connections.instagram ? 'Manage' : 'Connect'}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Google Drive */}
            <Card className="border-zinc-900 bg-zinc-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-[120px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Google Drive Source</span>
                    <h4 className="text-sm font-bold text-zinc-200 mt-1 truncate max-w-[150px]">
                      {stats?.connections.driveFolder || 'Not Configured'}
                    </h4>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats?.connections.google ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-950 border-zinc-900 text-zinc-600'}`}>
                    <HardDrive className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${stats?.connections.google ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                    {stats?.connections.google ? 'Connected' : 'Disconnected'}
                  </span>
                  <Link to="/settings" className="text-zinc-400 hover:text-zinc-200 font-semibold hover:underline underline-offset-4">
                    {stats?.connections.google ? 'Configure' : 'Connect'}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Autopilot Daemon */}
            <Card className="border-zinc-900 bg-zinc-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-[120px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Autopilot Daemon</span>
                    <h4 className="text-sm font-bold text-zinc-200 mt-1">
                      {stats?.drive.paired || 0} Paired Reels
                    </h4>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats?.workers.syncRunning ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-950 border-zinc-900 text-zinc-600'}`}>
                    <Cpu className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                  <span className="text-zinc-500 font-mono">
                    {stats?.connections.lastSyncAt ? formatRelativeTime(stats.connections.lastSyncAt) : 'Not synced'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Next Publish */}
            <Card className="border-zinc-900 bg-zinc-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-[120px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Next Publish</span>
                    <h4 className="text-xs font-bold text-zinc-200 mt-1 truncate max-w-[130px] font-mono" title={nextJob?.videoName}>
                      {nextJob ? nextJob.videoName : 'No pending jobs'}
                    </h4>
                  </div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-300">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  {nextJob ? (
                    <>
                      <span className="text-zinc-300 font-bold flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-zinc-500" />
                        {formatDateTime(nextJob.scheduledAt)}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[nextJob.status]}`}>
                        {nextJob.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-500">Add files to Drive folder</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Publication Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl animate-pulse">
                <div className="h-3 w-20 bg-zinc-800 rounded mb-3" />
                <div className="h-8 w-12 bg-zinc-800 rounded" />
              </div>
            ))
          ) : (
            <>
              <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1.5 hover:border-zinc-800 transition-all">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Scheduled</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-zinc-100">{stats?.jobs.pending || 0}</span>
                  <span className="text-[10px] text-zinc-500">pending</span>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1.5 hover:border-zinc-800 transition-all">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Published</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-emerald-400">{stats?.jobs.published || 0}</span>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1.5 hover:border-zinc-800 transition-all">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Drive Files</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-blue-400">{stats?.drive.paired || 0}</span>
                  <span className="text-[10px] text-zinc-500">paired</span>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1.5 hover:border-zinc-800 transition-all">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Failed</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-rose-400">{stats?.jobs.failed || 0}</span>
                  <span className="text-[10px] text-rose-500 font-semibold">errors</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Queue + Activity */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Publishing Queue */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Publishing Queue</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Upcoming scheduled and pending reels from your synced Drive folder.</p>
            </div>
            <Link to="/logs" className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold flex items-center gap-1 transition-colors">
              All logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900/20 border border-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 border border-zinc-900 rounded-xl bg-zinc-900/5">
              <FolderSync className="h-8 w-8 text-zinc-700" />
              <p className="text-sm font-semibold text-zinc-400">No pending jobs</p>
              <p className="text-xs text-zinc-600 max-w-xs">Connect Google Drive, select a folder with MP4 + TXT pairs, then schedule your first reel.</p>
              {!stats?.connections.google ? (
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="text-xs mt-2">Connect Google Drive</Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" onClick={handleForceSync} isLoading={isSyncing} className="text-xs mt-2">
                  Sync Drive Now
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-900/10 group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[job.status]}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-zinc-200 truncate max-w-[260px]">{job.videoName}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(job.scheduledAt)}
                        {job.retries > 0 && <span className="text-orange-400">· retry {job.retries}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingId === job.id}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                        title="Retry job"
                      >
                        {retryingId === job.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <RotateCcw className="h-3 w-3" />
                        }
                      </button>
                    )}
                    {(job.status === 'PENDING' || job.status === 'PAUSED') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                        title="Cancel job"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Automation Timeline</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Chronological background daemon events.</p>
          </div>

          <Card className="border-zinc-900/60 bg-zinc-900/10">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-zinc-800 shrink-0 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 bg-zinc-800 rounded" />
                        <div className="h-3 w-full bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <Activity className="h-6 w-6 text-zinc-700" />
                  <p className="text-xs text-zinc-500">No activity yet</p>
                  <p className="text-[11px] text-zinc-600">Events will appear here as reels are published.</p>
                </div>
              ) : (
                <div className="relative border-l border-zinc-900 pl-4 space-y-5 ml-1">
                  {activity.slice(0, 8).map((event) => (
                    <div key={event.id} className="relative">
                      <div className={`absolute -left-[21px] top-0.5 w-2 h-2 rounded-full ring-4 ${
                        event.type === 'PUBLISHED' ? 'bg-emerald-500 ring-emerald-950' :
                        event.type === 'FAILED' ? 'bg-rose-500 ring-rose-950' :
                        event.type === 'PROCESSING' ? 'bg-blue-400 ring-blue-950' :
                        'bg-zinc-600 ring-zinc-950'
                      }`} />
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-bold ${event.type === 'FAILED' ? 'text-rose-400' : 'text-zinc-300'}`}>
                            {event.type === 'PUBLISHED' ? 'Successfully Published' :
                             event.type === 'FAILED' ? 'Publish Failed' :
                             event.type === 'PROCESSING' ? 'Publishing...' :
                             event.type === 'PENDING' ? 'Scheduled' :
                             event.type}
                          </span>
                          <span className="text-zinc-500 font-mono">{formatRelativeTime(event.updatedAt)}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-normal">
                          <code className="text-[10px] text-zinc-400">{event.videoName.substring(0, 30)}{event.videoName.length > 30 ? '…' : ''}</code>
                          {event.type === 'FAILED' && event.errorLog && (
                            <span className="block text-rose-500/80 mt-0.5 text-[10px]">{event.errorLog.substring(0, 60)}…</span>
                          )}
                          {event.type === 'PUBLISHED' && event.instagramMediaId && (
                            <span className="block text-zinc-600 mt-0.5 font-mono text-[10px]">ID: {event.instagramMediaId}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-center">
                <Link to="/logs" className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:gap-1.5 transition-all">
                  <span>View All Logs</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
