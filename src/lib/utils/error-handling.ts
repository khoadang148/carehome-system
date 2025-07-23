import { toast } from 'react-toastify';

// Error types and interfaces
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  source: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
  endpoint?: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error codes constants
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  
  // System errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
} as const;

// Error messages in Vietnamese
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
  [ERROR_CODES.SERVER_ERROR]: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  [ERROR_CODES.UNAUTHORIZED]: 'Bạn cần đăng nhập để thực hiện thao tác này.',
  [ERROR_CODES.FORBIDDEN]: 'Bạn không có quyền thực hiện thao tác này.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  [ERROR_CODES.REQUIRED_FIELD]: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
  [ERROR_CODES.INVALID_FORMAT]: 'Định dạng dữ liệu không đúng.',
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'Thao tác vi phạm quy tắc nghiệp vụ.',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Không đủ quyền hạn để thực hiện thao tác.',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Không tìm thấy tài nguyên yêu cầu.',
  [ERROR_CODES.DUPLICATE_RESOURCE]: 'Tài nguyên đã tồn tại.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
  [ERROR_CODES.DATABASE_ERROR]: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
  [ERROR_CODES.FILE_UPLOAD_ERROR]: 'Lỗi tải tệp lên. Vui lòng thử lại.',
} as const;

// Error severity mapping
export const ERROR_SEVERITY: Record<string, ErrorSeverity> = {
  [ERROR_CODES.NETWORK_ERROR]: 'medium',
  [ERROR_CODES.TIMEOUT_ERROR]: 'medium',
  [ERROR_CODES.SERVER_ERROR]: 'high',
  [ERROR_CODES.UNAUTHORIZED]: 'medium',
  [ERROR_CODES.FORBIDDEN]: 'medium',
  [ERROR_CODES.TOKEN_EXPIRED]: 'medium',
  [ERROR_CODES.VALIDATION_ERROR]: 'low',
  [ERROR_CODES.REQUIRED_FIELD]: 'low',
  [ERROR_CODES.INVALID_FORMAT]: 'low',
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'medium',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'medium',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'low',
  [ERROR_CODES.DUPLICATE_RESOURCE]: 'low',
  [ERROR_CODES.UNKNOWN_ERROR]: 'high',
  [ERROR_CODES.DATABASE_ERROR]: 'critical',
  [ERROR_CODES.FILE_UPLOAD_ERROR]: 'medium',
};

// Error handling class
export class ErrorHandler {
  
  /**
   * Create standardized error object
   */
  static createError(
    code: string,
    message?: string,
    details?: any,
    source: string = 'unknown'
  ): AppError {
    return {
      code,
      message: message || ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      details,
      timestamp: new Date(),
      source
    };
  }

  /**
   * Handle API errors
   */
  static handleApiError(error: any, context: string = 'API'): AppError {
    console.error(`${context} Error:`, error);

    if (error.response) {
      const { status, data } = error.response;
      
      let code: string;
      let message: string;

      switch (status) {
        case 400:
          code = ERROR_CODES.VALIDATION_ERROR;
          message = data?.message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR];
          break;
        case 401:
          code = ERROR_CODES.UNAUTHORIZED;
          message = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED];
          break;
        case 403:
          code = ERROR_CODES.FORBIDDEN;
          message = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN];
          break;
        case 404:
          code = ERROR_CODES.RESOURCE_NOT_FOUND;
          message = ERROR_MESSAGES[ERROR_CODES.RESOURCE_NOT_FOUND];
          break;
        case 409:
          code = ERROR_CODES.DUPLICATE_RESOURCE;
          message = data?.message || ERROR_MESSAGES[ERROR_CODES.DUPLICATE_RESOURCE];
          break;
        case 422:
          code = ERROR_CODES.VALIDATION_ERROR;
          message = data?.message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR];
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          code = ERROR_CODES.SERVER_ERROR;
          message = ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR];
          break;
        default:
          code = ERROR_CODES.UNKNOWN_ERROR;
          message = data?.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
      }

      return this.createError(code, message, { status, data }, context);
    } 
    
    if (error.request) {
      if (error.code === 'ECONNABORTED') {
        return this.createError(ERROR_CODES.TIMEOUT_ERROR, undefined, error, context);
      }
      return this.createError(ERROR_CODES.NETWORK_ERROR, undefined, error, context);
    }
    
    return this.createError(ERROR_CODES.UNKNOWN_ERROR, error.message, error, context);
  }

  /**
   * Handle form validation errors
   */
  static handleValidationErrors(
    errors: { [field: string]: string }
  ): AppError {
    const errorCount = Object.keys(errors).length;
    const message = errorCount === 1 
      ? Object.values(errors)[0]
      : `Có ${errorCount} lỗi cần được sửa`;

    return this.createError(
      ERROR_CODES.VALIDATION_ERROR,
      message,
      errors,
      'form_validation'
    );
  }

  /**
   * Show error notification
   */
  static showError(error: AppError | string, options?: {
    position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
    autoClose?: number;
    hideProgressBar?: boolean;
  }) {
    const message = typeof error === 'string' ? error : error.message;
    const defaultOptions = {
      position: 'top-right' as const,
      autoClose: 5000,
      hideProgressBar: false,
      ...options
    };

    toast.error(message, defaultOptions);
  }

  /**
   * Show success notification
   */
  static showSuccess(message: string, options?: {
    position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
    autoClose?: number;
    hideProgressBar?: boolean;
  }) {
    const defaultOptions = {
      position: 'top-right' as const,
      autoClose: 3000,
      hideProgressBar: false,
      ...options
    };

    toast.success(message, defaultOptions);
  }

  /**
   * Show warning notification
   */
  static showWarning(message: string, options?: {
    position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
    autoClose?: number;
    hideProgressBar?: boolean;
  }) {
    const defaultOptions = {
      position: 'top-right' as const,
      autoClose: 4000,
      hideProgressBar: false,
      ...options
    };

    toast.warning(message, defaultOptions);
  }

  /**
   * Show info notification
   */
  static showInfo(message: string, options?: {
    position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
    autoClose?: number;
    hideProgressBar?: boolean;
  }) {
    const defaultOptions = {
      position: 'top-right' as const,
      autoClose: 3000,
      hideProgressBar: false,
      ...options
    };

    toast.info(message, defaultOptions);
  }

  /**
   * Log error for debugging (development mode)
   */
  static logError(error: AppError, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Timestamp:', error.timestamp);
      console.error('Source:', error.source);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.groupEnd();
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError | any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'code' in error) {
      return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    }

    return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  }

  /**
   * Determine if error requires user action
   */
  static requiresUserAction(error: AppError): boolean {
    const actionRequiredCodes = [
      ERROR_CODES.UNAUTHORIZED,
      ERROR_CODES.TOKEN_EXPIRED,
      ERROR_CODES.FORBIDDEN,
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.REQUIRED_FIELD,
      ERROR_CODES.INVALID_FORMAT,
    ];

    return actionRequiredCodes.includes(error.code as any);
  }

  /**
   * Get error severity
   */
  static getSeverity(error: AppError): ErrorSeverity {
    return ERROR_SEVERITY[error.code] || 'medium';
  }
}

// Hook for error handling in React components
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string) => {
    const appError = ErrorHandler.handleApiError(error, context);
    ErrorHandler.logError(appError, context);
    ErrorHandler.showError(appError);
    return appError;
  };

  const handleValidationError = (errors: { [field: string]: string }) => {
    const appError = ErrorHandler.handleValidationErrors(errors);
    ErrorHandler.showError(appError);
    return appError;
  };

  const showSuccess = (message: string) => {
    ErrorHandler.showSuccess(message);
  };

  const showWarning = (message: string) => {
    ErrorHandler.showWarning(message);
  };

  const showInfo = (message: string) => {
    ErrorHandler.showInfo(message);
  };

  return {
    handleError,
    handleValidationError,
    showSuccess,
    showWarning,
    showInfo,
  };
};

// Async operation wrapper with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: string,
  showSuccessMessage?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await operation();
    
    if (showSuccessMessage) {
      ErrorHandler.showSuccess(showSuccessMessage);
    }
    
    return { data, error: null };
  } catch (error) {
    const appError = ErrorHandler.handleApiError(error, context);
    ErrorHandler.logError(appError, context);
    ErrorHandler.showError(appError);
    
    return { data: null, error: appError };
  }
};

// Form submission wrapper with error handling
export const withFormErrorHandling = async <T>(
  operation: () => Promise<T>,
  validationErrors: { [field: string]: string },
  context?: string,
  successMessage?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  // Check validation errors first
  if (Object.keys(validationErrors).length > 0) {
    const validationError = ErrorHandler.handleValidationErrors(validationErrors);
    ErrorHandler.showError(validationError);
    return { data: null, error: validationError };
  }

  return withErrorHandling(operation, context, successMessage);
}; 