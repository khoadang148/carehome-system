"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  HeartIcon,
  ScaleIcon,
  FireIcon,
  LungIcon,
  DropletIcon,
  PlusIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';

interface VitalSigns {
  id: string;
  date: string;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  weight?: number;
  notes?: string;
}

export default function VitalsPage() {
  const params = useParams();
  const router = useRouter();
  const residentId = parseInt(params.id as string);
  
  const [resident, setResident] = useState<any>(null);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVital, setSelectedVital] = useState<VitalSigns | null>(null);
  const [dateFilter, setDateFilter] = useState('7days');

  useEffect(() => {
    loadResidentData();
    loadVitalsData();
  }, [residentId]);

  const loadResidentData = () => {
    const residentData = RESIDENTS_DATA.find(r => r.id === residentId);
    setResident(residentData);
  };

  const loadVitalsData = () => {
    // Mock vitals data
    const mockVitals: VitalSigns[] = [
      {
        id: '1',
        date: new Date().toISOString(),
        heartRate: 72,
        bloodPressure: "120/80",
        temperature: 36.5,
        oxygenLevel: 98,
        weight: 70,
        notes: "Bình thường"
      },
      {
        id: '2',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        heartRate: 78,
        bloodPressure: "135/88",
        temperature: 36.8,
        oxygenLevel: 97,
        weight: 70.2,
        notes: "Huyết áp hơi cao"
      },
      {
        id: '3',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        heartRate: 75,
        bloodPressure: "150/95",
        temperature: 37.0,
        oxygenLevel: 96,
        weight: 69.8,
        notes: "Huyết áp cao, cần theo dõi"
      }
    ];
    setVitals(mockVitals);
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

  // Normal ranges for vital signs
  const normalRanges = {
    heartRate: [60, 100],
    bloodPressure: "90/60-140/90",
    temperature: [36.0, 37.5],
    oxygenLevel: [95, 100],
  };

  // Function to check if vital signs are within normal range
  const isWithinNormalRange = (vital: VitalSigns) => {
    return (
      vital.heartRate >= normalRanges.heartRate[0] && vital.heartRate <= normalRanges.heartRate[1] &&
      vital.temperature >= normalRanges.temperature[0] && vital.temperature <= normalRanges.temperature[1] &&
      vital.oxygenLevel >= normalRanges.oxygenLevel[0] && vital.oxygenLevel <= normalRanges.oxygenLevel[1]
    );
  };

  const getLatestVitals = () => {
    if (vitals.length === 0) return null;
    return vitals.reduce((latest, current) => {
      const latestDate = new Date(`${latest.date} ${latest.time}`);
      const currentDate = new Date(`${current.date} ${current.time}`);
      return currentDate > latestDate ? current : latest;
    });
  };

  const latestVitals = getLatestVitals();

  if (!resident) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Không tìm thấy thông tin người cao tuổi</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Link href={`/admin/residents/${residentId}`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#3b82f6',
                textDecoration: 'none',
                marginBottom: '1rem'
              }}>
                <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                Quay lại hồ sơ
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <HeartIcon style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Chỉ Số Sinh Hiệu
                </h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Theo dõi các chỉ số sức khỏe của {resident.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
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
          </div>
        </div>

        {/* Latest Vitals Summary */}
        {latestVitals && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: `2px solid ${getAlertColor(latestVitals.alertLevel)}20`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1f2937',
                margin: 0
              }}>
                Chỉ số mới nhất
              </h2>
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
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                padding: '1rem',
                background: '#fef2f2',
                borderRadius: '0.75rem',
                border: '1px solid #fecaca'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <HeartIcon style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', fontWeight: 600, margin: 0 }}>
                    Huyết áp
                  </p>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {latestVitals.bloodPressure}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>mmHg</p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#fef2f2',
                borderRadius: '0.75rem',
                border: '1px solid #fecaca'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <HeartIcon style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', fontWeight: 600, margin: 0 }}>
                    Nhịp tim
                  </p>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {latestVitals.heartRate}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>bpm</p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '0.75rem',
                border: '1px solid #fde68a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FireIcon style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} />
                  <p style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600, margin: 0 }}>
                    Nhiệt độ
                  </p>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {latestVitals.temperature}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>°C</p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#ecfdf5',
                borderRadius: '0.75rem',
                border: '1px solid #a7f3d0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <LungIcon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
                  <p style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 600, margin: 0 }}>
                    Nhịp thở
                  </p>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {latestVitals.respiratoryRate}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>lần/phút</p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#eff6ff',
                borderRadius: '0.75rem',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <DropletIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                  <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600, margin: 0 }}>
                    SpO2
                  </p>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {latestVitals.oxygenSaturation}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>%</p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#f3f4f6',
                borderRadius: '0.75rem',
                border: '1px solid #d1d5db'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ScaleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                  <p style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 600, margin: 0 }}>
                    Cân nặng
                  </p>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {latestVitals.weight}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>kg</p>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '0.5rem'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                margin: '0 0 0.5rem 0',
                fontWeight: 600
              }}>
                Ghi chú:
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                {latestVitals.notes}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                Đo bởi: {latestVitals.measuredBy} • {new Date(`${latestVitals.date} ${latestVitals.time}`).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        )}

        {/* Vitals History */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0
            }}>
              Lịch sử chỉ số
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="90days">3 tháng qua</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Thời gian
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Huyết áp
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Nhịp tim
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Nhiệt độ
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    SpO2
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Cân nặng
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Trạng thái
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Người đo
                  </th>
                </tr>
              </thead>
              <tbody>
                {vitals.map((vital, index) => (
                  <tr key={vital.id} style={{
                    borderBottom: index < vitals.length - 1 ? '1px solid #f3f4f6' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedVital(vital)}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                      {formatDateDDMMYYYY(vital.date)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 600,
                        color: '#10b981'
                      }}>
                        {vital.bloodPressure}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 600,
                        color: (vital.heartRate > 100 || vital.heartRate < 60) ? '#ef4444' : '#10b981'
                      }}>
                        {vital.heartRate}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 600,
                        color: (vital.temperature > 37.2 || vital.temperature < 36.0) ? '#ef4444' : '#10b981'
                      }}>
                        {vital.temperature}°C
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 600,
                        color: vital.oxygenSaturation < 95 ? '#ef4444' : '#10b981'
                      }}>
                        {vital.oxygenSaturation}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#1f2937' }}>
                      {vital.weight} kg
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getAlertColor(vital.alertLevel)}20`,
                        color: getAlertColor(vital.alertLevel)
                      }}>
                        {getAlertText(vital.alertLevel)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {vital.measuredBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {vitals.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <HeartIcon style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 1rem',
                color: '#d1d5db'
              }} />
              <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>
                Chưa có dữ liệu chỉ số sinh hiệu
              </p>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Bắt đầu theo dõi bằng cách thêm chỉ số đầu tiên
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 