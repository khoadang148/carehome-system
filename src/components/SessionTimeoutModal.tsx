"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  remainingTime: number;
}

export default function SessionTimeoutModal({ 
  isOpen, 
  onExtend, 
  onLogout, 
  remainingTime 
}: SessionTimeoutModalProps) {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          onLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <svg 
            width="24" 
            height="24" 
            fill="white" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1f2937',
          margin: '0 0 0.5rem 0'
        }}>
          Phiên làm việc sắp hết hạn
        </h2>

        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          margin: '0 0 1.5rem 0',
          lineHeight: '1.5'
        }}>
          Phiên làm việc của bạn sẽ hết hạn trong{' '}
          <strong style={{ color: '#dc2626' }}>
            {formatTime(timeLeft)}
          </strong>
          . Bạn có muốn tiếp tục phiên làm việc không?
        </p>

        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '0.5rem',
          padding: '1rem',
          margin: '0 0 1.5rem 0'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#d97706',
            fontFamily: 'monospace'
          }}>
            {formatTime(timeLeft)}
          </div>
        </div>
            
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '100px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ef4444';
            }}
          >
            Đăng xuất
          </button>
          
          <button
            onClick={onExtend}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '100px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            }}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
} 