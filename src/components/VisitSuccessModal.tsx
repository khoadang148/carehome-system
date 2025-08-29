"use client";
import React, { useEffect } from "react";
import "./visit-modals.css";

interface VisitSuccessModalProps {
  open: boolean;
  onClose: () => void;
  scheduledResidents: string[];
}

export default function VisitSuccessModal({
  open,
  onClose,
  scheduledResidents,
}: VisitSuccessModalProps) {
  useEffect(() => {
    if (open) {
      
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div className="visit-modal-overlay">
      <div className="visit-success-modal-content">
        
        <div className="visit-checkmark-container">
          <svg width="64" height="64" viewBox="0 0 64 64" className="visit-checkmark-svg">
            <circle cx="32" cy="32" r="32" fill="#22c55e" opacity="0.15" />
            <circle cx="32" cy="32" r="24" fill="#22c55e" />
            <polyline
              points="22,34 30,42 44,26"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="visit-checkmark-path"
            />
          </svg>
        </div>
        
        <h2 className="visit-success-title">
          Đã đặt lịch thăm thành công! 🎉
        </h2>
        
        <div className="visit-success-message">
          {scheduledResidents.length > 0 ? (
            <>
              Đã đặt lịch thăm thành công cho các người thân đang ở viện:
              <ul className="visit-residents-list">
                {scheduledResidents.map((name, index) => (
                  <li key={index} className="visit-resident-item">• {name}</li>
                ))}
              </ul>
              <p className="visit-note">
                <strong>Lưu ý:</strong> Chỉ có thể đặt lịch thăm cho người thân chưa xuất viện.
              </p>
            </>
          ) : (
            <>
              Chúng tôi sẽ xác nhận lịch hẹn với bạn trong vòng 3 đến 12 tiếng. 
              Vui lòng kiểm tra thông báo hoặc liên hệ nhân viên nếu cần hỗ trợ thêm.
            </>
          )}
        </div>
        
        <button onClick={onClose} className="visit-success-close-btn">
          Đóng
        </button>
      </div>
    </div>
  );
}
