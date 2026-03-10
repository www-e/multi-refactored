/**
 * Unified Campaign Status Management
 * Standardizes status handling across frontend and backend
 */

// ============================================================================
// CAMPAIGN STATUS TYPES
// ============================================================================

export const CAMPAIGN_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export type CampaignStatus = typeof CAMPAIGN_STATUSES[keyof typeof CAMPAIGN_STATUSES];

// ============================================================================
// ARABIC LABELS
// ============================================================================

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  queued: 'في قائمة الانتظار',
  running: 'قيد التشغيل',
  paused: 'متوقف مؤقتاً',
  completed: 'مكتمل',
  failed: 'فشل',
  cancelled: 'ملغي'
};

// ============================================================================
// STATUS BADGE STYLING
// ============================================================================

export const CAMPAIGN_STATUS_BADGES: Record<CampaignStatus, {
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
  icon: any;
}> = {
  queued: {
    bg: 'bg-slate-100',
    bgDark: 'dark:bg-slate-800',
    text: 'text-slate-700',
    textDark: 'dark:text-slate-300',
    icon: 'Clock'
  },
  running: {
    bg: 'bg-blue-100',
    bgDark: 'dark:bg-blue-900/30',
    text: 'text-blue-700',
    textDark: 'dark:text-blue-400',
    icon: 'Play'
  },
  paused: {
    bg: 'bg-amber-100',
    bgDark: 'dark:bg-amber-900/30',
    text: 'text-amber-700',
    textDark: 'dark:text-amber-400',
    icon: 'Pause'
  },
  completed: {
    bg: 'bg-green-100',
    bgDark: 'dark:bg-green-900/30',
    text: 'text-green-700',
    textDark: 'dark:text-green-400',
    icon: 'CheckCircle2'
  },
  failed: {
    bg: 'bg-red-100',
    bgDark: 'dark:bg-red-900/30',
    text: 'text-red-700',
    textDark: 'dark:text-red-400',
    icon: 'XCircle'
  },
  cancelled: {
    bg: 'bg-gray-100',
    bgDark: 'dark:bg-gray-900/30',
    text: 'text-gray-700',
    textDark: 'dark:text-gray-400',
    icon: 'XCircle'
  }
};

// ============================================================================
// CALL RESULT STATUS TYPES
// ============================================================================

export const CALL_RESULT_STATUSES = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILED: 'failed',
  VOICEMAIL: 'voicemail',
  NO_ANSWER: 'no_answer',
  BUSY: 'busy',
  CANCELLED: 'cancelled'
} as const;

export type CallResultStatus = typeof CALL_RESULT_STATUSES[keyof typeof CALL_RESULT_STATUSES];

export const CALL_RESULT_STATUS_LABELS: Record<CallResultStatus, string> = {
  queued: 'في الانتظار',
  in_progress: 'قيد التنفيذ',
  success: 'نجح',
  failed: 'فشل',
  voicemail: 'بريد صوتي',
  no_answer: 'لا إجابة',
  busy: 'مشغول',
  cancelled: 'ملغي'
};

// ============================================================================
// CALL OUTCOME TYPES
// ============================================================================

export const CALL_OUTCOMES = {
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  FOLLOW_UP_REQUESTED: 'follow_up_requested',
  APPOINTMENT_BOOKED: 'appointment_booked',
  INFORMATION_ONLY: 'information_only',
  WRONG_NUMBER: 'wrong_number',
  DO_NOT_CALL: 'do_not_call'
} as const;

export type CallOutcome = typeof CALL_OUTCOMES[keyof typeof CALL_OUTCOMES];

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  interested: 'مهتم',
  not_interested: 'غير مهتم',
  follow_up_requested: 'طلب متابعة',
  appointment_booked: 'حجز موعد',
  information_only: 'معلومات فقط',
  wrong_number: 'رقم خاطئ',
  do_not_call: 'لا يتصل'
};

// ============================================================================
// STATUS TRANSITIONS (valid state changes)
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  queued: ['running', 'cancelled', 'failed'],
  running: ['paused', 'completed', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'],
  completed: [], // Terminal state
  failed: ['queued'], // Can retry
  cancelled: [] // Terminal state
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  fromStatus: CampaignStatus,
  toStatus: CampaignStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Get next valid statuses for a given status
 */
export function getNextValidStatuses(currentStatus: CampaignStatus): CampaignStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if campaign is in active state (running or queued)
 */
export function isCampaignActive(status: CampaignStatus): boolean {
  return status === CAMPAIGN_STATUSES.RUNNING || status === CAMPAIGN_STATUSES.QUEUED;
}

/**
 * Check if campaign is in terminal state (completed, failed, or cancelled)
 */
export function isCampaignTerminal(status: CampaignStatus): boolean {
  return status === CAMPAIGN_STATUSES.COMPLETED ||
         status === CAMPAIGN_STATUSES.FAILED ||
         status === CAMPAIGN_STATUSES.CANCELLED;
}

/**
 * Get status label in Arabic
 */
export function getCampaignStatusLabel(status: CampaignStatus): string {
  return CAMPAIGN_STATUS_LABELS[status] || status;
}

/**
 * Get call result status label in Arabic
 */
export function getCallResultStatusLabel(status: CallResultStatus): string {
  return CALL_RESULT_STATUS_LABELS[status] || status;
}

/**
 * Get call outcome label in Arabic
 */
export function getCallOutcomeLabel(outcome: CallOutcome): string {
  return CALL_OUTCOME_LABELS[outcome] || outcome;
}