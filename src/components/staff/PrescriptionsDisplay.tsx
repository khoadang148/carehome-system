"use client";

import { BeakerIcon, UserIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface PrescriptionsDisplayProps {
  prescriptions: any[];
  isStaff?: boolean;
}

export default function PrescriptionsDisplay({ prescriptions, isStaff = false }: PrescriptionsDisplayProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <DocumentTextIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có đơn thuốc nào.</p>
      </div>
    );
  }

  // Sort prescriptions by date (newest first)
  const sortedPrescriptions = [...prescriptions].sort((a, b) => 
    new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime()
  );

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {sortedPrescriptions.map((prescription) => {
        return (
          <div
            key={prescription.id}
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #86efac',
              borderRadius: '0.75rem',
              padding: '1.25rem'
            }}
          >
            {/* Prescription Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <BeakerIcon style={{ width: '1.25rem', height: '1.25rem', color: '#166534' }} />
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#166534',
                    margin: 0
                  }}>
                    Đơn thuốc từ {prescription.doctor}
                  </h4>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <UserIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>{prescription.prescribedBy}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>{formatDate(prescription.prescriptionDate)}</span>
                  </div>
                </div>
              </div>

              {/* Medication Count */}
              <span style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#166534',
                color: 'white',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {prescription.medications?.length || 0} thuốc
              </span>
            </div>

            {/* Prescription Notes */}
            {prescription.notes && (
              <div style={{
                fontSize: '0.875rem',
                color: '#374151',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '0.5rem',
                fontStyle: 'italic'
              }}>
                <strong>Ghi chú:</strong> {prescription.notes}
              </div>
            )}

            {/* Medications List */}
            <div>
              <h5 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 0.75rem 0'
              }}>
                Danh sách thuốc:
              </h5>
              
              {prescription.medications && prescription.medications.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {prescription.medications.map((medication: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0.5rem',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#111827'
                          }}>
                            {medication.name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <strong>Liều lượng:</strong> {medication.dosage} • <strong>Lịch dùng:</strong> {medication.schedule}
                          </div>
                        </div>
                        
                        {medication.duration && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#166534',
                            fontWeight: 500,
                            backgroundColor: '#dcfce7',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem'
                          }}>
                            {medication.duration}
                          </div>
                        )}
                      </div>
                      
                      {medication.instructions && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}>
                          <strong>Hướng dẫn:</strong> {medication.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '1rem'
                }}>
                  Không có thuốc nào trong đơn này.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 