import { promises as fs } from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  source: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

// In containerized environments, writing to local files is unreliable and can cause crashes (ENOENT).
// We default to console logging which Docker captures automatically.
const ENABLE_FILE_LOGGING = process.env.ENABLE_FILE_LOGGING === 'true';
const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'elevenlabs.log');

async function ensureLogDir() {
  if (!ENABLE_FILE_LOGGING) return;
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch {
    // ignore
  }
}

export async function logEvent(source: string, level: LogLevel, message: string, meta?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    source,
    level,
    message,
    meta,
  };

  // 1. Always log to Console (Standard Output for Docker)
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  // Use a compact format for console to keep logs readable
  logFn(`[${level.toUpperCase()}] [${source}]: ${message}`, meta ? JSON.stringify(meta) : '');

  // 2. Optional: Log to file if explicitly enabled
  if (ENABLE_FILE_LOGGING) {
    try {
      await ensureLogDir();
      await fs.appendFile(logFile, JSON.stringify(entry) + '\n', 'utf8');
    } catch (err) {
      // Silently fail on file write to prevent app crashes
      console.warn('[Logger] Failed to write to log file, but ignoring to maintain stability.', err);
    }
  }
}

export function getLogFilePath() {
  return logFile;
}