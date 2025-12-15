'use client';

import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface AudioPlayerProps {
  src?: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onPlay,
  onPause,
  className = ''
}) => {
  const {
    state,
    togglePlay,
    seek,
    setVolume,
    formatTime
  } = useAudioPlayer(src);

  // Validate URL format
  const isValidUrl = src && typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));

  if (!src) {
    return (
      <div className={`text-sm text-slate-500 ${className}`}>
        لا توجد تسجيلات متاحة (URL فارغة)
      </div>
    );
  }

  if (!isValidUrl) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        رابط غير صحيح: {src.substring(0, 50)}...
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        خطأ في تحميل التسجيل: {state.error}
      </div>
    );
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * state.duration;
    seek(newTime);
  };

  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg border ${className}`}>
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => {
            togglePlay();
            if (state.isPlaying) {
              onPause?.();
            } else {
              onPlay?.();
            }
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          aria-label={state.isPlaying ? 'إيقاف' : 'تشغيل'}
        >
          {state.isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div 
            className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
            />
          </div>
          
          {/* Time Info */}
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(state.volume > 0 ? 0 : 1)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            aria-label={state.volume > 0 ? 'كتم الصوت' : 'إلغاء الكتم'}
          >
            {state.volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={state.volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16"
            aria-label="التحكم في الصوت"
          />
        </div>
      </div>
    </div>
  );
};