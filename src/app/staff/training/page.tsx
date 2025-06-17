"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface TrainingProgram {
  id: number;
  title: string;
  description: string;
  category: 'mandatory' | 'optional' | 'certification';
  instructor: string;
  duration: number; // in hours
  maxParticipants: number;
  startDate: string;
  endDate: string;
  schedule: string[];
  requirements: string[];
  materials: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface TrainingRecord {
  id: number;
  staffId: number;
  staffName: string;
  position: string;
  department: string;
  programId: number;
  programTitle: string;
  enrollmentDate: string;
  completionDate?: string;
  score?: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'dropped';
  certificateIssued: boolean;
}

export default function TrainingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'programs' | 'records'>('programs');
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = () => {
    // Mock training programs
    const mockPrograms: TrainingProgram[] = [
      {
        id: 1,
        title: 'Chăm sóc người cao tuổi nâng cao',
        description: 'Khóa đào tạo nâng cao kỹ năng chăm sóc người cao tuổi, bao gồm các kỹ thuật chăm sóc chuyên biệt và xử lý tình huống khẩn cấp.',
        category: 'mandatory',
        instructor: 'Bác sĩ Nguyễn Văn A',
        duration: 40,
        maxParticipants: 20,
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        schedule: ['Thứ 2, 4, 6: 14:00-18:00'],
        requirements: [
          'Có kinh nghiệm chăm sóc tối thiểu 6 tháng',
          'Hoàn thành khóa cơ bản',
          'Chứng chỉ sơ cấp cứu còn hiệu lực'
        ],
        materials: [
          'Sách hướng dẫn chăm sóc người cao tuổi',
          'Video thực hành',
          'Bộ dụng cụ thực hành'
        ],
        status: 'upcoming'
      },
      {
        id: 2,
        title: 'An toàn lao động và phòng chống nhiễm khuẩn',
        description: 'Đào tạo bắt buộc về an toàn lao động, quy trình phòng chống nhiễm khuẩn trong môi trường chăm sóc y tế.',
        category: 'mandatory',
        instructor: 'Chuyên viên Kiểm soát nhiễm khuẩn',
        duration: 16,
        maxParticipants: 30,
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        schedule: ['Thứ 2-6: 08:00-12:00'],
        requirements: [
          'Tất cả nhân viên mới',
          'Đào tạo lại hàng năm cho nhân viên cũ'
        ],
        materials: [
          'Tài liệu hướng dẫn an toàn',
          'Thiết bị bảo hộ mẫu',
          'Checklist quy trình'
        ],
        status: 'ongoing'
      },
      {
        id: 3,
        title: 'Chứng chỉ Vật lý trị liệu cơ bản',
        description: 'Khóa đào tạo chứng chỉ về vật lý trị liệu cơ bản cho người cao tuổi, bao gồm các bài tập phục hồi chức năng.',
        category: 'certification',
        instructor: 'Thạc sĩ Vật lý trị liệu Lê Thị B',
        duration: 80,
        maxParticipants: 15,
        startDate: '2024-03-01',
        endDate: '2024-04-15',
        schedule: ['Thứ 7, Chủ nhật: 08:00-17:00'],
        requirements: [
          'Bằng cấp liên quan đến y tế',
          'Kinh nghiệm làm việc tối thiểu 1 năm',
          'Đăng ký trước 30 ngày'
        ],
        materials: [
          'Giáo trình vật lý trị liệu',
          'Thiết bị thực hành',
          'Phần mềm mô phỏng'
        ],
        status: 'upcoming'
      }
    ];

    // Mock training records
    const mockRecords: TrainingRecord[] = [
      {
        id: 1,
        staffId: 1,
        staffName: 'Nguyễn Văn A',
        position: 'Y tá',
        department: 'Y tế',
        programId: 1,
        programTitle: 'Chăm sóc người cao tuổi nâng cao',
        enrollmentDate: '2024-01-20',
        completionDate: '2024-02-15',
        score: 88,
        status: 'completed',
        certificateIssued: true
      },
      {
        id: 2,
        staffId: 2,
        staffName: 'Trần Thị B',
        position: 'Người chăm sóc',
        department: 'Chăm sóc người cao tuổi',
        programId: 2,
        programTitle: 'An toàn lao động và phòng chống nhiễm khuẩn',
        enrollmentDate: '2024-01-15',
        status: 'in_progress',
        certificateIssued: false
      },
      {
        id: 3,
        staffId: 3,
        staffName: 'Lê Văn C',
        position: 'Vật lý trị liệu',
        department: 'Phục hồi chức năng',
        programId: 3,
        programTitle: 'Chứng chỉ Vật lý trị liệu cơ bản',
        enrollmentDate: '2024-02-01',
        status: 'enrolled',
        certificateIssued: false
      }
    ];

    setTrainingPrograms(mockPrograms);
    setTrainingRecords(mockRecords);
  };

  const filteredPrograms = trainingPrograms.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || program.category === categoryFilter;
    const matchesStatus = !statusFilter || program.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredRecords = trainingRecords.filter(record => {
    const matchesSearch = record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.programTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mandatory': return '#ef4444';
      case 'optional': return '#3b82f6';
      case 'certification': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'mandatory': return 'Bắt buộc';
      case 'optional': return 'Tùy chọn';
      case 'certification': return 'Chứng chỉ';
      default: return category;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#f59e0b';
      case 'ongoing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'enrolled': return '#8b5cf6';
      case 'in_progress': return '#06b6d4';
      case 'failed': return '#ef4444';
      case 'dropped': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'enrolled': return 'Đã đăng ký';
      case 'in_progress': return 'Đang học';
      case 'failed': return 'Trượt';
      case 'dropped': return 'Bỏ học';
      default: return status;
    }
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <AcademicCapIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Quản Lý Đào Tạo
                </h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Quản lý các chương trình đào tạo và theo dõi tiến độ học tập của nhân viên
              </p>
            </div>
            <button
              style={{
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
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Tạo chương trình mới
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('programs')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === 'programs' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'transparent',
                color: activeTab === 'programs' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Chương trình đào tạo
            </button>
            <button
              onClick={() => setActiveTab('records')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === 'records' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'transparent',
                color: activeTab === 'records' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Hồ sơ đào tạo
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BookOpenIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Chương trình
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {trainingPrograms.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserGroupIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Đang học
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {trainingRecords.filter(r => r.status === 'in_progress' || r.status === 'enrolled').length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Hoàn thành
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {trainingRecords.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AcademicCapIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Chứng chỉ
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {trainingRecords.filter(r => r.certificateIssued).length}
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
                Tìm kiếm
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
                  placeholder={activeTab === 'programs' ? 'Tên chương trình...' : 'Tên nhân viên...'}
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

            {activeTab === 'programs' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Loại chương trình
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="">Tất cả loại</option>
                  <option value="mandatory">Bắt buộc</option>
                  <option value="optional">Tùy chọn</option>
                  <option value="certification">Chứng chỉ</option>
                </select>
              </div>
            )}

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
                {activeTab === 'programs' ? (
                  <>
                    <option value="upcoming">Sắp diễn ra</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </>
                ) : (
                  <>
                    <option value="enrolled">Đã đăng ký</option>
                    <option value="in_progress">Đang học</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="failed">Trượt</option>
                    <option value="dropped">Bỏ học</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'programs' ? (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredPrograms.map((program) => (
              <div key={program.id} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2rem',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {program.title}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${getCategoryColor(program.category)}20`,
                            color: getCategoryColor(program.category)
                          }}>
                            {getCategoryText(program.category)}
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${getStatusColor(program.status)}20`,
                            color: getStatusColor(program.status)
                          }}>
                            {getStatusText(program.status)}
                          </span>
                        </div>
                        <p style={{
                          color: '#6b7280',
                          lineHeight: 1.6,
                          margin: '0 0 1rem 0'
                        }}>
                          {program.description}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Giảng viên
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {program.instructor}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Thời lượng
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {program.duration} giờ
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Sĩ số tối đa
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {program.maxParticipants} người
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Thời gian
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {new Date(program.startDate).toLocaleDateString('vi-VN')} - {new Date(program.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Lịch học:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        {program.schedule.map((schedule, index) => (
                          <li key={index} style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem'
                          }}>
                            {schedule}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          margin: '0 0 0.5rem 0'
                        }}>
                          Yêu cầu tham gia:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                          {program.requirements.map((req, index) => (
                            <li key={index} style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          margin: '0 0 0.5rem 0'
                        }}>
                          Tài liệu học tập:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                          {program.materials.map((material, index) => (
                            <li key={index} style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              {material}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                      Xem chi tiết
                    </button>
                    <button style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                      Đăng ký
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
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
                      Chương trình
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Ngày đăng ký
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Ngày hoàn thành
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Điểm số
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
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Chứng chỉ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} style={{
                      borderBottom: index < filteredRecords.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>
                            {record.staffName}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {record.position} • {record.department}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500, color: '#374151' }}>
                          {record.programTitle}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                        {new Date(record.enrollmentDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                        {record.completionDate 
                          ? new Date(record.completionDate).toLocaleDateString('vi-VN')
                          : '--'
                        }
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {record.score ? (
                          <span style={{
                            fontWeight: 600,
                            color: record.score >= 80 ? '#10b981' : record.score >= 60 ? '#f59e0b' : '#ef4444'
                          }}>
                            {record.score}/100
                          </span>
                        ) : '--'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
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
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {record.certificateIssued ? (
                          <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <AcademicCapIcon style={{
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  color: '#d1d5db'
                }} />
                <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>
                  Không tìm thấy hồ sơ đào tạo
                </p>
                <p style={{ margin: '0.5rem 0 0 0' }}>
                  Thử thay đổi bộ lọc hoặc tạo chương trình mới
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
