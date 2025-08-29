
export const UI_CONSTANTS = {
  MODAL: {
    ANIMATION_DURATION: 300,
    BACKDROP_OPACITY: 0.75,
    MAX_WIDTH: '800px',
    BORDER_RADIUS: '1rem',
  },
  FORM: {
    INPUT_HEIGHT: '2.75rem',
    BORDER_RADIUS: '0.5rem',
    PADDING: '0.75rem',
    MAX_WIDTH: '100%',
  },
  TABLE: {
    ROW_HEIGHT: '3rem',
    HEADER_HEIGHT: '3.5rem',
    BORDER_COLOR: '#e5e7eb',
    HOVER_COLOR: '#f9fafb',
  },
  NOTIFICATION: {
    AUTO_CLOSE_DELAY: 5000,
    SUCCESS_AUTO_CLOSE: 3000,
    WARNING_AUTO_CLOSE: 4000,
    ERROR_AUTO_CLOSE: 6000,
  },
  LOADING: {
    SPINNER_SIZE: '3rem',
    SPINNER_BORDER_WIDTH: '3px',
    MIN_LOADING_TIME: 500,
  }
} as const;


export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    900: '#0f172a',
  },
  SUCCESS: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  INFO: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  }
} as const;


export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FAMILY: 'family',
  MANAGER: 'manager',
  NURSE: 'nurse',
  DOCTOR: 'doctor',
} as const;

export const PERMISSIONS = {
  
  VIEW_RESIDENTS: 'view_residents',
  CREATE_RESIDENT: 'create_resident',
  EDIT_RESIDENT: 'edit_resident',
  DELETE_RESIDENT: 'delete_resident',
  
  
  VIEW_STAFF: 'view_staff',
  CREATE_STAFF: 'create_staff',
  EDIT_STAFF: 'edit_staff',
  DELETE_STAFF: 'delete_staff',
  
  
  VIEW_ACTIVITIES: 'view_activities',
  CREATE_ACTIVITY: 'create_activity',
  EDIT_ACTIVITY: 'edit_activity',
  DELETE_ACTIVITY: 'delete_activity',
  
  
  VIEW_FINANCE: 'view_finance',
  CREATE_TRANSACTION: 'create_transaction',
  EDIT_TRANSACTION: 'edit_transaction',
  DELETE_TRANSACTION: 'delete_transaction',
  
  
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  
  
  MANAGE_USERS: 'manage_users',
  MANAGE_PERMISSIONS: 'manage_permissions',
  SYSTEM_SETTINGS: 'system_settings',
} as const;


export const ACTIVITY_CATEGORIES = {
  PHYSICAL: 'Thể chất',
  MENTAL: 'Tinh thần',
  SOCIAL: 'Xã hội',
  CREATIVE: 'Sáng tạo',
  EDUCATIONAL: 'Giáo dục',
  THERAPEUTIC: 'Trị liệu',
  RECREATIONAL: 'Giải trí',
  SPIRITUAL: 'Tâm linh',
} as const;


export const HEALTH_CONDITIONS = {
  EXCELLENT: 'Rất tốt',
  GOOD: 'Tốt',
  FAIR: 'Trung bình',
  POOR: 'Yếu',
  CRITICAL: 'Nguy hiểm',
} as const;


export const ROOM_TYPES = {
  STANDARD: 'Phòng tiêu chuẩn',
  PREMIUM: 'Phòng cao cấp',
  VIP: 'Phòng VIP',
  SHARED: 'Phòng chia sẻ',
  SINGLE: 'Phòng đơn',
} as const;


export const TRANSACTION_TYPES = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi phí',
  TRANSFER: 'Chuyển khoản',
  REFUND: 'Hoàn tiền',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CREDIT_CARD: 'Thẻ tín dụng',
  DEBIT_CARD: 'Thẻ ghi nợ',
  DIGITAL_WALLET: 'Ví điện tử',
} as const;


export const INVENTORY_CATEGORIES = {
  MEDICATION: 'Thuốc men',
  MEDICAL_EQUIPMENT: 'Thiết bị y tế',
  DAILY_SUPPLIES: 'Vật dụng hàng ngày',
  FOOD: 'Thực phẩm',
  CLEANING: 'Vệ sinh',
  SAFETY: 'An toàn',
} as const;


export const TASK_PRIORITIES = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
} as const;


export const TASK_STATUSES = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  OVERDUE: 'Quá hạn',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, 
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  MAX_FILES_COUNT: 10,
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  FULL: 'dd/MM/yyyy HH:mm:ss',
  TIME_ONLY: 'HH:mm',
  MONTH_YEAR: 'MM/yyyy',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_VISIBLE_PAGES: 5,
} as const;

import { API_BASE_URL } from '../api';
export const API_CONFIG = {
  TIMEOUT: 30000, 
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, 
  BASE_URL: API_BASE_URL,
} as const;

export const ANIMATIONS = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
  VERY_SLOW: '1000ms',
} as const;

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

export const Z_INDEX = {
  DROPDOWN: 1000,
  TOOLTIP: 1010,
  MODAL: 1020,
  NOTIFICATION: 1030,
  LOADING: 1040,
} as const;

export const STATUS_INDICATORS = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  SUSPENDED: 'Tạm dừng',
} as const;

export const LABELS = {
  ACTIONS: 'Thao tác',
  STATUS: 'Trạng thái',
  DATE: 'Ngày',
  TIME: 'Thời gian',
  NAME: 'Tên',
  DESCRIPTION: 'Mô tả',
  CATEGORY: 'Danh mục',
  PRIORITY: 'Ưu tiên',
  CREATED_AT: 'Ngày tạo',
  UPDATED_AT: 'Ngày cập nhật',
  CREATED_BY: 'Người tạo',
  UPDATED_BY: 'Người cập nhật',
  SEARCH: 'Tìm kiếm',
  FILTER: 'Bộ lọc',
  SORT: 'Sắp xếp',
  EXPORT: 'Xuất dữ liệu',
  IMPORT: 'Nhập dữ liệu',
  SAVE: 'Lưu',
  CANCEL: 'Hủy',
  DELETE: 'Xóa',
  EDIT: 'Sửa',
  VIEW: 'Xem',
  ADD: 'Thêm',
  BACK: 'Quay lại',
  NEXT: 'Tiếp theo',
  PREVIOUS: 'Trước',
  CLOSE: 'Đóng',
  CONFIRM: 'Xác nhận',
  YES: 'Có',
  NO: 'Không',
  LOADING: 'Đang tải...',
  NO_DATA: 'Không có dữ liệu',
  ERROR: 'Lỗi',
  SUCCESS: 'Thành công',
  WARNING: 'Cảnh báo',
  INFO: 'Thông tin',
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_VN: /^(\+84|84|0)?[3|5|7|8|9][0-9]{8}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;


export const VALIDATION_MESSAGES = {
  REQUIRED: 'Trường này là bắt buộc',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_PHONE: 'Số điện thoại không hợp lệ',
  PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 8 ký tự',
  PASSWORD_TOO_WEAK: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  PASSWORDS_NOT_MATCH: 'Mật khẩu xác nhận không khớp',
  INVALID_DATE: 'Ngày không hợp lệ',
  DATE_IN_FUTURE: 'Ngày không thể ở tương lai',
  DATE_IN_PAST: 'Ngày không thể ở quá khứ',
  NUMBER_TOO_SMALL: 'Giá trị quá nhỏ',
  NUMBER_TOO_LARGE: 'Giá trị quá lớn',
  STRING_TOO_SHORT: 'Chuỗi quá ngắn',
  STRING_TOO_LONG: 'Chuỗi quá dài',
  INVALID_FORMAT: 'Định dạng không hợp lệ',
} as const;


export const getColorByStatus = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
    case 'success':
      return COLORS.SUCCESS[500];
    case 'pending':
    case 'in_progress':
    case 'warning':
      return COLORS.WARNING[500];
    case 'inactive':
    case 'rejected':
    case 'cancelled':
    case 'error':
      return COLORS.ERROR[500];
    case 'info':
      return COLORS.INFO[500];
    default:
      return COLORS.SECONDARY[500];
  }
};

export const getBackgroundColorByStatus = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
    case 'success':
      return COLORS.SUCCESS[50];
    case 'pending':
    case 'in_progress':
    case 'warning':
      return COLORS.WARNING[50];
    case 'inactive':
    case 'rejected':
    case 'cancelled':
    case 'error':
      return COLORS.ERROR[50];
    case 'info':
      return COLORS.INFO[50];
    default:
      return COLORS.SECONDARY[50];
  }
}; 

  
export const LOGIN_REDIRECT_DELAY = 0; 