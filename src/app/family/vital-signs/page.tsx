"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface VitalSigns {
  id: number;
  date: string;
  time: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  weight?: number;
  bloodSugar?: number;
  notes?: string;
  recordedBy: string;
  status: 'normal' | 'warning' | 'critical';
}

interface ResidentInfo {
  id: number;
  name: string;
  relationship: string;
  room: string;
  age: number;
}

export default function FamilyVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [resident, setResident] = useState<ResidentInfo | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = () => {
    // Mock resident info
    const mockResident: ResidentInfo = {
      id: 1,
      name: 'Nguyễn Văn Bảy',
      relationship: 'Bố',
      room: 'P201',
      age: 75
    };

    // Mock vital signs data
    const mockVitalSigns: VitalSigns[] = [
      {
        id: 1,
        date: '2024-01-15',
        time: '08:00',
        bloodPressureSystolic: 140,
        bloodPressureDiastolic: 90,
        heartRate: 78,
        temperature: 36.5,
        oxygenSaturation: 98,
        respiratoryRate: 16,
        weight: 65,
        bloodSugar: 120,
        recordedBy: 'Y tá Nguyễn Văn A',
        status: 'warning',
        notes: 'Huyết áp hơi cao, cần theo dõi thêm'
      },
      {
        id: 2,
        date: '2024-01-14',
        time: '08:15',
        bloodPressureSystolic: 135,
        bloodPressureDiastolic: 85,
        heartRate: 72,
        temperature: 36.7,
        oxygenSaturation: 99,
        respiratoryRate: 14,
        weight: 65.2,
        bloodSugar: 115,
        recordedBy: 'Y tá Trần Thị B',
        status: 'normal'
      },
      {
        id: 3,
        date: '2024-01-13',
        time: '08:30',
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 80,
        heartRate: 75,
        temperature: 36.8,
        oxygenSaturation: 98,
        respiratoryRate: 15,
        weight: 64.8,
        bloodSugar: 110,
        recordedBy: 'Y tá Lê Văn C',
        status: 'normal'
      }
    ];

    setResident(mockResident);
    setVitalSigns(mockVitalSigns);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return 'Bình thường';
      case 'warning': return 'Cần chú ý';
      case 'critical': return 'Nguy hiểm';
      default: return status;
    }
  };

  const getLatestVitalSigns = () => {
    return vitalSigns.length > 0 ? vitalSigns[0] : null;
  };

  const getVitalTrend = (currentValue: number, previousValue?: number) => {
    if (!previousValue) return null;
    if (currentValue > previousValue) return 'up';
    if (currentValue < previousValue) return 'down';
    return 'stable';
  };

  const latest = getLatestVitalSigns();
  const previous = vitalSigns.length > 1 ? vitalSigns[1] : undefined;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
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
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>

        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 0.5rem 0'
              }}>
                Dấu Hiệu Sinh Tồn
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Theo dõi tình trạng sức khỏe của {resident?.name} ({resident?.relationship})
              </p>
            </div>
            <div style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              padding: '0.25rem'
            }}>
              <button
                onClick={() => setDateRange('week')}
                style={{
                  padding: '0.5rem 1rem',
                  background: dateRange === 'week' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: dateRange === 'week' ? '#1f2937' : '#6b7280',
                  cursor: 'pointer',
                  boxShadow: dateRange === 'week' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                7 ngày
              </button>
              <button
                onClick={() => setDateRange('month')}
                style={{
                  padding: '0.5rem 1rem',
                  background: dateRange === 'month' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: dateRange === 'month' ? '#1f2937' : '#6b7280',
                  cursor: 'pointer',
                  boxShadow: dateRange === 'month' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                30 ngày
              </button>
              <button
                onClick={() => setDateRange('quarter')}
                style={{
                  padding: '0.5rem 1rem',
                  background: dateRange === 'quarter' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: dateRange === 'quarter' ? '#1f2937' : '#6b7280',
                  cursor: 'pointer',
                  boxShadow: dateRange === 'quarter' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                3 tháng
              </button>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {latest && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: `2px solid ${getStatusColor(latest.status)}20`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: getStatusColor(latest.status) }} />
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1f2937',
                margin: 0
              }}>
                Tình trạng hiện tại
              </h2>
              <span style={{
                padding: '0.375rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: `${getStatusColor(latest.status)}20`,
                color: getStatusColor(latest.status)
              }}>
                {getStatusText(latest.status)}
              </span>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              Cập nhật lần cuối: {new Date(latest.date).toLocaleDateString('vi-VN')} lúc {latest.time} 
              bởi {latest.recordedBy}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minWidth(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                padding: '1.5rem',
                background: '#fef2f2',
                borderRadius: '0.75rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <HeartIcon style={{ width: '2rem', height: '2rem', color: '#ef4444', margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Huyết áp</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                  {latest.bloodPressureSystolic}/{latest.bloodPressureDiastolic}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>mmHg</p>
                {previous && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {getVitalTrend(latest.bloodPressureSystolic, previous.bloodPressureSystolic) === 'up' && (
                      <ArrowTrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                    )}
                    {getVitalTrend(latest.bloodPressureSystolic, previous.bloodPressureSystolic) === 'down' && (
                      <ArrowTrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    )}
                  </div>
                )}
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#fef9f2',
                borderRadius: '0.75rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#f59e0b',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>♥</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Nhịp tim</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                  {latest.heartRate}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>bpm</p>
                {previous && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {getVitalTrend(latest.heartRate, previous.heartRate) === 'up' && (
                      <TrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                    )}
                    {getVitalTrend(latest.heartRate, previous.heartRate) === 'down' && (
                      <TrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    )}
                  </div>
                )}
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#f0f9ff',
                borderRadius: '0.75rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#3b82f6',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>🌡</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Nhiệt độ</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                  {latest.temperature}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>°C</p>
                {previous && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {getVitalTrend(latest.temperature, previous.temperature) === 'up' && (
                      <TrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                    )}
                    {getVitalTrend(latest.temperature, previous.temperature) === 'down' && (
                      <TrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    )}
                  </div>
                )}
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#f0fdf4',
                borderRadius: '0.75rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#10b981',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>O₂</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>SpO2</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                  {latest.oxygenSaturation}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>%</p>
                {previous && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {getVitalTrend(latest.oxygenSaturation, previous.oxygenSaturation) === 'up' && (
                      <TrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    )}
                    {getVitalTrend(latest.oxygenSaturation, previous.oxygenSaturation) === 'down' && (
                      <TrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                    )}
                  </div>
                )}
              </div>

              {latest.weight && (
                <div style={{
                  padding: '1.5rem',
                  background: '#fefce8',
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#eab308',
                    borderRadius: '50%',
                    margin: '0 auto 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>⚖</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Cân nặng</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                    {latest.weight}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>kg</p>
                  {previous && previous.weight && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getVitalTrend(latest.weight, previous.weight) === 'up' && (
                        <TrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                      )}
                      {getVitalTrend(latest.weight, previous.weight) === 'down' && (
                        <TrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {latest.bloodSugar && (
                <div style={{
                  padding: '1.5rem',
                  background: '#fdf2f8',
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#ec4899',
                    borderRadius: '50%',
                    margin: '0 auto 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>🩸</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>Đường huyết</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                    {latest.bloodSugar}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>mg/dL</p>
                  {previous && previous.bloodSugar && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getVitalTrend(latest.bloodSugar, previous.bloodSugar) === 'up' && (
                        <TrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                      )}
                      {getVitalTrend(latest.bloodSugar, previous.bloodSugar) === 'down' && (
                        <TrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {latest.notes && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '0.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#92400e',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 600
                }}>
                  Ghi chú từ đội ngũ y tế:
                </p>
                <p style={{
                  color: '#92400e',
                  margin: 0
                }}>
                  {latest.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Historical Records */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0
            }}>
              Lịch sử theo dõi
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {vitalSigns.map((record, index) => (
              <div key={record.id} style={{
                padding: '1.5rem',
                background: index === 0 ? '#f0f9ff' : '#f9fafb',
                borderRadius: '0.75rem',
                border: index === 0 ? '2px solid #3b82f620' : '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                      <p style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {new Date(record.date).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(record.status)}20`,
                        color: getStatusColor(record.status)
                      }}>
                        {getStatusText(record.status)}
                      </span>
                      {index === 0 && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#3b82f620',
                          color: '#3b82f6'
                        }}>
                          Mới nhất
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Thời gian: {record.time} • Ghi nhận bởi: {record.recordedBy}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minWidth(120px, 1fr))',
                  gap: '1rem',
                  marginBottom: record.notes ? '1rem' : 0
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Huyết áp</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}
                    </p>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Nhịp tim</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {record.heartRate} bpm
                    </p>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Nhiệt độ</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {record.temperature}°C
                    </p>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>SpO2</p>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {record.oxygenSaturation}%
                    </p>
                  </div>

                  {record.weight && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Cân nặng</p>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                        {record.weight} kg
                      </p>
                    </div>
                  )}

                  {record.bloodSugar && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Đường huyết</p>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                        {record.bloodSugar} mg/dL
                      </p>
                    </div>
                  )}
                </div>

                {record.notes && (
                  <div style={{
                    padding: '1rem',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '0.5rem'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#92400e',
                      margin: '0 0 0.5rem 0',
                      fontWeight: 600
                    }}>
                      Ghi chú:
                    </p>
                    <p style={{
                      color: '#92400e',
                      margin: 0
                    }}>
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {vitalSigns.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem'
            }}>
              <HeartIcon style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 1rem',
                color: '#d1d5db'
              }} />
              <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                Chưa có dữ liệu
              </p>
              <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                Dữ liệu dấu hiệu sinh tồn sẽ được cập nhật thường xuyên
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
