// User-friendly error handling utilities

export interface UserFriendlyError {
  message: string;
  fieldErrors?: { [key: string]: string };
  code?: string;
}

// Common backend error message translations
const ERROR_TRANSLATIONS = {
  // User/Account related
  'Username already exists': 'Tên đăng nhập đã được sử dụng. Vui lòng chọn tên đăng nhập khác.',
  'Email already exists': 'Email đã được sử dụng. Vui lòng sử dụng email khác.',
  'Email đã được sử dụng bởi người dùng khác': 'Email đã được sử dụng bởi người dùng khác. Vui lòng sử dụng email khác.',
  'Invalid email format': 'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.',
  'Invalid user id': 'ID người dùng không hợp lệ.',
  'User not found': 'Không tìm thấy người dùng.',
  'Old password is incorrect': 'Mật khẩu cũ không chính xác.',
  'New passwords do not match': 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
  
  // Date/Time related
  'Invalid join_date format': 'Định dạng ngày vào làm không hợp lệ. Vui lòng kiểm tra lại.',
  'Invalid date format': 'Định dạng ngày không hợp lệ. Vui lòng kiểm tra lại.',
  
  // General validation
  'Invalid input': 'Dữ liệu đầu vào không hợp lệ.',
  'Required field': 'Trường này là bắt buộc.',
  'No valid fields to update': 'Không có dữ liệu nào để cập nhật.',
} as const;

export class UserFriendlyErrorHandler {
  /**
   * Handle API errors and return user-friendly messages
   */
  static handleError(error: any): UserFriendlyError {
    console.error('API Error:', error);
    
    let message = 'Có lỗi xảy ra. Vui lòng thử lại.';
    let fieldErrors: { [key: string]: string } = {};
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          message = this.translateMessage(data?.message || data?.detail);
          fieldErrors = this.extractFieldErrors(data);
          break;
        case 401:
          message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          break;
        case 403:
          message = 'Bạn không có quyền thực hiện thao tác này.';
          break;
        case 404:
          message = 'Không tìm thấy thông tin cần thiết.';
          break;
        case 409:
          message = this.translateMessage(data?.message || data?.detail);
          break;
        case 422:
          message = this.translateMessage(data?.message || data?.detail);
          fieldErrors = this.extractFieldErrors(data);
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'Lỗi máy chủ. Vui lòng thử lại sau.';
          break;
        default:
          message = this.translateMessage(data?.message || data?.detail);
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        message = 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.';
      } else {
        message = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
      }
    } else if (error.message) {
      message = this.translateMessage(error.message);
    }
    
    return { message, fieldErrors };
  }
  
  /**
   * Translate backend error messages to Vietnamese
   */
  static translateMessage(message: string): string {
    if (!message) return 'Có lỗi xảy ra. Vui lòng thử lại.';
    
    // Check for exact matches
    for (const [key, value] of Object.entries(ERROR_TRANSLATIONS)) {
      if (message.includes(key)) {
        return value;
      }
    }
    
    // Handle common patterns
    let translated = message
      .replace(/Please enter a valid value/g, 'Vui lòng nhập giá trị hợp lệ')
      .replace(/Invalid input/g, 'Dữ liệu đầu vào không hợp lệ')
      .replace(/Required field/g, 'Trường này là bắt buộc')
      .replace(/must be a number/g, 'phải là số')
      .replace(/must be greater than/g, 'phải lớn hơn')
      .replace(/must be less than/g, 'phải nhỏ hơn')
      .replace(/must be between/g, 'phải nằm trong khoảng');
    
    return translated || message;
  }
  
  /**
   * Extract field-specific errors from API response
   */
  static extractFieldErrors(data: any): { [key: string]: string } {
    const fieldErrors: { [key: string]: string } = {};
    
    if (data?.detail && Array.isArray(data.detail)) {
      // FastAPI validation error format
      data.detail.forEach((item: any) => {
        if (item.loc && item.msg) {
          const field = item.loc[item.loc.length - 1];
          fieldErrors[field] = this.translateMessage(item.msg);
        }
      });
    }
    
    if (data?.errors && Array.isArray(data.errors)) {
      // Custom validation error format
      data.errors.forEach((err: any) => {
        if (err.field && err.message) {
          fieldErrors[err.field] = this.translateMessage(err.message);
        }
      });
    }
    
    return fieldErrors;
  }
}
