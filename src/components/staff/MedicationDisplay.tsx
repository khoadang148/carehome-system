"use client";

import { useState } from 'react';
import { BeakerIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MedicationDisplayProps {
  residentId: number;
  medications: any[];
  onMedicationUpdate?: () => void;
  isStaff?: boolean;
}

export default function MedicationDisplay({ 
  residentId, 
  medications, 
  onMedicationUpdate, 
  isStaff = false 
}: MedicationDisplayProps) {
  const [updatingMedId, setUpdatingMedId] = useState<number | null>(null);

  const markAsTaken = async (medicationId: number) => {
    setUpdatingMedId(medicationId);
    
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const residentIndex = residents.findIndex((r: any) => r.id === residentId);
        
        if (residentIndex !== -1 && residents[residentIndex].medications_detail) {
          const medIndex = residents[residentIndex].medications_detail.findIndex((med: any) => med.id === medicationId);
          if (medIndex !== -1) {
            residents[residentIndex].medications_detail[medIndex].lastAdministered = new Date().toLocaleString('vi-VN');
            localStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
            onMedicationUpdate?.();
          }
        }
      }
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setUpdatingMedId(null);
    }
  };

  const formatLastTaken = (lastAdministered: string | null) => {
    if (!lastAdministered) return 'Chưa uống';
    
    const lastTaken = new Date(lastAdministered);
    const now = new Date();
    const hoursDiff = Math.floor((now.getTime() - lastTaken.getTime()) / (1000 * 60 * 60));
    
    if (hoursDiff < 1) return 'Vừa uống';
    if (hoursDiff < 24) return `${hoursDiff} giờ trước`;
    
    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff === 1) return 'Hôm qua';
    if (daysDiff < 7) return `${daysDiff} ngày trước`;
    
    return lastTaken.toLocaleDateString('vi-VN');
  };

  const getMedicationStatus = (medication: any) => {
    if (!medication.lastAdministered) return 'overdue';
    
    const lastTaken = new Date(medication.lastAdministered);
    const now = new Date();
    const hoursSinceLastTaken = (now.getTime() - lastTaken.getTime()) / (1000 * 60 * 60);
    
    if (medication.schedule.includes('một lần') && hoursSinceLastTaken > 20) return 'due';
    if (medication.schedule.includes('hai lần') && hoursSinceLastTaken > 10) return 'due';
    if (medication.schedule.includes('ba lần') && hoursSinceLastTaken > 6) return 'due';
    
    return 'recent';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' };
      case 'due': return { bg: '#fef3c7', border: '#fbbf24', text: '#d97706' };
      case 'recent': return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
      default: return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue': return 'Quá giờ';
      case 'due': return 'Đến giờ uống';
      case 'recent': return 'Đã uống';
      default: return 'Chưa rõ';
    }
  };

  if (!medications || medications.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <BeakerIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có thuốc nào được kê đơn.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {medications.map((medication) => {
        const status = getMedicationStatus(medication);
        const colors = getStatusColor(status);
        
        return (
          <div
            key={medication.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.75rem'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 0.25rem 0'
                }}>
                  {medication.name}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  <span><strong>Liều lượng:</strong> {medication.dosage}</span>
                  <span><strong>Lịch uống:</strong> {medication.schedule}</span>
                </div>
                {medication.instructions && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0.5rem 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    <strong>Hướng dẫn:</strong> {medication.instructions}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: colors.text,
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {getStatusText(status)}
                </span>
              </div>
            </div>

            {/* Last Administered & Action */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: `1px solid ${colors.border}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: colors.text
              }}>
                <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                <span>
                  <strong>Lần cuối:</strong> {formatLastTaken(medication.lastAdministered)}
                </span>
              </div>

              {isStaff && (
                <button
                  onClick={() => markAsTaken(medication.id)}
                  disabled={updatingMedId === medication.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: updatingMedId === medication.id ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: updatingMedId === medication.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  {updatingMedId === medication.id ? 'Đang cập nhật...' : 'Đánh dấu đã uống'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 