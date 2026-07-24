import React, { useState, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  FileVideo,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { TIMEZONES } from '../lib/mockReels';

interface DriveFile {
  id: string;
  driveFileId: string;
  videoName: string;
  captionName: string | null;
  captionText: string | null;
  status: 'PAIRED' | 'UNPAIRED' | 'DETECTED';
  videoSize: number | null;
  lastSeenAt: string;
  latestJob: {
    id: string;
    status: string;
    scheduledAt: string;
    publishedAt: string | null;
  } | null;
}

const STATUS_BADGE: Record<string, string> = {
  PAIRED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  UNPAIRED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  DETECTED: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

const JOB_STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'text-emerald-400',
  FAILED: 'text-rose-400',
  PENDING: 'text-amber-400',
  PROCESSING: 'text-blue-400',
  CANCELLED: 'text-zinc-400',
  PAUSED: 'text-orange-400',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface ScheduleModalProps {
  file: DriveFile;
  onClose: () => void;
  onScheduled: () => void;
}

function ScheduleModal({ file, onClose, onScheduled }: ScheduleModalProps) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [caption, setCaption] = useState(file.captionText || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) { setError('Please select a date and time.'); return; }

    setLoading(true);
    setError(null);
    try {
      await api.post('/api/v1/scheduler/jobs', {
        driveFileId: file.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        timezone,
        caption,
      });
      onScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="text-base font-bold text-zinc-100">Schedule Reel</h3>
          <p className="text-xs text-zinc-500 mt-1 font-mono truncate">{file.videoName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Publish Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={4}
              placeholder="Write your Instagram caption here..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors resize-none"
            />
            <p className="text-[10px] text-zinc-600">{caption.length}/2200 characters</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 text-xs" isLoading={loading}>
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Schedule
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Library() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'PAIRED' | 'UNPAIRED'>('all');
  const [schedulingFile, setSchedulingFile] = useState<DriveFile | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFiles = useCallback(async () => {
    try {
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
      const data = await api.get(`/api/v1/dashboard/files?limit=100${statusParam}`);
      setFiles(data?.files || []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchFiles();
  }, [fetchFiles]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await api.post('/api/v1/google-drive/sync/wait');
      showToast('success', 'Drive sync complete. File list updated.');
      await fetchFiles();
    } catch (err: any) {
      showToast('error', err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredFiles = files.filter(f =>
    f.videoName.toLowerCase().includes(search.toLowerCase()) ||
    (f.captionName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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

      {/* Schedule Modal */}
      <AnimatePresence>
        {schedulingFile && (
          <ScheduleModal
            file={schedulingFile}
            onClose={() => setSchedulingFile(null)}
            onScheduled={() => showToast('success', `"${schedulingFile.videoName}" scheduled successfully!`)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Content Library</h1>
          <p className="text-xs text-zinc-500 mt-1">{total} files synced from Google Drive.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          isLoading={isSyncing}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          className="text-xs font-semibold h-9"
        >
          Sync Drive
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-zinc-900/30 border border-zinc-900 px-3 py-2 rounded-xl text-zinc-400 flex-1">
          <Search className="h-4 w-4 text-zinc-600 shrink-0" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-zinc-200 outline-none w-full placeholder-zinc-600"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'PAIRED', 'UNPAIRED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                filterStatus === f ? 'bg-zinc-50 border-zinc-50 text-zinc-950' : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
              }`}
            >
              {f === 'all' ? 'All Files' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 animate-pulse space-y-3">
              <div className="h-4 w-3/4 bg-zinc-800 rounded" />
              <div className="h-3 w-1/2 bg-zinc-800 rounded" />
              <div className="h-8 w-full bg-zinc-800 rounded-lg mt-4" />
            </div>
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 border border-zinc-900 rounded-xl bg-zinc-900/5">
          <HardDrive className="h-8 w-8 text-zinc-700" />
          <p className="text-sm font-semibold text-zinc-400">No files found</p>
          <p className="text-xs text-zinc-600 max-w-xs">
            {search ? 'No files match your search.' : 'Connect Google Drive and sync a folder containing MP4 and TXT file pairs.'}
          </p>
          {!search && (
            <Button variant="outline" size="sm" onClick={handleSync} isLoading={isSyncing} className="text-xs mt-2">
              Sync Drive Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-900/10 p-5 space-y-4 transition-all group"
            >
              {/* File Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileVideo className="h-4 w-4 text-zinc-500 shrink-0" />
                    <p className="text-xs font-mono font-bold text-zinc-200 truncate">{file.videoName}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${STATUS_BADGE[file.status]}`}>
                    {file.status}
                  </span>
                </div>

                {file.captionName && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <p className="text-[11px] text-zinc-500 truncate">{file.captionName}</p>
                  </div>
                )}

                {file.captionText && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed pl-5">{file.captionText}</p>
                )}

                <div className="flex items-center justify-between text-[10px] text-zinc-600 pt-1">
                  <span>{formatFileSize(file.videoSize)}</span>
                  <span>Seen {formatDate(file.lastSeenAt)}</span>
                </div>
              </div>

              {/* Latest Job Status */}
              {file.latestJob && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <span className="text-[10px] text-zinc-500">Latest:</span>
                  <span className={`text-[10px] font-bold ${JOB_STATUS_BADGE[file.latestJob.status] || 'text-zinc-400'}`}>
                    {file.latestJob.status}
                    {file.latestJob.scheduledAt && ` · ${formatDate(file.latestJob.scheduledAt)}`}
                  </span>
                </div>
              )}

              {/* Schedule Button */}
              {file.status === 'PAIRED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setSchedulingFile(file)}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Schedule Reel
                </Button>
              )}
              {file.status === 'UNPAIRED' && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/10">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-400">Missing caption (.txt) file. Add a matching TXT file to enable scheduling.</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
