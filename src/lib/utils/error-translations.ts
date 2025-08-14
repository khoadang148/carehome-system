// Error message translations from English to Vietnamese
export const errorTranslations: Record<string, string> = {
  // Common validation errors
  'date_of_birth must be a valid ISO 8601 date string': 'Ngày sinh phải theo định dạng ISO 8601 hợp lệ',
  'date_of_birth should not be empty': 'Ngày sinh không được để trống',
  'date_of_birth must be a valid date': 'Ngày sinh phải là ngày hợp lệ',
  'admission_date must be a valid ISO 8601 date string': 'Ngày nhập viện phải theo định dạng ISO 8601 hợp lệ',
  'admission_date should not be empty': 'Ngày nhập viện không được để trống',
  'admission_date must be a valid date': 'Ngày nhập viện phải là ngày hợp lệ',
  
  // Required field errors
  'full_name should not be empty': 'Họ và tên không được để trống',
  'full_name must be a string': 'Họ và tên phải là chuỗi ký tự',
  'full_name must be longer than or equal to 2 characters': 'Họ và tên phải có ít nhất 2 ký tự',
  'full_name must be shorter than or equal to 50 characters': 'Họ và tên không được quá 50 ký tự',
  
  'gender should not be empty': 'Giới tính không được để trống',
  'gender must be one of the following values: male, female, other': 'Giới tính phải là một trong các giá trị: nam, nữ, khác',
  
  'care_level should not be empty': 'Mức độ chăm sóc không được để trống',
  'care_level must be one of the following values: Cơ bản, Nâng cao, Cao cấp, Đặc biệt': 'Mức độ chăm sóc phải là một trong các giá trị: Cơ bản, Nâng cao, Cao cấp, Đặc biệt',
  
  'status should not be empty': 'Trạng thái không được để trống',
  'status must be one of the following values: active, inactive, discharged': 'Trạng thái phải là một trong các giá trị: hoạt động, không hoạt động, đã xuất viện',
  
  // Contact information errors
  'emergency_contact.name should not be empty': 'Tên người liên hệ khẩn cấp không được để trống',
  'emergency_contact.phone should not be empty': 'Số điện thoại liên hệ khẩn cấp không được để trống',
  'emergency_contact.phone must be a valid phone number': 'Số điện thoại liên hệ khẩn cấp không hợp lệ',
  'emergency_contact.email should not be empty': 'Email liên hệ khẩn cấp không được để trống',
  'emergency_contact.email must be an email': 'Email liên hệ khẩn cấp không hợp lệ',
  'emergency_contact.relationship should not be empty': 'Mối quan hệ với người liên hệ khẩn cấp không được để trống',
  
  // Medical information errors
  'medical_history must be a string': 'Tiền sử bệnh lý phải là chuỗi ký tự',
  'current_medications must be an array': 'Thuốc hiện tại phải là danh sách',
  'allergies must be an array': 'Dị ứng phải là danh sách',
  
  // Relationship errors
  'relationship should not be empty': 'Mối quan hệ không được để trống',
  'relationship must be a string': 'Mối quan hệ phải là chuỗi ký tự',
  
  // Avatar errors
  'avatar must be a string': 'Ảnh đại diện phải là chuỗi ký tự',
  'avatar must be a valid URL': 'Ảnh đại diện phải là URL hợp lệ',
  
  // Family member errors
  'family_member_id should not be empty': 'ID thành viên gia đình không được để trống',
  'family_member_id must be a valid MongoDB ObjectId': 'ID thành viên gia đình không hợp lệ',
  
  // General validation errors
  'should not be empty': 'không được để trống',
  'must be a string': 'phải là chuỗi ký tự',
  'must be a number': 'phải là số',
  'must be an array': 'phải là danh sách',
  'must be a valid email': 'phải là email hợp lệ',
  'must be a valid phone number': 'phải là số điện thoại hợp lệ',
  'must be a valid date': 'phải là ngày hợp lệ',
  'must be a valid URL': 'phải là URL hợp lệ',
  'must be a valid MongoDB ObjectId': 'phải là ID hợp lệ',
  
  // HTTP status errors
  'Bad Request': 'Yêu cầu không hợp lệ',
  'Unauthorized': 'Không có quyền truy cập',
  'Forbidden': 'Bị cấm truy cập',
  'Not Found': 'Không tìm thấy',
  'Internal Server Error': 'Lỗi máy chủ nội bộ',
  'Service Unavailable': 'Dịch vụ không khả dụng',
  
  // Common API errors
  'Request failed with status code 400': 'Yêu cầu thất bại với mã lỗi 400',
  'Request failed with status code 401': 'Yêu cầu thất bại với mã lỗi 401',
  'Request failed with status code 403': 'Yêu cầu thất bại với mã lỗi 403',
  'Request failed with status code 404': 'Yêu cầu thất bại với mã lỗi 404',
  'Request failed with status code 500': 'Yêu cầu thất bại với mã lỗi 500',
  
  // Network errors
  'Network Error': 'Lỗi kết nối mạng',
  'timeout of': 'Hết thời gian chờ',
  'ECONNREFUSED': 'Kết nối bị từ chối',
  'ENOTFOUND': 'Không tìm thấy máy chủ',
  
  // File upload errors
  'File too large': 'File quá lớn',
  'Invalid file type': 'Loại file không hợp lệ',
  'Upload failed': 'Tải lên thất bại',
  
  // Authentication errors
  'Invalid credentials': 'Thông tin đăng nhập không hợp lệ',
  'Token expired': 'Phiên đăng nhập đã hết hạn',
  'Access denied': 'Truy cập bị từ chối',
  
  // Database errors
  'Duplicate key error': 'Dữ liệu đã tồn tại',
  'Validation failed': 'Xác thực dữ liệu thất bại',
  'Document not found': 'Không tìm thấy dữ liệu',
  
  // Business logic errors
  'Resident already exists': 'Người cao tuổi đã tồn tại',
  'Family member not found': 'Không tìm thấy thành viên gia đình',
  'Activity capacity exceeded': 'Hoạt động đã đạt sức chứa tối đa',
  'Invalid care level': 'Mức độ chăm sóc không hợp lệ',
  'Invalid status': 'Trạng thái không hợp lệ',
  
  // Default fallback
  'Unknown error': 'Lỗi không xác định'
};

/**
 * Translate error message from English to Vietnamese
 * @param message - Error message in English
 * @returns Translated error message in Vietnamese
 */
export const translateError = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return 'Lỗi không xác định';
  }
  
  // Try exact match first
  if (errorTranslations[message]) {
    return errorTranslations[message];
  }
  
  // Try partial match for common patterns
  for (const [english, vietnamese] of Object.entries(errorTranslations)) {
    if (message.includes(english)) {
      return message.replace(english, vietnamese);
    }
  }
  
  // Try to translate common validation patterns
  let translatedMessage = message;
  
  // Replace common validation patterns
  Object.entries(errorTranslations).forEach(([english, vietnamese]) => {
    if (english.includes('should not be empty') || 
        english.includes('must be a') || 
        english.includes('must be an') ||
        english.includes('must be a valid')) {
      translatedMessage = translatedMessage.replace(new RegExp(english, 'gi'), vietnamese);
    }
  });
  
  // If no translation found, return original message
  return translatedMessage !== message ? translatedMessage : message;
};

/**
 * Extract field name from validation error message
 * @param message - Error message
 * @returns Field name in Vietnamese
 */
export const getFieldName = (message: string): string => {
  const fieldMappings: Record<string, string> = {
    'full_name': 'Họ và tên',
    'date_of_birth': 'Ngày sinh',
    'gender': 'Giới tính',
    'care_level': 'Mức độ chăm sóc',
    'status': 'Trạng thái',
    'admission_date': 'Ngày nhập viện',
    'medical_history': 'Tiền sử bệnh lý',
    'current_medications': 'Thuốc hiện tại',
    'allergies': 'Dị ứng',
    'relationship': 'Mối quan hệ',
    'avatar': 'Ảnh đại diện',
    'family_member_id': 'ID thành viên gia đình',
    'emergency_contact.name': 'Tên người liên hệ khẩn cấp',
    'emergency_contact.phone': 'Số điện thoại liên hệ khẩn cấp',
    'emergency_contact.email': 'Email liên hệ khẩn cấp',
    'emergency_contact.relationship': 'Mối quan hệ với người liên hệ khẩn cấp'
  };
  
  for (const [field, vietnameseName] of Object.entries(fieldMappings)) {
    if (message.includes(field)) {
      return vietnameseName;
    }
  }
  
  return 'Trường dữ liệu';
};

/**
 * Format error message for better user experience
 * @param message - Raw error message
 * @returns Formatted error message
 */
export const formatErrorMessage = (message: string): string => {
  const translated = translateError(message);
  
  // If it's a validation error, make it more user-friendly
  if (translated.includes('should not be empty') || 
      translated.includes('must be') || 
      translated.includes('phải là')) {
    const fieldName = getFieldName(message);
    return `${fieldName} ${translated}`;
  }
  
  return translated;
};

/**
 * Legacy function for backward compatibility
 * @param message - Raw error message
 * @returns Formatted error message
 */
export const getUserFriendlyError = (message: string): string => {
  return formatErrorMessage(message);
};
