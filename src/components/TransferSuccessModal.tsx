"use client";
import React, { useEffect } from "react";
import "./success-modal.css";

export default function TransferSuccessModal({
  open,
  onClose,
  residentName,
  fromRoom,
  toRoom,
  fromBed,
  toBed,
}: {
  open: boolean;
  onClose: () => void;
  residentName?: string;
  fromRoom?: string;
  toRoom?: string;
  fromBed?: string;
  toBed?: string;
}) {
  useEffect(() => {
    if (open) {
      // Hiển thị modal trong 3 giây để user đọc thông tin
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div className="success-modal-overlay">
      <div className="success-modal-content">
        {/* Animated checkmark SVG */}
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
          Chuyển đổi thành công! 🎉
        </h2>
        
        <div className="success-message">
          <div style={{ marginBottom: '8px' }}>
            <b>{residentName}</b> đã được chuyển thành công
          </div>
          <div style={{ fontSize: '16px', opacity: 0.8 }}>
            Từ: <b>{fromRoom}</b> - <b>{fromBed}</b>
          </div>
          <div style={{ fontSize: '16px', opacity: 0.8 }}>
            Đến: <b>{toRoom}</b> - <b>{toBed}</b>
          </div>
        </div>
        
        <button onClick={onClose} className="success-close-btn">
          Đóng
        </button>
      </div>
    </div>
  );
}
