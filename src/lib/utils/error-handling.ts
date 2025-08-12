import { toast } from 'react-toastify';

// Error handling utilities for consistent error messages across the application

export interface AppError {
  code: string;
  message: string;
  details?: any;
  context?: string;
}

// Error codes for different types of errors
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// User-friendly error messages in Vietnamese
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
  [ERROR_CODES.UNAUTHORIZED]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  [ERROR_CODES.FORBIDDEN]: 'Bạn không có quyền thực hiện thao tác này.',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Không tìm thấy thông tin cần thiết.',
  [ERROR_CODES.DUPLICATE_RESOURCE]: 'Thông tin đã tồn tại trong hệ thống.',
  [ERROR_CODES.SERVER_ERROR]: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  [ERROR_CODES.NETWORK_ERROR]: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Có lỗi không xác định xảy ra. Vui lòng thử lại.',
} as const;

// Specific error message mappings for common backend errors
export const BACKEND_ERROR_MESSAGES = {
  // User/Account related errors
  'Username already exists': 'Tên đăng nhập đã được sử dụng. Vui lòng chọn tên đăng nhập khác.',
  'Email already exists': 'Email đã được sử dụng. Vui lòng sử dụng email khác.',
  'Email đã được sử dụng bởi người dùng khác': 'Email đã được sử dụng bởi người dùng khác. Vui lòng sử dụng email khác.',
  'Invalid email format': 'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.',
  'Invalid user id': 'ID người dùng không hợp lệ.',
  'User not found': 'Không tìm thấy người dùng.',
  'Old password is incorrect': 'Mật khẩu cũ không chính xác.',
  'New passwords do not match': 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
  
  // Date/Time related errors
  'Invalid join_date format': 'Định dạng ngày vào làm không hợp lệ. Vui lòng kiểm tra lại.',
  'Invalid date format': 'Định dạng ngày không hợp lệ. Vui lòng kiểm tra lại.',
  
  // Validation errors
  'Invalid input': 'Dữ liệu đầu vào không hợp lệ.',
  'Required field': 'Trường này là bắt buộc.',
  'must be a number': 'phải là số.',
  'must be greater than': 'phải lớn hơn.',
  'must be less than': 'phải nhỏ hơn.',
  'must be between': 'phải nằm trong khoảng.',
  'must be an integer': 'phải là số nguyên.',
  'decimal places': 'chữ số thập phân.',
  'maximum': 'tối đa.',
  'minimum': 'tối thiểu.',
  'value': 'giá trị.',
  'values': 'giá trị.',
  
  // Vital signs related errors
  'blood pressure': 'Huyết áp không hợp lệ. Vui lòng kiểm tra lại định dạng (ví dụ: 120/80).',
  'heart rate': 'Nhịp tim không hợp lệ. Vui lòng nhập giá trị từ 40-200 bpm.',
  'temperature': 'Nhiệt độ không hợp lệ. Vui lòng nhập giá trị từ 35°C đến 42°C.',
  'oxygen saturation': 'Nồng độ oxy không hợp lệ. Vui lòng nhập giá trị từ 70% đến 100%.',
  'respiratory rate': 'Nhịp thở không hợp lệ. Vui lòng nhập giá trị từ 8-40 lần/phút.',
  'weight': 'Cân nặng không hợp lệ. Vui lòng nhập giá trị từ 30kg đến 150kg.',
  
  // General errors
  'No valid fields to update': 'Không có dữ liệu nào để cập nhật.',
  'No valid fields to update': 'Không có dữ liệu nào để cập nhật.',
} as const;

export class ErrorHandler {
  /**
   * Create a standardized error object
   */
  static createError(
    code: string, 
    message?: string, 
    details?: any, 
    context?: string
  ): AppError {
    return {
      code,
      message: message || ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      details,
      context,
    };
  }

  /**
   * Handle API errors and return user-friendly messages
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
          message = this.translateBackendMessage(data?.message || data?.detail);
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
          message = this.translateBackendMessage(data?.message || data?.detail);
          break;
        case 422:
          code = ERROR_CODES.VALIDATION_ERROR;
          message = this.translateBackendMessage(data?.message || data?.detail);
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
          message = this.translateBackendMessage(data?.message || data?.detail);
      }

      return this.createError(code, message, { status, data }, context);
    } 
    
    if (error.request) {
      if (error.code === 'ECONNABORTED') {
        return this.createError(ERROR_CODES.TIMEOUT_ERROR, undefined, error, context);
      }
      return this.createError(ERROR_CODES.NETWORK_ERROR, undefined, error, context);
    }
    
    // Handle other types of errors
    if (error.message) {
      return this.createError(ERROR_CODES.UNKNOWN_ERROR, this.translateBackendMessage(error.message), error, context);
    }
    
    return this.createError(ERROR_CODES.UNKNOWN_ERROR, undefined, error, context);
  }

  /**
   * Translate backend error messages to user-friendly Vietnamese messages
   */
  static translateBackendMessage(message: string): string {
    if (!message) return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    
    // Check for exact matches first
    for (const [key, value] of Object.entries(BACKEND_ERROR_MESSAGES)) {
      if (message.includes(key)) {
        return value;
      }
    }
    
    // Handle common patterns
    let translatedMessage = message
      .replace(/Please enter a valid value/g, 'Vui lòng nhập giá trị hợp lệ')
      .replace(/The two nearest valid values are/g, 'Hai giá trị hợp lệ gần nhất là')
      .replace(/Please enter a valid value\. The two nearest valid values are/g, 'Vui lòng nhập giá trị hợp lệ. Hai giá trị hợp lệ gần nhất là')
      .replace(/Invalid input/g, 'Dữ liệu đầu vào không hợp lệ')
      .replace(/Required field/g, 'Trường bắt buộc')
      .replace(/must be a number/g, 'phải là số')
      .replace(/must be greater than/g, 'phải lớn hơn')
      .replace(/must be less than/g, 'phải nhỏ hơn')
      .replace(/must be between/g, 'phải nằm trong khoảng')
      .replace(/must be an integer/g, 'phải là số nguyên')
      .replace(/decimal places/g, 'chữ số thập phân')
      .replace(/maximum/g, 'tối đa')
      .replace(/minimum/g, 'tối thiểu')
      .replace(/value/g, 'giá trị')
      .replace(/values/g, 'giá trị');
    
    return translatedMessage || message;
  }

  /**
   * Extract field-specific errors from API response
   */
  static extractFieldErrors(error: any): { [key: string]: string } {
    const fieldErrors: { [key: string]: string } = {};
    
    if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      // FastAPI validation error format
      error.response.data.detail.forEach((item: any) => {
        if (item.loc && item.msg) {
          const field = item.loc[item.loc.length - 1];
          fieldErrors[field] = this.translateBackendMessage(item.msg);
        }
      });
    }
    
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      // Custom validation error format
      error.response.data.errors.forEach((err: any) => {
        if (err.field && err.message) {
          fieldErrors[err.field] = this.translateBackendMessage(err.message);
        }
      });
    }
    
    return fieldErrors;
  }

  /**
   * Get a user-friendly error message for display
   */
  static getUserFriendlyMessage(error: any): string {
    const appError = this.handleApiError(error);
    return appError.message;
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