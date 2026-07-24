import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Globe,
  Instagram,
  FileVideo,
  Smile,
  Hash,
  AtSign,
  AlertTriangle,
  Sparkles,
  Play,
} from 'lucide-react';
import { Reel, TIMEZONES } from '../lib/mockReels';

import { Button } from './ui/Button';

interface ScheduleDrawerProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateReel?: (updatedReel: Reel) => void;
}

export function ScheduleDrawer({ reel, isOpen, onClose, onUpdateReel }: ScheduleDrawerProps) {
  const [caption, setCaption] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [extractedHashtags, setExtractedHashtags] = useState<string[]>([]);
  const [extractedMentions, setExtractedMentions] = useState<string[]>([]);

  // Update form values when reel changes
  useEffect(() => {
    if (reel) {
      setCaption(reel.caption);
      setScheduledDate(reel.scheduledDate);
      setScheduledTime(reel.scheduledTime);
      setExtractedHashtags(reel.hashtags || []);
      setExtractedMentions(reel.mentions || []);
    }
  }, [reel]);

  // Extract hashtags and mentions on caption change
  useEffect(() => {
    const hashtags = caption.match(/#\w+/g)?.map(h => h.substring(1)) || [];
    const mentions = caption.match(/@\w+/g)?.map(m => m.substring(1)) || [];
    setExtractedHashtags(Array.from(new Set(hashtags)));
    setExtractedMentions(Array.from(new Set(mentions)));
  }, [caption]);

  if (!reel) return null;

  const charCount = caption.length;
  const maxChars = 2200; // Instagram caption character limit
  const charPercent = Math.min((charCount / maxChars) * 100, 100);

  const handleAction = (actionType: 'now' | 'schedule') => {
    if (onUpdateReel) {
      onUpdateReel({
        ...reel,
        caption,
        scheduledDate,
        scheduledTime,
        hashtags: extractedHashtags,
        mentions: extractedMentions,
        status: actionType === 'now' ? 'PUBLISHED' : 'PENDING',
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            id="drawer-backdrop"
          />

          {/* Right Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col overflow-hidden"
            id="drawer-panel"
          >
            {/* Header section */}
            <div className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-900/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400">
                  <Instagram className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Schedule Publisher</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">ReelPilot Autopilot Pipeline</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg cursor-pointer transition-colors"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Media Preview Card */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 overflow-hidden">
                <div className="relative aspect-video bg-zinc-950 flex items-center justify-center group">
                  <img
                    src={reel.thumbnail}
                    alt={reel.videoName}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[9px] font-mono text-zinc-400 border border-zinc-800">
                    {reel.duration} min • {reel.fileSize}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <FileVideo className="h-3 w-3" />
                      Google Drive Source File
                    </span>
                    <p className="text-xs font-mono font-bold text-zinc-100 truncate" title={reel.videoName}>
                      {reel.videoName}
                    </p>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-100/10 hover:bg-zinc-100/20 border border-zinc-100/20 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm group-hover:scale-105">
                    <Play className="h-4.5 w-4.5 text-zinc-100 fill-zinc-100 ml-0.5" />
                  </div>
                </div>
                <div className="p-3 bg-zinc-950/60 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono truncate">
                  Path: {reel.filePath}
                </div>
              </div>

              {/* Platform Selector card */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Target Publication Platform
                </label>
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-lg">
                      <Instagram className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">Instagram Reel</span>
                      <span className="text-[10px] text-zinc-500">Official Auto-Publishing API integration</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Active Channel
                  </span>
                </div>
              </div>

              {/* Caption Editor with Character Counter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Instagram Caption
                  </label>
                  <span className={`text-[10px] font-mono ${charCount > maxChars ? 'text-rose-400' : 'text-zinc-500'}`}>
                    {charCount} / {maxChars} chars
                  </span>
                </div>
                <div className="relative rounded-xl border border-zinc-900 bg-zinc-950/60 p-1 focus-within:border-zinc-800 transition-colors">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a catchy caption, add #hashtags and @mentions..."
                    rows={6}
                    className="w-full bg-transparent border-none text-xs text-zinc-200 outline-none p-3.5 resize-none leading-relaxed placeholder-zinc-600 focus:ring-0"
                  />
                  
                  {/* Progress bar representing character limit */}
                  <div className="h-1 bg-zinc-900 w-full overflow-hidden rounded-b-md">
                    <div
                      style={{ width: `${charPercent}%` }}
                      className={`h-full transition-all duration-300 ${
                        charCount > maxChars ? 'bg-rose-500' : charPercent > 80 ? 'bg-amber-500' : 'bg-zinc-400'
                      }`}
                    />
                  </div>

                  {/* Caption Editor toolbar placeholders */}
                  <div className="h-9 px-3 border-t border-zinc-900/60 flex items-center justify-between bg-zinc-900/5 text-zinc-500">
                    <div className="flex items-center gap-3">
                      <button className="p-1 hover:text-zinc-300 transition-colors cursor-pointer" title="Add Emoji">
                        <Smile className="h-4 w-4" />
                      </button>
                      <button className="p-1 hover:text-zinc-300 transition-colors cursor-pointer" title="Add Hashtag">
                        <Hash className="h-4 w-4" />
                      </button>
                      <button className="p-1 hover:text-zinc-300 transition-colors cursor-pointer" title="Mention Brand">
                        <AtSign className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-600">INSTAGRAM STYLE</span>
                  </div>
                </div>

                {/* Hashtags and Mentions parsed visualizations */}
                {(extractedHashtags.length > 0 || extractedMentions.length > 0) && (
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2.5">
                    {extractedHashtags.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Parsed Hashtags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {extractedHashtags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] text-zinc-400 border border-zinc-800 flex items-center gap-1 font-medium">
                              <span className="text-zinc-600">#</span>{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {extractedMentions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Parsed Mentions</span>
                        <div className="flex flex-wrap gap-1.5">
                          {extractedMentions.map((user) => (
                            <span key={user} className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] text-zinc-400 border border-zinc-800 flex items-center gap-1 font-medium">
                              <span className="text-zinc-600">@</span>{user}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date & Time Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    Publish Time (24h)
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-800"
                  />
                </div>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-500" />
                  Target Publishing Timezone
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-800 cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Failure state notice if failed */}
              {reel.status === 'FAILED' && (reel.errorLog || reel.failureReason) && (
                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span>Upload Failure Log Details</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-mono pl-6">
                    {reel.errorLog || reel.failureReason}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-5 border-t border-zinc-900 bg-zinc-900/10 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-semibold px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('now')}
                  className="text-xs font-semibold px-4 border-zinc-800 hover:bg-zinc-900 text-zinc-200 cursor-pointer"
                >
                  Publish Now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAction('schedule')}
                  className="text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-none px-4 shadow-sm cursor-pointer"
                >
                  Schedule Reel
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
