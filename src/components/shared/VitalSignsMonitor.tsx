"use client";

import { useState, useEffect } from 'react';
import { 
  HeartIcon,
  ScaleIcon,
  FireIcon,
  LungIcon,
  DropletIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface VitalSign {
  id: number;
  residentId: number;
  date: string;
  time: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  bloodSugar?: number;
  notes: string;
  measuredBy: string;
  alertLevel: 'normal' | 'warning' | 'critical';
}

interface VitalSignsMonitorProps {
  residentId: number;
  showAddButton?: boolean;
  onAddVital?: () => void;
}

export default function VitalSignsMonitor({ residentId, showAddButton = false, onAddVital }: VitalSignsMonitorProps) {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVitalsData();
  }, [residentId]);

  const loadVitalsData = () => {
    // Mock data - trong thực tế sẽ load từ API
    const mockVitals: VitalSign[] = [
      {
        id: 1,
        residentId: residentId,
        date: '2024-01-15',
        time: '08:00',
        bloodPressure: { systolic: 120, diastolic: 80 },
        heartRate: 72,
        temperature: 36.5,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 65.5,
        bloodSugar: 95,
        notes: 'Chỉ số bình thường',
        measuredBy: 'Y tá Nguyễn Văn A',
        alertLevel: 'normal'
      },
      {
        id: 2,
        residentId: residentId,
        date: '2024-01-14',
        time: '20:00',
        bloodPressure: { systolic: 135, diastolic: 88 },
        heartRate: 78,
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 96,
        weight: 65.3,
        bloodSugar: 110,
        notes: 'Huyết áp hơi cao, cần theo dõi',
        measuredBy: 'Y tá Trần Thị B',
        alertLevel: 'warning'
      }
    ];
    
    setVitals(mockVitals);
    setLoading(false);
  };

  const getLatestVitals = () => {
    if (vitals.length === 0) return null;
    return vitals.reduce((latest, current) => {
      const latestDate = new Date(`${latest.date} ${latest.time}`);
      const currentDate = new Date(`${current.date} ${current.time}`);
      return currentDate > latestDate ? current : latest;
    });
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAlertText = (level: string) => {
    switch (level) {
      case 'normal': return 'Bình thường';
      case 'warning': return 'Cần chú ý';
      case 'critical': return 'Nguy hiểm';
      default: return level;
    }
  };

  const latestVitals = getLatestVitals();

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#6b7280' }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!latestVitals) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <HeartIcon style={{
          width: '3rem',
          height: '3rem',
          margin: '0 auto 1rem',
          color: '#d1d5db'
        }} />
        <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
          Chưa có dữ liệu chỉ số sinh hiệu
        </p>
        <p style={{ color: '#9ca3af', margin: '0.5rem 0 1rem 0' }}>
          Bắt đầu theo dõi bằng cách thêm chỉ số đầu tiên
        </p>
        {showAddButton && (
          <button
            onClick={onAddVital}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <PlusIcon style={{ width: '1rem', height: '1rem' }} />
            Thêm chỉ số
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: `2px solid ${getAlertColor(latestVitals.alertLevel)}20`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#1f2937',
          margin: 0
        }}>
          Chỉ số sinh hiệu mới nhất
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: `${getAlertColor(latestVitals.alertLevel)}20`,
            color: getAlertColor(latestVitals.alertLevel)
          }}>
            {getAlertText(latestVitals.alertLevel)}
          </span>
          {showAddButton && (
            <button
              onClick={onAddVital}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Thêm
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Blood Pressure */}
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          borderRadius: '0.75rem',
          border: '1px solid #fecaca',
          textAlign: 'center'
        }}>
          <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#7f1d1d', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
            Huyết áp
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {latestVitals.bloodPressure.systolic}/{latestVitals.bloodPressure.diastolic}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>mmHg</p>
        </div>

        {/* Heart Rate */}
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          borderRadius: '0.75rem',
          border: '1px solid #fecaca',
          textAlign: 'center'
        }}>
          <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#7f1d1d', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
            Nhịp tim
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {latestVitals.heartRate}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>bpm</p>
        </div>

        {/* Temperature */}
        <div style={{
          padding: '1rem',
          background: '#fef3c7',
          borderRadius: '0.75rem',
          border: '1px solid #fde68a',
          textAlign: 'center'
        }}>
          <FireIcon style={{ width: '1.5rem', height: '1.5rem', color: '#d97706', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
            Nhiệt độ
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {latestVitals.temperature}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>°C</p>
        </div>

        {/* Oxygen Saturation */}
        <div style={{
          padding: '1rem',
          background: '#eff6ff',
          borderRadius: '0.75rem',
          border: '1px solid #bfdbfe',
          textAlign: 'center'
        }}>
          <DropletIcon style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
            SpO2
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {latestVitals.oxygenSaturation}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>%</p>
        </div>

        {/* Weight */}
        <div style={{
          padding: '1rem',
          background: '#f3f4f6',
          borderRadius: '0.75rem',
          border: '1px solid #d1d5db',
          textAlign: 'center'
        }}>
          <ScaleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#4b5563', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
            Cân nặng
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {latestVitals.weight}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>kg</p>
        </div>

        {/* Blood Sugar (if available) */}
        {latestVitals.bloodSugar && (
          <div style={{
            padding: '1rem',
            background: '#ecfdf5',
            borderRadius: '0.75rem',
            border: '1px solid #a7f3d0',
            textAlign: 'center'
          }}>
            <DropletIcon style={{ width: '1.5rem', height: '1.5rem', color: '#059669', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
              Đường huyết
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
              {latestVitals.bloodSugar}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>mg/dL</p>
          </div>
        )}
      </div>

      {/* Notes and Details */}
      <div style={{
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#374151',
            margin: 0,
            fontWeight: 600
          }}>
            Ghi chú:
          </p>
          <p style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            margin: 0
          }}>
            {new Date(`${latestVitals.date} ${latestVitals.time}`).toLocaleString('vi-VN')}
          </p>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
          {latestVitals.notes}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
          Đo bởi: {latestVitals.measuredBy}
        </p>
      </div>

      {/* Alert Messages */}
      {latestVitals.alertLevel === 'critical' && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
          <div>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#dc2626',
              margin: 0
            }}>
              Cảnh báo: Chỉ số bất thường
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#7f1d1d',
              margin: 0
            }}>
              Cần liên hệ bác sĩ ngay lập tức
            </p>
          </div>
        </div>
      )}

      {latestVitals.alertLevel === 'warning' && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} />
          <div>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#d97706',
              margin: 0
            }}>
              Cần theo dõi
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#92400e',
              margin: 0
            }}>
              Một số chỉ số cần được theo dõi thường xuyên
            </p>
          </div>
        </div>
      )}

      {latestVitals.alertLevel === 'normal' && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
          <div>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#059669',
              margin: 0
            }}>
              Chỉ số bình thường
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: '#065f46',
              margin: 0
            }}>
              Tất cả chỉ số đều trong phạm vi an toàn
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
