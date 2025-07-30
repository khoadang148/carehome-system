// Utility functions for notifications
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  title: string;
  message: string;
  type: NotificationType;
}

// Helper function to create notification configs
export const createNotification = {
  success: (message: string, title: string = 'Thành công'): NotificationConfig => ({
    title,
    message,
    type: 'success'
  }),
  
  error: (message: string, title: string = 'Lỗi'): NotificationConfig => ({
    title,
    message,
    type: 'error'
  }),
  
  warning: (message: string, title: string = 'Cảnh báo'): NotificationConfig => ({
    title,
    message,
    type: 'warning'
  }),
  
  info: (message: string, title: string = 'Thông báo'): NotificationConfig => ({
    title,
    message,
    type: 'info'
  })
};

// Common notification messages
export const commonNotifications = {
  // Success messages
  saveSuccess: createNotification.success('Đã lưu thành công!'),
  deleteSuccess: createNotification.success('Đã xóa thành công!'),
  updateSuccess: createNotification.success('Đã cập nhật thành công!'),
  createSuccess: createNotification.success('Đã tạo thành công!'),
  
  // Error messages
  saveError: createNotification.error('Có lỗi xảy ra khi lưu. Vui lòng thử lại.'),
  deleteError: createNotification.error('Có lỗi xảy ra khi xóa. Vui lòng thử lại.'),
  updateError: createNotification.error('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.'),
  createError: createNotification.error('Có lỗi xảy ra khi tạo. Vui lòng thử lại.'),
  networkError: createNotification.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'),
  
  // Permission messages
  noPermission: createNotification.error('Bạn không có quyền thực hiện hành động này.'),
  
  // Validation messages
  requiredField: (fieldName: string) => createNotification.warning(`${fieldName} là bắt buộc.`),
  invalidFormat: (fieldName: string) => createNotification.warning(`${fieldName} không đúng định dạng.`),
  fileTooLarge: (maxSize: string) => createNotification.warning(`File quá lớn. Vui lòng chọn file nhỏ hơn ${maxSize}.`),
  invalidFileType: (allowedTypes: string) => createNotification.warning(`Chỉ chấp nhận file ${allowedTypes}.`)
}; 