import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'info'
}: ConfirmModalProps) {
  if (!open) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      default:
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${buttonStyles.cancel}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${buttonStyles.confirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 