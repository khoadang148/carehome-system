"use client";
import React, { useEffect } from "react";
import "./success-modal.css";

export default function SuccessModal({
  open,
  onClose,
  name,
  title,
}: {
  open: boolean;
  onClose: () => void;
  name?: string;
  title?: string;
}) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div className="success-modal-overlay">
      <div className="success-modal-content">
        <div className="checkmark-container">
          <svg width="64" height="64" viewBox="0 0 64 64" className="checkmark-svg">
            <circle cx="32" cy="32" r="32" fill="#22c55e" opacity="0.15" />
            <circle cx="32" cy="32" r="24" fill="#22c55e" />
            <polyline
              points="22,34 30,42 44,26"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="checkmark-path"
            />
          </svg>
        </div>
        
        <h2 className="success-title">
          {title || 'Đăng nhập thành công! 🎉'}
        </h2>
        
        <div className="success-message">
          Chào mừng bạn quay lại, <b>{name || "bạn"}</b>!
        </div>
        
        <button onClick={onClose} className="success-close-btn">
          Đóng
        </button>
      </div>
    </div>
  );
}