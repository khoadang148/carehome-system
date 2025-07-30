import { useState } from 'react';
import { NotificationType, NotificationConfig } from '@/lib/utils/notification';

interface NotificationState {
  open: boolean;
  title: string;
  message: string;
  type: NotificationType;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showNotification = (config: NotificationConfig) => {
    setNotification({
      open: true,
      title: config.title,
      message: config.message,
      type: config.type
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const showSuccess = (message: string, title: string = 'Thành công') => {
    showNotification({ title, message, type: 'success' });
  };

  const showError = (message: string, title: string = 'Lỗi') => {
    showNotification({ title, message, type: 'error' });
  };

  const showWarning = (message: string, title: string = 'Cảnh báo') => {
    showNotification({ title, message, type: 'warning' });
  };

  const showInfo = (message: string, title: string = 'Thông báo') => {
    showNotification({ title, message, type: 'info' });
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}; 