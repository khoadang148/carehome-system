import React from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'confirm' | 'success' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'confirm',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircleIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
        );
      case 'error':
        return (
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
          }}>
            <ExclamationTriangleIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
        );
      default:
        return (
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
          }}>
            <ExclamationTriangleIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
        );
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'success':
        return {
          confirm: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          },
          cancel: {
            background: 'white',
            color: '#6b7280',
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease'
          }
        };
      case 'error':
        return {
          confirm: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          },
          cancel: {
            background: 'white',
            color: '#6b7280',
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease'
          }
        };
      default:
        return {
          confirm: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          },
          cancel: {
            background: 'white',
            color: '#6b7280',
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '0.75rem 2rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease'
          }
        };
    }
  };

  const buttonStyle = getButtonStyle();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s ease-out',
        position: 'relative'
      }}>
        {type !== 'confirm' && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: '#9ca3af',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#6b7280';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        )}

        {getIcon()}

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 1rem 0'
        }}>
          {title}
        </h2>

        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          margin: '0 0 2rem 0',
          lineHeight: 1.6
        }}>
          {message}
        </p>
          
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              style={buttonStyle.cancel}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={buttonStyle.confirm}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = type === 'success' 
                ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                : type === 'error'
                ? '0 6px 20px rgba(239, 68, 68, 0.4)'
                : '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = type === 'success' 
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : type === 'error'
                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                : '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
} 