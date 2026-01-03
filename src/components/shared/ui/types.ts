import { LucideIcon } from "lucide-react";

// UNIFIED STATUS TYPE: This is the single source of truth for all possible status strings
// that can be passed to the StatusBadge component.
export type TStatus =
  // Universal & Campaign
  | "نشطة"
  | "موقوفة"
  | "مكتملة"
  // Customer Stage
  | "جديد"
  | "مؤهل"
  | "حجز"
  | "ربح"
  | "خسارة"
  // Ticket Status (from models.py & Arabic display)
  | "open"
  | "in_progress"
  | "resolved"
  | "مفتوحة"
  | "قيد_المعالجة"
  | "محلولة"
  // Booking Status (from models.py & Arabic display)
  | "pending"
  | "confirmed"
  | "canceled"
  | "completed"
  | "معلق"
  | "مؤكد"
  | "ملغي"
  | "مكتمل"
  // Priority (from models.py & Arabic display)
  | "urgent"
  | "high"
  | "med"
  | "low"
  | "عاجل"
  | "عالٍ"
  | "متوسط"
  | "منخفض"
  // Source / Attribution / Type
  | "AI"
  | "بشري"
  | "Human"
  | "voice"
  | "صوت"
  | "web"   // CORRECTED: Added this missing type
  | "visit" // CORRECTED: Added this missing type
  // Call Status
  | "connected"
  | "no_answer"
  | "abandoned"
  | "unknown"
  | "متصل"
  | "لا_إجابة"
  | "متروك"
  | "غير_معروف"
  // LiveOps Call Status
  | "وارد"
  | "فائت"
  // Call Outcomes
  | "qualified"
  | "booked"
  | "ticket"
  | "info"
  | "raised_ticket";

export interface IStatsCard {
  icon: LucideIcon;
  iconBgColor: string;
  label: string;
  value: string | number;
  change: number;
  period: string;
}