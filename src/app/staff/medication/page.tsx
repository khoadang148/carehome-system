"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CubeIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface MedicationRecord {
  id: number;
  residentId: number;
  residentName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'injection' | 'topical' | 'inhaled';
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
}

interface MedicationLog {
  id: number;
  medicationRecordId: number;
  residentName: string;
  medicationName: string;
  scheduledTime: string;
  actualTime?: string;
  dosageGiven: string;
  status: 'scheduled' | 'administered' | 'missed' | 'refused';
  administeredBy?: string;
  notes?: string;
  date: string;
}

export default function StaffMedicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [medicationRecords, setMedicationRecords] = useState<MedicationRecord[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedResident, setSelectedResident] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'records'>('schedule');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = () => {
    // Mock medication records
    const mockRecords: MedicationRecord[] = [
      {
        id: 1,
        residentId: 1,
        residentName: 'Nguyễn Văn Bảy',
        medicationName: 'Amlodipine',
        dosage: '5mg',
        frequency: '1 lần/ngày',
        route: 'oral',
        prescribedBy: 'BS. Nguyễn Văn X',
        startDate: '2024-01-01',
        instructions: 'Uống vào buổi sáng sau ăn',
        status: 'active'
      },
      {
        id: 2,
        residentId: 1,
        residentName: 'Nguyễn Văn Bảy',
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: '2 lần/ngày',
        route: 'oral',
        prescribedBy: 'BS. Trần Thị Y',
        startDate: '2024-01-01',
        instructions: 'Uống trước bữa ăn sáng và tối',
        status: 'active'
      }
    ];

    // Mock medication logs for today
    const mockLogs: MedicationLog[] = [
      {
        id: 1,
        medicationRecordId: 1,
        residentName: 'Nguyễn Văn Bảy',
        medicationName: 'Amlodipine 5mg',
        scheduledTime: '08:00',
        actualTime: '08:15',
        dosageGiven: '5mg',
        status: 'administered',
        administeredBy: user?.name || 'Staff',
        date: currentDate,
        notes: 'Cư dân uống thuốc bình thường'
      },
      {
        id: 2,
        medicationRecordId: 2,
        residentName: 'Nguyễn Văn Bảy',
        medicationName: 'Metformin 500mg',
        scheduledTime: '07:30',
        status: 'scheduled',
        dosageGiven: '500mg',
        date: currentDate
      },
      {
        id: 3,
        medicationRecordId: 2,
        residentName: 'Nguyễn Văn Bảy',
        medicationName: 'Metformin 500mg',
        scheduledTime: '19:30',
        status: 'scheduled',
        dosageGiven: '500mg',
        date: currentDate
      }
    ];

    setMedicationRecords(mockRecords);
    setMedicationLogs(mockLogs);
    setLoading(false);
  };

  const handleAdministerMedication = (logId: number, status: 'administered' | 'missed' | 'refused', notes?: string) => {
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    setMedicationLogs(prev => prev.map(log => 
      log.id === logId 
        ? { 
            ...log, 
            status,
            actualTime: status === 'administered' ? currentTime : undefined,
            administeredBy: status === 'administered' ? user?.name || 'Staff' : undefined,
            notes
          }
        : log
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#f59e0b';
      case 'administered': return '#10b981';
      case 'missed': return '#ef4444';
      case 'refused': return '#dc2626';
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'discontinued': return '#ef4444';
      default: return '#6b7280';
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

  const todayLogs = medicationLogs.filter(log => log.date === currentDate);
  const filteredLogs = selectedResident 
    ? todayLogs.filter(log => {
        const record = medicationRecords.find(r => r.id === log.medicationRecordId);
        return record?.residentId === selectedResident;
      })
    : todayLogs;

  const residents = Array.from(new Set(medicationRecords.map(r => ({ id: r.residentId, name: r.residentName }))))
    .filter((resident, index, self) => self.findIndex(r => r.id === resident.id) === index);

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
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 0.5rem 0'
            }}>
              Quản Lý Thuốc
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Theo dõi lịch uống thuốc và ghi nhận việc phát thuốc cho cư dân
            </p>
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
              onClick={() => setActiveTab('schedule')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'none',
                border: 'none',
                borderRadius: '1rem 0 0 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'schedule' ? '#f59e0b' : '#6b7280',
                borderBottom: activeTab === 'schedule' ? '2px solid #f59e0b' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <ClockIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                display: 'inline',
                marginRight: '0.5rem'
              }} />
              Lịch uống thuốc hôm nay
            </button>
            <button
              onClick={() => setActiveTab('records')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'none',
                border: 'none',
                borderRadius: '0 1rem 0 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'records' ? '#f59e0b' : '#6b7280',
                borderBottom: activeTab === 'records' ? '2px solid #f59e0b' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <CubeIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                display: 'inline',
                marginRight: '0.5rem'
              }} />
              Đơn thuốc
            </button>
          </div>
        </div>

        {activeTab === 'schedule' ? (
          <>
            {/* Statistics */}
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
                border: '2px solid #f59e0b20'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Chờ phát</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                      {filteredLogs.filter(l => l.status === 'scheduled').length}
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
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đã phát</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                      {filteredLogs.filter(l => l.status === 'administered').length}
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
                  <XCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Bỏ lỡ/Từ chối</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                      {filteredLogs.filter(l => l.status === 'missed' || l.status === 'refused').length}
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
                gridTemplateColumns: 'repeat(auto-fit, minwidth(200px, 1fr))',
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
                    Cư dân
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
                    <option value="">Tất cả cư dân</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Medication Schedule */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {filteredLogs.map((log) => (
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
                          <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {log.residentName}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${getStatusColor(log.status)}20`,
                            color: getStatusColor(log.status)
                          }}>
                            {log.status === 'scheduled' ? 'Chờ phát' :
                             log.status === 'administered' ? 'Đã phát' :
                             log.status === 'missed' ? 'Bỏ lỡ' : 'Từ chối'}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {log.medicationName} • Dự kiến: {log.scheduledTime}
                          {log.actualTime && ` • Thực tế: ${log.actualTime}`}
                        </p>
                      </div>

                      {log.status === 'scheduled' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              const notes = prompt('Ghi chú (nếu có):');
                              handleAdministerMedication(log.id, 'administered', notes || undefined);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Đã phát
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Lý do bỏ lỡ:');
                              if (reason) {
                                handleAdministerMedication(log.id, 'missed', reason);
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Bỏ lỡ
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Lý do từ chối:');
                              if (reason) {
                                handleAdministerMedication(log.id, 'refused', reason);
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minWidth(150px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Liều lượng
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {log.dosageGiven}
                        </p>
                      </div>
                      {log.administeredBy && (
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Người phát thuốc
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {log.administeredBy}
                          </p>
                        </div>
                      )}
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

              {filteredLogs.length === 0 && (
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
                    Không có lịch uống thuốc
                  </p>
                  <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                    Không có thuốc nào cần phát hôm nay
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Medication Records Tab */
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {medicationRecords.map((record) => (
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
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {record.medicationName} {record.dosage}
                        </h3>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getStatusColor(record.status)}20`,
                          color: getStatusColor(record.status)
                        }}>
                          {record.status === 'active' ? 'Đang dùng' :
                           record.status === 'completed' ? 'Hoàn thành' : 'Ngừng thuốc'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        Cư dân: {record.residentName} • Bác sĩ kê: {record.prescribedBy}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minWidth(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Tần suất
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {record.frequency}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Đường dùng
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {getRouteText(record.route)}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Ngày bắt đầu
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {new Date(record.startDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    {record.endDate && (
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Ngày kết thúc
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {new Date(record.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: '#f0f9ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem'
                  }}>
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
                      margin: 0
                    }}>
                      {record.instructions}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {medicationRecords.length === 0 && (
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
                  Không có đơn thuốc
                </p>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                  Chưa có đơn thuốc nào được kê
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
