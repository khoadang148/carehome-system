import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification } from '@/hooks/useNotification';
import NotificationModal from '@/components/NotificationModal';

interface NotificationContextType {
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showNotification: (config: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotification();

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationModal
        open={notification.open}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
}; 