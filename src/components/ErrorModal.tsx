"use client";

import React, { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import './error-modal.css';

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorModal({ 
  open, 
  onClose, 
  title = 'Có lỗi xảy ra', 
  message, 
  type = 'error' 
}: ErrorModalProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return '#dc2626';
      case 'warning':
        return '#d97706';
      case 'info':
        return '#2563eb';
      default:
        return '#dc2626';
    }
  };

  const getBgGradient = () => {
    switch (type) {
      case 'error':
        return 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%)';
      case 'info':
        return 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)';
      default:
        return 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return '#991b1b';
      case 'warning':
        return '#92400e';
      case 'info':
        return '#1e40af';
      default:
        return '#991b1b';
    }
  };

  const getButtonGradient = () => {
    switch (type) {
      case 'error':
        return 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)';
      case 'warning':
        return 'linear-gradient(90deg, #d97706 0%, #b45309 100%)';
      case 'info':
        return 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)';
      default:
        return 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)';
    }
  };

  const getButtonHoverGradient = () => {
    switch (type) {
      case 'error':
        return 'linear-gradient(90deg, #b91c1c 0%, #991b1b 100%)';
      case 'warning':
        return 'linear-gradient(90deg, #b45309 0%, #92400e 100%)';
      case 'info':
        return 'linear-gradient(90deg, #1d4ed8 0%, #1e40af 100%)';
      default:
        return 'linear-gradient(90deg, #b91c1c 0%, #991b1b 100%)';
    }
  };

  return (
    <div className="error-modal-overlay">
      <div 
        className="error-modal-content"
        style={{ background: getBgGradient() }}
      >
        <div className="error-icon-container">
          <div 
            className="error-icon-circle"
            style={{ backgroundColor: getIconColor() }}
          >
            <ExclamationTriangleIcon 
              className="error-icon" 
              style={{ color: 'white' }}
            />
          </div>
        </div>
        
        <h2 
          className="error-title"
          style={{ color: getTextColor() }}
        >
          {title}
        </h2>
        
        <div 
          className="error-message"
          style={{ color: getTextColor() }}
        >
          {message}
        </div>
        
        <div className="error-buttons">
                     <button 
             onClick={onClose} 
             className="error-primary-btn"
             style={{ 
               background: getButtonGradient(),
               '--hover-bg': getButtonHoverGradient()
             } as React.CSSProperties & { '--hover-bg': string }}
           >
             Đã hiểu
           </button>
          <button 
            onClick={onClose} 
            className="error-secondary-btn"
            style={{ color: getTextColor() }}
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}
