"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface MedicationRecord {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'injection' | 'topical' | 'inhaled';
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
  nextDose?: string;
  lastTaken?: string;
}

interface MedicationLog {
  id: number;
  medicationName: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'scheduled' | 'administered' | 'missed' | 'refused';
  administeredBy?: string;
  notes?: string;
  date: string;
}

interface ResidentInfo {
  id: number;
  name: string;
  relationship: string;
  room: string;
  age: number;
}

export default function FamilyMedicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [medicationRecords, setMedicationRecords] = useState<MedicationRecord[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [resident, setResident] = useState<ResidentInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = () => {
    // Mock resident info
    const mockResident: ResidentInfo = {
      id: 1,
      name: 'Nguyễn Văn Bảy',
      relationship: 'Bố',
      room: 'P201',
      age: 75
    };

    // Mock medication records
    const mockRecords: MedicationRecord[] = [
      {
        id: 1,
        medicationName: 'Amlodipine',
        dosage: '5mg',
        frequency: '1 lần/ngày',
        route: 'oral',
        prescribedBy: 'BS. Nguyễn Văn X',
        startDate: '2024-01-01',
        instructions: 'Uống vào buổi sáng sau ăn để giảm huyết áp',
        status: 'active',
        nextDose: '08:00',
        lastTaken: '2024-01-14 08:15'
      },
      {
        id: 2,
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: '2 lần/ngày',
        route: 'oral',
        prescribedBy: 'BS. Trần Thị Y',
        startDate: '2024-01-01',
        instructions: 'Uống trước bữa ăn sáng và tối để kiểm soát đường huyết',
        status: 'active',
        nextDose: '19:30',
        lastTaken: '2024-01-14 07:30'
      },
      {
        id: 3,
        medicationName: 'Vitamin D3',
        dosage: '1000IU',
        frequency: '1 lần/ngày',
        route: 'oral',
        prescribedBy: 'BS. Lê Văn Z',
        startDate: '2023-12-01',
        endDate: '2024-01-10',
        instructions: 'Bổ sung vitamin D, đã hoàn thành liệu trình',
        status: 'completed',
        lastTaken: '2024-01-10 20:00'
      }
    ];

    // Mock medication logs for selected date
    const mockLogs: MedicationLog[] = [
      {
        id: 1,
        medicationName: 'Amlodipine 5mg',
        scheduledTime: '08:00',
        actualTime: '08:15',
        status: 'administered',
        administeredBy: 'Y tá Nguyễn Văn A',
        date: selectedDate,
        notes: 'Cư dân uống thuốc bình thường, không có phản ứng phụ'
      },
      {
        id: 2,
        medicationName: 'Metformin 500mg',
        scheduledTime: '07:30',
        actualTime: '07:35',
        status: 'administered',
        administeredBy: 'Y tá Nguyễn Văn A',
        date: selectedDate
      },
      {
        id: 3,
        medicationName: 'Metformin 500mg',
        scheduledTime: '19:30',
        status: 'scheduled',
        date: selectedDate
      }
    ];

    setResident(mockResident);
    setMedicationRecords(mockRecords);
    setMedicationLogs(mockLogs);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'discontinued': return '#ef4444';
      case 'scheduled': return '#f59e0b';
      case 'administered': return '#10b981';
      case 'missed': return '#ef4444';
      case 'refused': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang sử dụng';
      case 'completed': return 'Đã hoàn thành';
      case 'discontinued': return 'Ngừng thuốc';
      case 'scheduled': return 'Chờ uống';
      case 'administered': return 'Đã uống';
      case 'missed': return 'Bỏ lỡ';
      case 'refused': return 'Từ chối';
      default: return status;
    }
  };

  const getRouteText = (route: string) => {
    switch (route) {
      case 'oral': return 'Uống';
      case 'injection': return 'Tiêm';
      case 'topical': return 'Thoa ngoài da';
      case 'inhaled': return 'Hít';
      default: return route;
    }
  };

  const activeMedications = medicationRecords.filter(med => med.status === 'active');
  const todayLogs = medicationLogs.filter(log => log.date === selectedDate);

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
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 0.5rem 0'
            }}>
              Thông Tin Thuốc
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Theo dõi việc sử dụng thuốc của {resident?.name} ({resident?.relationship})
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minWidth(200px, 1fr))',
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
              <CubeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Thuốc đang dùng</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {activeMedications.length}
                </p>
              </div>
            </div>
          </div>

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
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đã uống hôm nay</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {todayLogs.filter(log => log.status === 'administered').length}
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
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Chờ uống</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                  {todayLogs.filter(log => log.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setActiveTab('current')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'none',
                border: 'none',
                borderRadius: '1rem 0 0 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'current' ? '#f59e0b' : '#6b7280',
                borderBottom: activeTab === 'current' ? '2px solid #f59e0b' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <CubeIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                display: 'inline',
                marginRight: '0.5rem'
              }} />
              Thuốc đang dùng
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'none',
                border: 'none',
                borderRadius: '0 1rem 0 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'history' ? '#f59e0b' : '#6b7280',
                borderBottom: activeTab === 'history' ? '2px solid #f59e0b' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <CalendarDaysIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                display: 'inline',
                marginRight: '0.5rem'
              }} />
              Lịch sử uống thuốc
            </button>
          </div>
        </div>

        {activeTab === 'current' ? (
          /* Current Medications */
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {activeMedications.map((medication) => (
                <div key={medication.id} style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: `2px solid ${getStatusColor(medication.status)}20`
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
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {medication.medicationName}
                        </h3>
                        <span style={{
                          padding: '0.375rem 1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          background: `${getStatusColor(medication.status)}20`,
                          color: getStatusColor(medication.status)
                        }}>
                          {getStatusText(medication.status)}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        Kê bởi: {medication.prescribedBy} • 
                        Bắt đầu: {new Date(medication.startDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minWidth(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <CubeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6', margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Liều lượng</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                        {medication.dosage}
                      </p>
                    </div>

                    <div style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b', margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Tần suất</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                        {medication.frequency}
                      </p>
                    </div>

                    <div style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981', margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Cách dùng</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                        {getRouteText(medication.route)}
                      </p>
                    </div>

                    {medication.nextDose && (
                      <div style={{
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        textAlign: 'center'
                      }}>
                        <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6', margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Lần uống tiếp</p>
                        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                          {medication.nextDose}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: '#f0f9ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <InformationCircleIcon style={{ 
                        width: '1.25rem', 
                        height: '1.25rem', 
                        color: '#3b82f6',
                        marginTop: '0.125rem'
                      }} />
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#1e40af',
                          margin: '0 0 0.5rem 0',
                          fontWeight: 600
                        }}>
                          Hướng dẫn sử dụng:
                        </p>
                        <p style={{
                          color: '#1e3a8a',
                          margin: 0,
                          lineHeight: 1.5
                        }}>
                          {medication.instructions}
                        </p>
                      </div>
                    </div>
                  </div>

                  {medication.lastTaken && (
                    <div style={{
                      padding: '1rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '0.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#065f46',
                        margin: '0 0 0.25rem 0',
                        fontWeight: 600
                      }}>
                        Lần uống gần nhất:
                      </p>
                      <p style={{
                        color: '#047857',
                        margin: 0
                      }}>
                        {new Date(medication.lastTaken).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {activeMedications.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem'
              }}>
                <CubeIcon style={{
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  color: '#d1d5db'
                }} />
                <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                  Hiện tại không có thuốc đang sử dụng
                </p>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                  Thông tin thuốc sẽ được cập nhật khi có đơn thuốc mới
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Medication History */
          <>
            {/* Date Filter */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Chọn ngày:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Medication History */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '1.5rem'
              }}>
                Lịch sử uống thuốc ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
              </h2>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {todayLogs.map((log) => (
                  <div key={log.id} style={{
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '0.75rem',
                    border: `2px solid ${getStatusColor(log.status)}20`
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
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {log.medicationName}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${getStatusColor(log.status)}20`,
                            color: getStatusColor(log.status)
                          }}>
                            {getStatusText(log.status)}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          Dự kiến: {log.scheduledTime}
                          {log.actualTime && ` • Thực tế: ${log.actualTime}`}
                          {log.administeredBy && ` • Phát thuốc: ${log.administeredBy}`}
                        </p>
                      </div>
                    </div>

                    {log.notes && (
                      <div style={{
                        padding: '1rem',
                        background: log.status === 'administered' ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${log.status === 'administered' ? '#a7f3d0' : '#fecaca'}`,
                        borderRadius: '0.5rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: log.status === 'administered' ? '#065f46' : '#991b1b',
                          margin: '0 0 0.5rem 0',
                          fontWeight: 600
                        }}>
                          Ghi chú:
                        </p>
                        <p style={{
                          color: log.status === 'administered' ? '#047857' : '#dc2626',
                          margin: 0
                        }}>
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {todayLogs.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem'
                }}>
                  <CalendarDaysIcon style={{
                    width: '3rem',
                    height: '3rem',
                    margin: '0 auto 1rem',
                    color: '#d1d5db'
                  }} />
                  <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
                    Không có lịch sử uống thuốc
                  </p>
                  <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                    Chọn ngày khác để xem lịch sử uống thuốc
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
