"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import "./success-modal.css";
import { 
  CheckCircleIcon, 
  ClipboardDocumentIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon,
  KeyIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface AccountInfo {
  username: string;
  password: string;
  email: string;
  role: string;
  residentName: string;
  existingAccount?: boolean;
  familyName?: string;
  familyUsername?: string;
}

export default function AccountSuccessModal({
  open,
  onClose,
  accountInfo,
  offsetX = 0,
  offsetY = 0
}: {
  open: boolean;
  onClose: () => void;
  accountInfo: AccountInfo;
  offsetX?: number; // pixel to shift modal to the right
  offsetY?: number; // pixel to shift modal downward
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setCopiedField(null);
    }
  }, [open]);

  if (!open) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'family':
        return 'Gia đình';
      case 'staff':
        return 'Nhân viên';
      case 'admin':
        return 'Quản trị viên';
      default:
        return role;
    }
  };

  const valueRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.75rem',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    position: 'relative'
  };

  const valueTextStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#111827'
  };

  const iconButtonStyle = (active: boolean): React.CSSProperties => ({
    width: '1.9rem',
    height: '1.9rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#dcfce7' : '#eef2ff',
    color: active ? '#16a34a' : '#2563eb',
    border: `1px solid ${active ? '#86efac' : '#c7d2fe'}`,
    borderRadius: '0.5rem',
    cursor: 'pointer'
  });

  const neutralIconButtonStyle: React.CSSProperties = {
    width: '1.9rem',
    height: '1.9rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  };

  const copiedBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    right: 4,
    top: -6,
    background: '#16a34a',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.4rem',
    borderRadius: '0.375rem',
    boxShadow: '0 2px 6px rgba(22,163,74,0.18)'
  };

  return (
    <div className="success-modal-overlay" style={{ justifyContent: 'center' }}>
      <div className="success-modal-content" style={{ minWidth: 520, maxWidth: 640, textAlign: 'left', transform: `translateX(${offsetX}px)`, marginTop: offsetY }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '0.75rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          }}>
            <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <h2 className="success-title" style={{ margin: 0 }}>Tạo thành công!</h2>
        </div>
        <p className="success-message" style={{ marginTop: 0 }}>
          Người cao tuổi <b>{accountInfo.residentName}</b> đã được thêm vào hệ thống
          {accountInfo.existingAccount && <span> và gán vào tài khoản gia đình hiện có</span>}.
        </p>

        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          {accountInfo.existingAccount ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Tên tài khoản gia đình</label>
                <div style={{ padding: '0.6rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', fontWeight: 600, color: '#166534' }}>
                  {accountInfo.familyName}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Tên đăng nhập</label>
                <div style={{ padding: '0.6rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', fontWeight: 600, color: '#166534' }}>
                  {accountInfo.familyUsername}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Vai trò</label>
                <div style={{ padding: '0.6rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', fontWeight: 600, color: '#166534' }}>
                  {getRoleDisplayName(accountInfo.role)} người cao tuổi
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Tên đăng nhập</label>
                <div style={valueRowStyle}>
                  <span style={valueTextStyle}>{accountInfo.username}</span>
                  <button
                    onClick={() => copyToClipboard(accountInfo.username, 'username')}
                    style={iconButtonStyle(copiedField === 'username')}
                    title="Sao chép"
                    aria-label="Sao chép tên đăng nhập"
                  >
                    {copiedField === 'username' ? (
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                    )}
                  </button>
                  {copiedField === 'username' && (
                    <span style={copiedBadgeStyle}>Đã sao chép</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Mật khẩu</label>
                <div style={valueRowStyle}>
                  <span style={{ ...valueTextStyle, letterSpacing: '0.08em' }}>
                    {showPassword ? accountInfo.password : '•'.repeat(accountInfo.password.length)}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={neutralIconButtonStyle}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(accountInfo.password, 'password')}
                    style={iconButtonStyle(copiedField === 'password')}
                    title="Sao chép"
                    aria-label="Sao chép mật khẩu"
                  >
                    {copiedField === 'password' ? (
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                    )}
                  </button>
                  {copiedField === 'password' && (
                    <span style={copiedBadgeStyle}>Đã sao chép</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Email</label>
                <div style={valueRowStyle}>
                  <span style={valueTextStyle}>{accountInfo.email}</span>
                  <button
                    onClick={() => copyToClipboard(accountInfo.email, 'email')}
                    style={iconButtonStyle(copiedField === 'email')}
                    title="Sao chép"
                    aria-label="Sao chép email"
                  >
                    {copiedField === 'email' ? (
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                    )}
                  </button>
                  {copiedField === 'email' && (
                    <span style={copiedBadgeStyle}>Đã sao chép</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Vai trò</label>
                <div style={{ padding: '0.6rem 0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontWeight: 600, color: '#111827' }}>
                  {getRoleDisplayName(accountInfo.role)} người cao tuổi
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={onClose} className="success-close-btn">Đóng</button>
        </div>
      </div>
    </div>
  );
}


