import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utility
export function formatDate(date: string | Date, locale: string = 'ar-EG'): string {
  try {
    return new Date(date).toLocaleDateString(locale);
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toLocaleDateString(locale);
  }
}

// Time formatting utility
export function formatTime(date: string | Date, locale: string = 'ar-EG'): string {
  try {
    return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
}

// SAR currency formatting utility
export function formatSAR(amount: number): string {
  return amount.toLocaleString() + ' ر.س';
} 