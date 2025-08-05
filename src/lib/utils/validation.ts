// Common Validation Utilities
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Regular expressions for common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_VN: /^(\+84|84|0)?[3|5|7|8|9][0-9]{8}$/,
  NAME: /^[a-zA-ZÀ-ỹ\s]+$/,
  ROOM_NUMBER: /^[A-Z]?\d{2,3}[A-Z]?$/,
  SKU: /^[A-Z0-9-]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

// Common validation rules
export const VALIDATION_RULES = {
  REQUIRED: 'Trường này là bắt buộc',
  EMAIL_INVALID: 'Email không hợp lệ',
  PHONE_INVALID: 'Số điện thoại không hợp lệ',
  NAME_INVALID: 'Tên chỉ được chứa chữ cái và khoảng trắng',
  PASSWORD_WEAK: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
  DATE_FUTURE: 'Ngày không thể ở tương lai',
  DATE_PAST_REQUIRED: 'Ngày phải ở quá khứ',
  AGE_MINIMUM: 'Tuổi tối thiểu không hợp lệ',
  AMOUNT_POSITIVE: 'Số tiền phải lớn hơn 0',
} as const;

// Basic validation functions
export class Validator {
  
  /**
   * Validate required field
   */
  static required(value: any, fieldName: string): ValidationError | null {
    if (value === undefined || value === null || value === '' || (typeof value === 'string' && !value.trim())) {
      return {
        field: fieldName,
        message: `${fieldName} là bắt buộc`,
        code: 'REQUIRED'
      };
    }
    return null;
  }

  /**
   * Validate string length
   */
  static stringLength(
    value: string, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): ValidationError | null {
    if (typeof value !== 'string') return null;
    
    const length = value.trim().length;
    
    if (min !== undefined && length < min) {
      return {
        field: fieldName,
        message: `${fieldName} phải có ít nhất ${min} ký tự`,
        code: 'MIN_LENGTH'
      };
    }
    
    if (max !== undefined && length > max) {
      return {
        field: fieldName,
        message: `${fieldName} không được vượt quá ${max} ký tự`,
        code: 'MAX_LENGTH'
      };
    }
    
    return null;
  }

  /**
   * Validate email format
   */
  static email(value: string, fieldName: string = 'Email'): ValidationError | null {
    if (!value) return null;
    
    if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
      return {
        field: fieldName,
        message: 'Email không hợp lệ',
        code: 'INVALID_EMAIL'
      };
    }
    
    return null;
  }

  /**
   * Validate Vietnamese phone number
   */
  static phoneVN(value: string, fieldName: string = 'Số điện thoại'): ValidationError | null {
    if (!value) return null;
    
    const cleanPhone = value.replace(/\s/g, '');
    if (!VALIDATION_PATTERNS.PHONE_VN.test(cleanPhone)) {
      return {
        field: fieldName,
        message: 'Số điện thoại không đúng định dạng Việt Nam',
        code: 'INVALID_PHONE'
      };
    }
    
    return null;
  }

  /**
   * Validate Vietnamese name
   */
  static validateName(value: string, fieldName: string): ValidationError | null {
    if (!value) return null;
    
    if (!VALIDATION_PATTERNS.NAME.test(value.trim())) {
      return {
        field: fieldName,
        message: `${fieldName} chỉ được chứa chữ cái và khoảng trắng`,
        code: 'INVALID_NAME'
      };
    }
    
    return null;
  }

  /**
   * Validate date
   */
  static date(
    value: string, 
    fieldName: string, 
    options?: {
      allowFuture?: boolean;
      allowPast?: boolean;
      minAge?: number;
      maxAge?: number;
    }
  ): ValidationError | null {
    if (!value) return null;
    
    const date = new Date(value);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      return {
        field: fieldName,
        message: `${fieldName} không hợp lệ`,
        code: 'INVALID_DATE'
      };
    }
    
    if (options?.allowFuture === false && date > today) {
      return {
        field: fieldName,
        message: `${fieldName} không thể ở tương lai`,
        code: 'FUTURE_DATE'
      };
    }
    
    if (options?.allowPast === false && date < today) {
      return {
        field: fieldName,
        message: `${fieldName} không thể ở quá khứ`,
        code: 'PAST_DATE'
      };
    }
    
    if (options?.minAge || options?.maxAge) {
      const age = today.getFullYear() - date.getFullYear();
      
      if (options.minAge && age < options.minAge) {
        return {
          field: fieldName,
          message: `Tuổi phải ít nhất ${options.minAge}`,
          code: 'MIN_AGE'
        };
      }
      
      if (options.maxAge && age > options.maxAge) {
        return {
          field: fieldName,
          message: `Tuổi không được vượt quá ${options.maxAge}`,
          code: 'MAX_AGE'
        };
      }
    }
    
    return null;
  }

  /**
   * Validate number range
   */
  static numberRange(
    value: number, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): ValidationError | null {
    if (value === undefined || value === null) return null;
    
    if (min !== undefined && value < min) {
      return {
        field: fieldName,
        message: `${fieldName} phải >= ${min}`,
        code: 'MIN_VALUE'
      };
    }
    
    if (max !== undefined && value > max) {
      return {
        field: fieldName,
        message: `${fieldName} phải <= ${max}`,
        code: 'MAX_VALUE'
      };
    }
    
    return null;
  }

  /**
   * Validate password strength
   */
  static password(value: string, fieldName: string = 'Mật khẩu'): ValidationError | null {
    if (!value) return null;
    
    if (value.length < 8) {
      return {
        field: fieldName,
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
        code: 'WEAK_PASSWORD'
      };
    }
    
    if (!VALIDATION_PATTERNS.PASSWORD.test(value)) {
      return {
        field: fieldName,
        message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
        code: 'WEAK_PASSWORD'
      };
    }
    
    return null;
  }

  /**
   * Validate password confirmation
   */
  static passwordConfirm(
    password: string, 
    confirmPassword: string, 
    fieldName: string = 'Xác nhận mật khẩu'
  ): ValidationError | null {
    if (!confirmPassword) return null;
    
    if (password !== confirmPassword) {
      return {
        field: fieldName,
        message: 'Mật khẩu xác nhận không khớp',
        code: 'PASSWORD_MISMATCH'
      };
    }
    
    return null;
  }

  /**
   * Validate room number format
   */
  static roomNumber(value: string, fieldName: string = 'Số phòng'): ValidationError | null {
    if (!value) return null;
    
    if (!VALIDATION_PATTERNS.ROOM_NUMBER.test(value)) {
      return {
        field: fieldName,
        message: 'Số phòng không đúng định dạng (VD: 101, A201, 105B)',
        code: 'INVALID_ROOM'
      };
    }
    
    return null;
  }

  /**
   * Validate SKU format
   */
  static sku(value: string, fieldName: string = 'Mã SKU'): ValidationError | null {
    if (!value) return null;
    
    if (!VALIDATION_PATTERNS.SKU.test(value)) {
      return {
        field: fieldName,
        message: 'Mã SKU chỉ được chứa chữ hoa, số và dấu gạch ngang',
        code: 'INVALID_SKU'
      };
    }
    
    return null;
  }

  /**
   * Validate array has minimum items
   */
  static arrayMinLength<T>(
    value: T[], 
    fieldName: string, 
    min: number
  ): ValidationError | null {
    if (!Array.isArray(value) || value.length < min) {
      return {
        field: fieldName,
        message: `${fieldName} phải có ít nhất ${min} mục`,
        code: 'MIN_ITEMS'
      };
    }
    
    return null;
  }
}

// Form validation helper
export class FormValidator {
  private errors: ValidationError[] = [];

  /**
   * Add validation error
   */
  addError(error: ValidationError | null): FormValidator {
    if (error) {
      this.errors.push(error);
    }
    return this;
  }

  /**
   * Add multiple validation errors
   */
  addErrors(errors: (ValidationError | null)[]): FormValidator {
    errors.forEach(error => this.addError(error));
    return this;
  }

  /**
   * Get validation result
   */
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }

  /**
   * Get errors as object with field names as keys
   */
  getErrorsAsObject(): { [field: string]: string } {
    const errorObj: { [field: string]: string } = {};
    this.errors.forEach(error => {
      errorObj[error.field] = error.message;
    });
    return errorObj;
  }

  /**
   * Reset validator
   */
  reset(): FormValidator {
    this.errors = [];
    return this;
  }
}

// Common validation schemas
export const COMMON_VALIDATIONS = {
  /**
   * Validate user basic info
   */
  userBasicInfo: (data: {
    name?: string;
    email?: string;
    phone?: string;
  }): ValidationResult => {
    const validator = new FormValidator();
    
    validator
      .addError(Validator.required(data.name, 'Tên'))
      .addError(Validator.stringLength(data.name || '', 'Tên', 2, 50))
      .addError(Validator.validateName(data.name || '', 'Tên'))
      .addError(Validator.required(data.email, 'Email'))
      .addError(Validator.email(data.email || ''))
      .addError(Validator.required(data.phone, 'Số điện thoại'))
      .addError(Validator.phoneVN(data.phone || ''));
    
    return validator.getResult();
  },

  /**
   * Validate resident basic info
   */
  residentBasicInfo: (data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    room?: string;
    contactPhone?: string;
  }): ValidationResult => {
    const validator = new FormValidator();
    
    validator
      .addError(Validator.required(data.firstName, 'Tên'))
      .addError(Validator.stringLength(data.firstName || '', 'Tên', 2, 50))
      .addError(Validator.validateName(data.firstName || '', 'Tên'))
      .addError(Validator.required(data.lastName, 'Họ'))
      .addError(Validator.stringLength(data.lastName || '', 'Họ', 2, 50))
      .addError(Validator.validateName(data.lastName || '', 'Họ'))
      .addError(Validator.required(data.dateOfBirth, 'Ngày sinh'))
      .addError(Validator.date(data.dateOfBirth || '', 'Ngày sinh', { 
        allowFuture: false, 
        minAge: 50, 
        maxAge: 120 
      }))
      .addError(Validator.required(data.room, 'Số phòng'))
      .addError(Validator.roomNumber(data.room || ''))
      .addError(Validator.required(data.contactPhone, 'Số điện thoại liên hệ'))
      .addError(Validator.phoneVN(data.contactPhone || ''));
    
    return validator.getResult();
  },

  /**
   * Validate inventory item
   */
  inventoryItem: (data: {
    name?: string;
    category?: string;
    sku?: string;
    currentStock?: number;
    minStock?: number;
    maxStock?: number;
    unit?: string;
    supplier?: string;
    location?: string;
    expiryDate?: string;
  }): ValidationResult => {
    const validator = new FormValidator();
    
    validator
      .addError(Validator.required(data.name, 'Tên vật tư'))
      .addError(Validator.stringLength(data.name || '', 'Tên vật tư', 1, 100))
      .addError(Validator.required(data.category, 'Danh mục'))
      .addError(Validator.required(data.sku, 'Mã SKU'))
      .addError(Validator.sku(data.sku || ''))
      .addError(Validator.required(data.currentStock, 'Số lượng tồn kho'))
      .addError(Validator.numberRange(data.currentStock || 0, 'Số lượng tồn kho', 0))
      .addError(Validator.required(data.minStock, 'Số lượng tối thiểu'))
      .addError(Validator.numberRange(data.minStock || 0, 'Số lượng tối thiểu', 0))
      .addError(Validator.required(data.maxStock, 'Số lượng tối đa'))
      .addError(Validator.numberRange(data.maxStock || 0, 'Số lượng tối đa', 0))
      .addError(Validator.required(data.unit, 'Đơn vị'))
      .addError(Validator.required(data.supplier, 'Nhà cung cấp'))
      .addError(Validator.required(data.location, 'Vị trí lưu trữ'));
    
    // Custom validation for stock relationships
    if (data.minStock !== undefined && data.maxStock !== undefined && data.minStock > data.maxStock) {
      validator.addError({
        field: 'minStock',
        message: 'Số lượng tối thiểu không được lớn hơn số lượng tối đa',
        code: 'INVALID_STOCK_RANGE'
      });
    }
    
    if (data.currentStock !== undefined && data.minStock !== undefined && data.currentStock < data.minStock) {
      validator.addError({
        field: 'currentStock',
        message: 'Số lượng tồn kho không được nhỏ hơn số lượng tối thiểu',
        code: 'STOCK_BELOW_MIN'
      });
    }
    
    if (data.expiryDate) {
      validator.addError(Validator.date(data.expiryDate, 'Ngày hết hạn', { allowPast: false }));
    }
    
    return validator.getResult();
  },

  /**
   * Validate activity form
   */
  activityForm: (data: {
    name?: string;
    description?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    category?: string;
    location?: string;
    facilitator?: string;
    maxCapacity?: number;
    ageGroupSuitability?: string[];
    healthRequirements?: string[];
  }): ValidationResult => {
    const validator = new FormValidator();
    
    validator
      .addError(Validator.required(data.name, 'Tên hoạt động'))
      .addError(Validator.stringLength(data.name || '', 'Tên hoạt động', 3))
      .addError(Validator.required(data.description, 'Mô tả hoạt động'))
      .addError(Validator.stringLength(data.description || '', 'Mô tả hoạt động', 10))
      .addError(Validator.required(data.date, 'Ngày tổ chức'))
      .addError(Validator.date(data.date || '', 'Ngày tổ chức', { allowPast: false }))
      .addError(Validator.required(data.startTime, 'Thời gian bắt đầu'))
      .addError(Validator.required(data.endTime, 'Thời gian kết thúc'))
      .addError(Validator.required(data.category, 'Phân loại hoạt động'))
      .addError(Validator.required(data.location, 'Địa điểm'))
      .addError(Validator.required(data.facilitator, 'Hướng dẫn viên'))
      .addError(Validator.numberRange(data.maxCapacity || 0, 'Sức chứa', 1, 50))
      .addError(Validator.arrayMinLength(data.ageGroupSuitability || [], 'Nhóm tuổi phù hợp', 1))
      .addError(Validator.arrayMinLength(data.healthRequirements || [], 'Yêu cầu sức khỏe', 1));
    
    // Time validation
    if (data.startTime && data.endTime) {
      const start = new Date(`1970-01-01T${data.startTime}`);
      const end = new Date(`1970-01-01T${data.endTime}`);
      
      if (start >= end) {
        validator.addError({
          field: 'endTime',
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
          code: 'INVALID_TIME_RANGE'
        });
      }
      
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration > 180) {
        validator.addError({
          field: 'endTime',
          message: 'Hoạt động không nên quá 3 giờ',
          code: 'DURATION_TOO_LONG'
        });
      }
    }
    
    return validator.getResult();
  }
};

// Export utility functions for common use cases
export const validateForm = <T extends Record<string, any>>(
  data: T,
  validationSchema: (data: T) => ValidationResult
): { isValid: boolean; errors: { [K in keyof T]?: string } } => {
  const result = validationSchema(data);
  const errorObj: { [K in keyof T]?: string } = {};
  
  result.errors.forEach(error => {
    errorObj[error.field as keyof T] = error.message;
  });
  
  return {
    isValid: result.isValid,
    errors: errorObj
  };
}; 

/**
 * Format ngày theo định dạng dd/mm/yyyy
 * @param date - Date object hoặc string
 * @returns string - ngày theo định dạng dd/mm/yyyy
 */
export const formatDateDDMMYYYY = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '';
  }
};

/**
 * Format ngày theo định dạng dd/mm/yyyy với điều chỉnh múi giờ GMT+7
 * Sử dụng để đồng bộ với cách xử lý thời gian của trang staff
 * @param date - Date object hoặc string
 * @returns string - ngày theo định dạng dd/mm/yyyy
 */
export const formatDateDDMMYYYYWithTimezone = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // Subtract 7 hours to compensate for backend GMT+7 adjustment (same as staff page)
    const adjustedDate = new Date(dateObj.getTime() - 7 * 60 * 60 * 1000);
    
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Error processing date with timezone:', error);
    return formatDateDDMMYYYY(date);
  }
};

/**
 * Format thời gian theo định dạng HH:mm với điều chỉnh múi giờ GMT+7
 * Sử dụng để đồng bộ với cách xử lý thời gian của trang staff
 * @param date - Date object hoặc string
 * @returns string - thời gian theo định dạng HH:mm
 */
export const formatTimeWithTimezone = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // Subtract 7 hours to compensate for backend GMT+7 adjustment (same as staff page)
    const adjustedDate = new Date(dateObj.getTime() - 7 * 60 * 60 * 1000);
    
    return adjustedDate.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.warn('Error processing time with timezone:', error);
    return '';
  }
};

/**
 * Lấy ngày theo định dạng YYYY-MM-DD với điều chỉnh múi giờ GMT+7
 * Sử dụng để so sánh ngày tháng một cách nhất quán
 * @param date - Date object hoặc string
 * @returns string - ngày theo định dạng YYYY-MM-DD
 */
export const getDateYYYYMMDDWithTimezone = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // Subtract 7 hours to compensate for backend GMT+7 adjustment (same as staff page)
    const adjustedDate = new Date(dateObj.getTime() - 7 * 60 * 60 * 1000);
    
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error processing date for comparison:', error);
    return '';
  }
}; 