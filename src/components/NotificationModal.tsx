import React from 'react';

interface NotificationModalProps {
  open: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export default function NotificationModal({ open, type, message, onClose }: NotificationModalProps) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {type === 'success' ? (
          <svg width={48} height={48} fill="none"><circle cx={24} cy={24} r={24} fill="#22c55e"/><path d="M16 24l6 6 10-10" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg width={48} height={48} fill="none"><circle cx={24} cy={24} r={24} fill="#ef4444"/><path d="M16 16l16 16M32 16L16 32" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
        <div style={{ fontWeight: 600, fontSize: 18, margin: '16px 0 8px', color: type === 'success' ? '#22c55e' : '#ef4444' }}>
          {type === 'success' ? 'Thành công' : 'Lỗi'}
        </div>
        <div style={{ color: '#374151', marginBottom: 24, textAlign: 'center' }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            background: type === 'success' ? '#22c55e' : '#ef4444',
            color: 'white', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 500, cursor: 'pointer'
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
} 