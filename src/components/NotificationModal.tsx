import React from 'react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NotificationModalProps {
  open: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  showCloseButton?: boolean;
}

export default function NotificationModal({
  open,
  title,
  message,
  type = 'info',
  onClose,
  showCloseButton = true
}: NotificationModalProps) {
  if (!open) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border ${getBackgroundColor()}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${getButtonColor()}`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
} 