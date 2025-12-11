import { useState, useRef, useEffect } from 'react';

export interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  error?: string;
}

export const useAudioPlayer = (audioSrc?: string) => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 1,
    error: undefined
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      const setDuration = () => {
        setState(prev => ({ ...prev, duration: audio.duration }));
      };

      const setCurrentTime = () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      };

      const handlePlay = () => {
        setState(prev => ({ ...prev, isPlaying: true }));
      };

      const handlePause = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };

      const handleError = (e: any) => {
        setState(prev => ({ ...prev, error: e.message || 'Error loading audio' }));
      };

      audio.addEventListener('loadedmetadata', setDuration);
      audio.addEventListener('timeupdate', setCurrentTime);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', setDuration);
        audio.removeEventListener('timeupdate', setCurrentTime);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioSrc]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setState(prev => ({ ...prev, volume }));
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    state,
    togglePlay,
    seek,
    setVolume,
    formatTime,
    audioRef
  };
};