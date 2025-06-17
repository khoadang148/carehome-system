"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AttendanceRecord {
  id: number;
  staffId: number;
  staffName: string;
  position: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'overtime';
  notes?: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = () => {
    // Mock data - trong thực tế sẽ load từ API
    const mockAttendance: AttendanceRecord[] = [
      {
        id: 1,
        staffId: 1,
        staffName: 'Nguyễn Văn A',
        position: 'Y tá',
        department: 'Y tế',
        date: selectedDate,
        checkIn: '07:45',
        checkOut: '16:15',
        totalHours: 8.5,
        status: 'present'
      },
      {
        id: 2,
        staffId: 2,
        staffName: 'Trần Thị B',
        position: 'Người chăm sóc',
        department: 'Chăm sóc người cao tuổi',
        date: selectedDate,
        checkIn: '08:15',
        checkOut: null,
        totalHours: 0,
        status: 'late',
        notes: 'Đến muộn 15 phút do kẹt xe'
      },
      {
        id: 3,
        staffId: 3,
        staffName: 'Lê Văn C',
        position: 'Vật lý trị liệu',
        department: 'Phục hồi chức năng',
        date: selectedDate,
        checkIn: '07:30',
        checkOut: '17:45',
        totalHours: 10.25,
        status: 'overtime'
      },
      {
        id: 4,
        staffId: 4,
        staffName: 'Phạm Thị D',
        position: 'Trợ lý y tá',
        department: 'Y tế',
        date: selectedDate,
        checkIn: null,
        checkOut: null,
        totalHours: 0,
        status: 'absent',
        notes: 'Nghỉ phép có báo trước'
      }
    ];
    setAttendanceData(mockAttendance);
  };

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || record.department === departmentFilter;
    const matchesStatus = !statusFilter || record.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'early_leave': return '#8b5cf6';
      case 'overtime': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Có mặt';
      case 'absent': return 'Vắng mặt';
      case 'late': return 'Đến muộn';
      case 'early_leave': return 'Về sớm';
      case 'overtime': return 'Làm thêm';
      default: return 'Không xác định';
    }
  };

  const calculateAttendanceStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(r => r.status === 'present').length;
    const absent = attendanceData.filter(r => r.status === 'absent').length;
    const late = attendanceData.filter(r => r.status === 'late').length;
    const overtime = attendanceData.filter(r => r.status === 'overtime').length;

    return { total, present, absent, late, overtime };
  };

  const stats = calculateAttendanceStats();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <ClockIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Chấm Công Nhân Viên
            </h1>
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Theo dõi và quản lý thời gian làm việc của đội ngũ chăm sóc
          </p>
        </div>

        {/* Statistics Cards */}
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
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserGroupIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Tổng số</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Có mặt</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {stats.present}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đến muộn</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {stats.late}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#06b6d4' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Làm thêm</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {stats.overtime}
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
                Ngày chấm công
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
                Tìm kiếm nhân viên
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Tên hoặc chức vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Phòng ban
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả phòng ban</option>
                <option value="Y tế">Y tế</option>
                <option value="Chăm sóc người cao tuổi">Chăm sóc người cao tuổi</option>
                <option value="Phục hồi chức năng">Phục hồi chức năng</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Quản lý">Quản lý</option>
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
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="present">Có mặt</option>
                <option value="absent">Vắng mặt</option>
                <option value="late">Đến muộn</option>
                <option value="early_leave">Về sớm</option>
                <option value="overtime">Làm thêm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Nhân viên
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Chức vụ
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Phòng ban
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Giờ vào
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Giờ ra
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Tổng giờ
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Trạng thái
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record, index) => (
                  <tr key={record.id} style={{
                    borderBottom: index < filteredAttendance.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>
                        {record.staffName}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {record.position}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {record.department}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        background: record.checkIn ? '#f0f9ff' : '#fef2f2',
                        color: record.checkIn ? '#0369a1' : '#dc2626'
                      }}>
                        {record.checkIn || '--:--'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        background: record.checkOut ? '#f0f9ff' : '#fef2f2',
                        color: record.checkOut ? '#0369a1' : '#dc2626'
                      }}>
                        {record.checkOut || '--:--'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                      {record.totalHours > 0 ? `${record.totalHours}h` : '--'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        background: `${getStatusColor(record.status)}20`,
                        color: getStatusColor(record.status)
                      }}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {record.notes || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAttendance.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <ClockIcon style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 1rem',
                color: '#d1d5db'
              }} />
              <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>
                Không tìm thấy dữ liệu chấm công
              </p>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Thử thay đổi bộ lọc hoặc chọn ngày khác
              </p>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
          }}>
            <ArrowDownTrayIcon style={{ width: '1rem', height: '1rem' }} />
            Xuất báo cáo Excel
          </button>
        </div>
      </div>
    </div>
  );
} 
