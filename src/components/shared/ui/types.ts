import { LucideIcon } from "lucide-react";

export type TStatus =
  // Universal
  | "نشطة"
  | "موقوفة"
  | "مكتملة" // This was the original value
  | "جديد"
  | "مؤهل"
  | "حجز"
  | "ربح"
  | "خسارة"
  // Tickets
  | "مفتوحة"
  | "قيد_المعالجة"
  | "بانتظار_الموافقة"
  | "محلولة"
  // Bookings
  | "معلق"
  | "مؤكد"
  | "ملغي"
  | "مكتمل" // FIX: Changed from 'مكتملة' to match the EnhancedBooking type
  // Priority
  | "عاجل"
  | "عالٍ"
  | "متوسط"
  | "منخفض"
  // Source / Attribution
  | "AI"
  | "بشري"
  | "صوت"
  | "رسالة";

export interface IStatsCard {
  icon: LucideIcon;
  iconBgColor: string;
  label: string;
  value: string | number;
  change: number;
  period: string;
}