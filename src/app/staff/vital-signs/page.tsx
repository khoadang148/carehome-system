"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  UserIcon,
  PlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface VitalSigns {
  id: number;
  residentId: number;
  residentName: string;
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

interface Resident {
  id: number;
  name: string;
  room: string;
  age: number;
}

export default function StaffVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    console.log('Modal states:', { showAddForm });
    // Only hide header for modals, not the main page
    const hasModalOpen = showAddForm;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm]);


  const loadData = () => {
    // Mock residents data
    const mockResidents: Resident[] = [
      { id: 1, name: 'Nguyễn Văn Bảy', room: 'P201', age: 75 },
      { id: 2, name: 'Trần Thị Cúc', room: 'P202', age: 68 },
      { id: 3, name: 'Lê Văn Đức', room: 'P203', age: 82 }
    ];

    // Mock vital signs data
    const mockVitalSigns: VitalSigns[] = [
      {
        id: 1,
        residentId: 1,
        residentName: 'Nguyễn Văn Bảy',
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
        recordedBy: user?.name || 'Staff',
        status: 'warning',
        notes: 'Huyết áp hơi cao, cần theo dõi'
      },
      {
        id: 2,
        residentId: 2,
        residentName: 'Trần Thị Cúc',
        date: '2024-01-15',
        time: '08:15',
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 36.7,
        oxygenSaturation: 99,
        respiratoryRate: 14,
        recordedBy: user?.name || 'Staff',
        status: 'normal'
      }
    ];

    setResidents(mockResidents);
    setVitalSigns(mockVitalSigns);
    setLoading(false);
  };

  const handleAddVitalSigns = (data: Partial<VitalSigns>) => {
    const resident = residents.find(r => r.id === data.residentId);
    const status = getVitalSignsStatus(data);
    
    const newRecord: VitalSigns = {
      id: Date.now(),
      residentId: data.residentId!,
      residentName: resident?.name || '',
      date: data.date!,
      time: data.time!,
      bloodPressureSystolic: data.bloodPressureSystolic!,
      bloodPressureDiastolic: data.bloodPressureDiastolic!,
      heartRate: data.heartRate!,
      temperature: data.temperature!,
      oxygenSaturation: data.oxygenSaturation!,
      respiratoryRate: data.respiratoryRate!,
      weight: data.weight,
      bloodSugar: data.bloodSugar,
      notes: data.notes,
      recordedBy: user?.name || 'Staff',
      status
    };

    setVitalSigns(prev => [...prev, newRecord]);
    setShowAddForm(false);
  };

  const getVitalSignsStatus = (data: Partial<VitalSigns>): 'normal' | 'warning' | 'critical' => {
    // Basic rules for vital signs assessment
    if (data.bloodPressureSystolic! > 160 || data.bloodPressureDiastolic! > 100 ||
        data.heartRate! > 100 || data.heartRate! < 60 ||
        data.temperature! > 38 || data.temperature! < 35 ||
        data.oxygenSaturation! < 95) {
      return 'critical';
    }
    if (data.bloodPressureSystolic! > 140 || data.bloodPressureDiastolic! > 90 ||
        data.heartRate! > 90 || data.temperature! > 37.5 ||
        data.oxygenSaturation! < 98) {
      return 'warning';
    }
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredVitalSigns = selectedResident 
    ? vitalSigns.filter(vs => vs.residentId === selectedResident)
    : vitalSigns.filter(vs => vs.date === currentDate);

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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                Theo Dõi Dấu Hiệu Sinh Tồn
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Ghi nhận và theo dõi các chỉ số sinh hiệu của người cao tuổi
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
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
              Ghi nhận mới
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #10b98120'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Bình thường</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {vitalSigns.filter(v => v.status === 'normal').length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #f59e0b20'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Cảnh báo</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                  {vitalSigns.filter(v => v.status === 'warning').length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #ef444420'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Nguy hiểm</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                  {vitalSigns.filter(v => v.status === 'critical').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ngày
              </label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Người cao tuổi
              </label>
              <select
                value={selectedResident || ''}
                onChange={(e) => setSelectedResident(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả người cao tuổi</option>
                {residents.map(resident => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name} - {resident.room}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Vital Signs Records */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredVitalSigns.map((record) => (
              <div key={record.id} style={{
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '0.75rem',
                border: `2px solid ${getStatusColor(record.status)}20`
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
                      <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {record.residentName}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getStatusColor(record.status)}20`,
                        color: getStatusColor(record.status)
                      }}>
                        {record.status === 'normal' ? 'Bình thường' :
                         record.status === 'warning' ? 'Cảnh báo' : 'Nguy hiểm'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {new Date(record.date).toLocaleDateString('vi-VN')} • {record.time} • 
                      Ghi nhận bởi: {record.recordedBy}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Huyết áp</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>mmHg</p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Nhịp tim</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      {record.heartRate}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>bpm</p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Nhiệt độ</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      {record.temperature}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>°C</p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>SpO2</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      {record.oxygenSaturation}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>%</p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Nhịp thở</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      {record.respiratoryRate}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>lần/phút</p>
                  </div>

                  {record.weight && (
                    <div style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Cân nặng</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                        {record.weight}
                      </p>
                      <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>kg</p>
                    </div>
                  )}

                  {record.bloodSugar && (
                    <div style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Đường huyết</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                        {record.bloodSugar}
                      </p>
                      <p style={{ fontSize: '0.625rem', color: '#6b7280', margin: 0 }}>mg/dL</p>
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

          {filteredVitalSigns.length === 0 && (
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
                Chưa có dữ liệu dấu hiệu sinh tồn
              </p>
              <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                Hãy ghi nhận dấu hiệu sinh tồn đầu tiên
              </p>
            </div>
          )}
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(90deg, #22c55e 0%, #64748b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.01em' ,
                marginBottom: '1.5rem'
              }}>
                Ghi nhận dấu hiệu sinh tồn
              </h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  residentId: parseInt(formData.get('residentId') as string),
                  date: formData.get('date') as string,
                  time: formData.get('time') as string,
                  bloodPressureSystolic: parseInt(formData.get('bloodPressureSystolic') as string),
                  bloodPressureDiastolic: parseInt(formData.get('bloodPressureDiastolic') as string),
                  heartRate: parseInt(formData.get('heartRate') as string),
                  temperature: parseFloat(formData.get('temperature') as string),
                  oxygenSaturation: parseInt(formData.get('oxygenSaturation') as string),
                  respiratoryRate: parseInt(formData.get('respiratoryRate') as string),
                  weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : undefined,
                  bloodSugar: formData.get('bloodSugar') ? parseInt(formData.get('bloodSugar') as string) : undefined,
                  notes: formData.get('notes') as string || undefined
                };
                handleAddVitalSigns(data);
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Người cao tuổi *
                    </label>
                    <select
                      name="residentId" 
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Chọn người cao tuổi</option>
                      {residents.map(resident => (
                        <option key={resident.id} value={resident.id}>
                          {resident.name} - {resident.room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Ngày *
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={currentDate}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Giờ *
                    </label>
                    <input
                      type="time"
                      name="time"
                      defaultValue={new Date().toTimeString().slice(0, 5)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Huyết áp tâm thu *
                    </label>
                    <input
                      type="number"
                      name="bloodPressureSystolic"
                      placeholder="120"
                      min="60"
                      max="250"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Huyết áp tâm trương *
                    </label>
                    <input
                      type="number"
                      name="bloodPressureDiastolic"
                      placeholder="80"
                      min="40"
                      max="150"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Nhịp tim (bpm) *
                    </label>
                    <input
                      type="number"
                      name="heartRate"
                      placeholder="72"
                      min="30"
                      max="200"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Nhiệt độ (°C) *
                    </label>
                    <input
                      type="number"
                      name="temperature"
                      placeholder="36.5"
                      min="30"
                      max="45"
                      step="0.1"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      SpO2 (%) *
                    </label>
                    <input
                      type="number"
                      name="oxygenSaturation"
                      placeholder="98"
                      min="70"
                      max="100"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Nhịp thở (lần/phút) *
                    </label>
                    <input
                      type="number"
                      name="respiratoryRate"
                      placeholder="16"
                      min="5"
                      max="60"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Cân nặng (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      placeholder="65"
                      min="20"
                      max="200"
                      step="0.1"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Đường huyết (mg/dL)
                    </label>
                    <input
                      type="number"
                      name="bloodSugar"
                      placeholder="120"
                      min="50"
                      max="500"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ghi chú
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Ghi chú về tình trạng người cao tuổi..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Lưu dữ liệu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
