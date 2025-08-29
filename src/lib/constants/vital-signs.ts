
export const VITAL_SIGNS_THRESHOLDS = {
  HEART_RATE: {
    CRITICAL_HIGH: 100,
    WARNING_HIGH: 90,
    NORMAL_MAX: 89,
    NORMAL_MIN: 60,
    CRITICAL_LOW: 60,
  },
  TEMPERATURE: {
    CRITICAL_HIGH: 38,
    WARNING_HIGH: 37.5,
    NORMAL_MAX: 37.4,
    NORMAL_MIN: 35.5,
    CRITICAL_LOW: 35,
  },
  OXYGEN_SATURATION: {
    NORMAL_MIN: 98,
    WARNING_MIN: 95,
    CRITICAL_MIN: 95,
  },
  RESPIRATORY_RATE: {
    NORMAL_MAX: 20,
    NORMAL_MIN: 12,
    WARNING_HIGH: 24,
    CRITICAL_HIGH: 30,
  }
} as const;

export const VITAL_SIGNS_UNITS = {
  HEART_RATE: 'bpm',
  TEMPERATURE: '°C',
  OXYGEN_SATURATION: '%',
  RESPIRATORY_RATE: 'breaths/min',
  WEIGHT: 'kg',
  BLOOD_SUGAR: 'mg/dL',
} as const;

export const VITAL_SIGNS_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export const VITAL_SIGNS_STATUS_COLORS = {
  [VITAL_SIGNS_STATUS.NORMAL]: '#10b981',
  [VITAL_SIGNS_STATUS.WARNING]: '#f59e0b',
  [VITAL_SIGNS_STATUS.CRITICAL]: '#ef4444',
  default: '#6b7280',
} as const;

export const VITAL_SIGNS_STATUS_LABELS = {
  [VITAL_SIGNS_STATUS.NORMAL]: 'Bình thường',
  [VITAL_SIGNS_STATUS.WARNING]: 'Cần chú ý',
  [VITAL_SIGNS_STATUS.CRITICAL]: 'Nguy hiểm',
} as const;

export const VITAL_SIGNS_FORM_VALIDATION = {
  HEART_RATE: {
    MIN: 30,
    MAX: 200,
    REQUIRED: true,
  },
  TEMPERATURE: {
    MIN: 30,
    MAX: 45,
    REQUIRED: true,
  },
  OXYGEN_SATURATION: {
    MIN: 70,
    MAX: 100,
    REQUIRED: true,
  },
  RESPIRATORY_RATE: {
    MIN: 5,
    MAX: 60,
    REQUIRED: false,
  },
  WEIGHT: {
    MIN: 20,
    MAX: 200,
    REQUIRED: false,
  },
  BLOOD_SUGAR: {
    MIN: 50,
    MAX: 500,
    REQUIRED: false,
  },
} as const; 