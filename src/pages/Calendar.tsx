import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileVideo,
} from 'lucide-react';
import { api } from '../lib/api';

interface CalendarJob {
  id: string;
  status: string;
  scheduledAt: string;
  timezone: string;
  videoName: string;
  caption: string | null;
  publishedAt: string | null;
  instagramMediaId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  PROCESSING: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  PUBLISHED: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  FAILED: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
  CANCELLED: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400',
  PAUSED: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
};

const DOT_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-400',
  PROCESSING: 'bg-blue-400 animate-pulse',
  PUBLISHED: 'bg-emerald-400',
  FAILED: 'bg-rose-400',
  CANCELLED: 'bg-zinc-500',
  PAUSED: 'bg-orange-400',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<CalendarJob | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/dashboard/calendar');
      setJobs(data?.jobs || []);
    } catch (err) {
      console.error('Failed to fetch calendar jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 60000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const getJobsForDay = (day: number): CalendarJob[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return jobs.filter(j => j.scheduledAt.startsWith(dateStr));
  };

  const selectedDayJobs = selectedDate
    ? jobs.filter(j => j.scheduledAt.startsWith(selectedDate))
    : [];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Publishing Calendar</h1>
          <p className="text-xs text-zinc-500 mt-1">Visual overview of all scheduled and published reels.</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          {['PENDING', 'PUBLISHED', 'FAILED'].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${DOT_COLORS[s]}`} />
              <span className="text-zinc-400">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg border border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-bold text-zinc-200">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg border border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-zinc-900/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} className="aspect-square" />;
                const dayJobs = getJobsForDay(day);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedDate(isSelected ? null : dateStr);
                      setSelectedJob(null);
                    }}
                    className={`aspect-square rounded-xl p-1.5 flex flex-col items-center justify-start cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-950'
                        : isToday(day)
                          ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100'
                          : 'bg-zinc-900/10 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-zinc-950' : isToday(day) ? 'text-white' : ''}`}>
                      {day}
                    </span>
                    {dayJobs.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                        {dayJobs.slice(0, 3).map((job, ji) => (
                          <div
                            key={ji}
                            className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[job.status]} ${isSelected ? 'opacity-60' : ''}`}
                          />
                        ))}
                        {dayJobs.length > 3 && (
                          <span className={`text-[8px] font-bold ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>+{dayJobs.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Selected Day Jobs */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'
              }
            </h3>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 border border-zinc-900 rounded-xl bg-zinc-900/5">
              <Calendar className="h-6 w-6 text-zinc-700" />
              <p className="text-xs text-zinc-500">Click any date to see scheduled reels.</p>
            </div>
          ) : selectedDayJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 border border-zinc-900 rounded-xl bg-zinc-900/5">
              <FileVideo className="h-6 w-6 text-zinc-700" />
              <p className="text-xs text-zinc-500">No reels scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayJobs.map(job => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${STATUS_COLORS[job.status]}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[job.status]}`} />
                    <span className="text-[10px] font-bold ml-auto">{job.status}</span>
                  </div>
                  <p className="text-xs font-mono font-bold truncate">{job.videoName}</p>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Clock className="h-3 w-3 opacity-60" />
                    <span>{formatTime(job.scheduledAt)}</span>
                    <span className="opacity-50">·</span>
                    <span className="opacity-60">{job.timezone}</span>
                  </div>

                  <AnimatePresence>
                    {selectedJob?.id === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {job.caption && (
                          <p className="text-[11px] opacity-80 leading-relaxed mt-2 border-t border-current/20 pt-2 line-clamp-3">
                            {job.caption}
                          </p>
                        )}
                        {job.publishedAt && (
                          <p className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Published {new Date(job.publishedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        {job.instagramMediaId && (
                          <p className="text-[10px] opacity-50 font-mono mt-1">ID: {job.instagramMediaId}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* Monthly summary */}
          {!loading && (
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-3">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                {MONTHS[month]} Summary
              </h4>
              {['PUBLISHED', 'PENDING', 'FAILED'].map(status => {
                const count = jobs.filter(j => {
                  const d = new Date(j.scheduledAt);
                  return d.getMonth() === month && d.getFullYear() === year && j.status === status;
                }).length;
                if (count === 0) return null;
                return (
                  <div key={status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${DOT_COLORS[status]}`} />
                      <span className="text-zinc-400">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-300">{count}</span>
                  </div>
                );
              })}
              {jobs.filter(j => {
                const d = new Date(j.scheduledAt);
                return d.getMonth() === month && d.getFullYear() === year;
              }).length === 0 && (
                <p className="text-[11px] text-zinc-600">No jobs this month.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
