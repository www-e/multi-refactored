'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  example?: string;
  warning?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  variant?: 'info' | 'warning' | 'success';
}

export default function Tooltip({
  content,
  example,
  warning,
  side = 'top',
  children,
  variant = 'info'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full mb-2 right-0',
    bottom: 'top-full mt-2 right-0',
    left: 'right-full mr-2 top-0',
    right: 'left-full ml-2 top-0'
  };

  const variantColors = {
    info: 'bg-blue-900 text-blue-100 border-blue-700',
    warning: 'bg-amber-900 text-amber-100 border-amber-700',
    success: 'bg-green-900 text-green-100 border-green-700'
  };

  const iconColors = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-green-600 dark:text-green-400'
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsVisible(!isVisible)}
        className="inline-flex items-center gap-1 cursor-help"
      >
        {children || (
          <Info
            size={16}
            className={`${iconColors[variant]} hover:scale-110 transition-transform`}
          />
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute ${positionClasses[side]} w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
          dir="rtl"
        >
          <div className={`${variantColors[variant]} border rounded-lg p-4 shadow-xl`}>
            <div className="text-sm font-medium mb-2">{content}</div>
            
            {example && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="text-xs opacity-75 mb-1">مثال:</div>
                <div className="text-sm bg-black/20 rounded p-2 font-mono text-xs">
                  {example}
                </div>
              </div>
            )}
            
            {warning && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-start gap-2 text-amber-300">
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs">{warning}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 left-2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for inline help text
export function HelpText({
  title,
  children,
  className = ''
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-start gap-2">
        <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">{title}: </span>
          {children}
        </div>
      </div>
    </div>
  );
}

// Helper component for field-level help
export function FieldHelp({
  text,
  example,
  warning
}: {
  text: string;
  example?: string;
  warning?: string;
}) {
  return (
    <Tooltip
      content={text}
      example={example}
      warning={warning}
      variant={warning ? 'warning' : 'info'}
    />
  );
}
