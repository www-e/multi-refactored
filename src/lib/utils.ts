import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utility with KSA timezone
export function formatDate(date: string | Date | undefined | null, locale: string = 'ar-EG'): string {
  if (!date) {
    return 'غير محدد';
  }

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      // If the date is invalid, return a meaningful message
      return 'تاريخ غير صحيح';
    }
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Riyadh'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'غير محدد';
  }
}

// Time formatting utility with KSA timezone
export function formatTime(date: string | Date, locale: string = 'ar-EG'): string {
  try {
    return new Date(date).toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Riyadh'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
}

// Combined date and time formatting utility with KSA timezone
export function formatDateTime(date: string | Date | undefined | null, locale: string = 'ar-EG'): string {
  if (!date) {
    return 'غير محدد';
  }

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح';
    }
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Riyadh'
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'غير محدد';
  }
}

// Format date for table display (compact format)
export function formatTableDate(date: string | Date | undefined | null): string {
  if (!date) {
    return '--';
  }

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === dateObj.toDateString();
    
    const timeStr = dateObj.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Riyadh'
    });
    
    if (isToday) {
      return `اليوم، ${timeStr}`;
    } else if (isYesterday) {
      return `أمس، ${timeStr}`;
    } else {
      return dateObj.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Riyadh'
      }) + `، ${timeStr}`;
    }
  } catch (error) {
    console.error('Error formatting table date:', error);
    return '--';
  }
}

// SAR currency formatting utility
export function formatSAR(amount: number): string {
  return amount.toLocaleString() + ' ر.س';
} 
