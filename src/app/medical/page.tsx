"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  DocumentPlusIcon,
  HeartIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';


// Mock medical records data
const medicalRecords = [
  { 
    id: 1, 
    residentName: 'Alice Johnson', 
    recordType: 'Ghi chú y tế',
    date: '2023-05-10',
    doctor: 'Dr. Robert Brown',
    status: 'Cập nhật',
    notes: 'Kiểm tra huyết áp định kỳ. Kết quả: 130/85.'
  },
  { 
    id: 2, 
    residentName: 'Robert Smith', 
    recordType: 'Kê đơn thuốc',
    date: '2023-05-08',
    doctor: 'Dr. Sarah Williams',
    status: 'Đang xử lý',
    notes: 'Kê đơn thuốc Lisinopril 10mg hàng ngày để kiểm soát huyết áp.'
  },
  { 
    id: 3, 
    residentName: 'Mary Williams', 
    recordType: 'Báo cáo xét nghiệm',
    date: '2023-05-05',
    doctor: 'Dr. Robert Brown',
    status: 'Hoàn thành',
    notes: 'Kết quả xét nghiệm máu cho thấy mức cholesterol cao. Đã khuyến nghị thay đổi chế độ ăn.'
  },
  { 
    id: 4, 
    residentName: 'James Brown', 
    recordType: 'Kiểm tra sức khỏe',
    date: '2023-05-02',
    doctor: 'Dr. Elizabeth Wilson',
    status: 'Hoàn thành',
    notes: 'Kiểm tra sức khỏe tổng quát hàng năm. Tình trạng chung ổn định.'
  },
  { 
    id: 5, 
    residentName: 'Patricia Davis', 
    recordType: 'Ghi chú y tế',
    date: '2023-04-28',
    doctor: 'Dr. Sarah Williams',
    status: 'Cập nhật',
    notes: 'Ghi nhận triệu chứng đau khớp. Đã đề xuất dùng thuốc giảm đau và theo dõi.'
  },
];

const recordTypes = ['Tất cả', 'Ghi chú y tế', 'Kê đơn thuốc', 'Báo cáo xét nghiệm', 'Kiểm tra sức khỏe'];
const statuses = ['Tất cả', 'Hoàn thành', 'Đang xử lý', 'Cập nhật'];

export default function MedicalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const router = useRouter();
  const { user } = useAuth();
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  // Handler functions for button actions
  const handleViewMedicalRecord = (recordId: number) => {
    router.push(`/medical/${recordId}`);
  };

  const handleEditMedicalRecord = (recordId: number) => {
    router.push(`/medical/${recordId}/edit`);
  };

  const handleCreateMedicalRecord = () => {
    router.push('/medical/new');
  };

  // Filter medical records based on search term, type and status
  const filteredRecords = medicalRecords.filter((record) => {
    const matchesSearch = record.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'Tất cả' || record.recordType === filterType;
    const matchesStatus = filterStatus === 'Tất cả' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <HeartIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Hồ sơ y tế
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {medicalRecords.length} hồ sơ y tế
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <Link 
            href="/medical/new" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
              textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
              >
                <PlusCircleIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
            Hồ sơ mới
          </Link>
            </div>
        </div>
      </div>
      

      
        {/* Filters Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            alignItems: 'end',
            gap: '1.5rem'
          }}>
            {/* Search Input */}
            <div>
              <label style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#374151',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm hồ sơ y tế
              </label>
              <div style={{position: 'relative'}}>
                <div style={{
                  position: 'absolute', 
                  top: 0, 
                  bottom: 0, 
                  left: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  pointerEvents: 'none'
                }}>
                  <MagnifyingGlassIcon style={{width: '1.125rem', height: '1.125rem', color: '#9ca3af'}} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm hồ sơ y tế..."
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                />
              </div>
            </div>

            {/* Filter Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              height: 'fit-content'
            }}>
              <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#ef4444'}} />
              <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#ef4444'}}>
                Lọc
              </span>
            </div>
            
            {/* Record Type Filter */}
            <div>
              <label style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#374151',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Loại hồ sơ
              </label>
              <select
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: 500,
                  minWidth: '12rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {recordTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#374151',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Trạng thái
              </label>
              <select
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: 500,
                  minWidth: '10rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Records Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
              {filteredRecords.map((record) => (
            <div
              key={record.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Record Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Bệnh nhân {record.residentName}
                  </h3>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                    fontWeight: 600, 
                      borderRadius: '9999px',
                    background: 
                      record.recordType === 'Ghi chú y tế' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 
                      record.recordType === 'Kê đơn thuốc' ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 
                      record.recordType === 'Báo cáo xét nghiệm' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' :
                      'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    color: 
                      record.recordType === 'Ghi chú y tế' ? '#1d4ed8' : 
                      record.recordType === 'Kê đơn thuốc' ? '#dc2626' : 
                      record.recordType === 'Báo cáo xét nghiệm' ? '#166534' :
                      '#d97706',
                    border: '1px solid',
                    borderColor:
                      record.recordType === 'Ghi chú y tế' ? '#93c5fd' : 
                      record.recordType === 'Kê đơn thuốc' ? '#fca5a5' : 
                      record.recordType === 'Báo cáo xét nghiệm' ? '#86efac' :
                      '#fbbf24'
                  }}>
                    {record.recordType}
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex', 
                  padding: '0.25rem 0.625rem', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  borderRadius: '0.375rem',
                  background: 
                    record.status === 'Hoàn thành' ? 'rgba(16, 185, 129, 0.1)' : 
                    record.status === 'Đang xử lý' ? 'rgba(245, 158, 11, 0.1)' : 
                    'rgba(59, 130, 246, 0.1)',
                      color: 
                    record.status === 'Hoàn thành' ? '#059669' : 
                    record.status === 'Đang xử lý' ? '#d97706' : 
                    '#2563eb',
                  border: '1px solid',
                  borderColor:
                    record.status === 'Hoàn thành' ? '#86efac' : 
                    record.status === 'Đang xử lý' ? '#fbbf24' : 
                    '#93c5fd'
                }}>
                  {record.status}
                </span>
              </div>

              {/* Record Details */}
              <div style={{marginBottom: '1rem'}}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Ngày
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {new Date(record.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      fontWeight: 500, 
                      display: 'block'
                    }}>
                      Bác sĩ
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      fontWeight: 600
                    }}>
                      {record.doctor}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: '0.25rem'
                  }}>
                    Ghi chú
                  </span>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {record.notes}
                  </p>
                    </div>
        </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  onClick={() => handleViewMedicalRecord(record.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                  }}
                  title="Xem chi tiết bệnh án"
                >
                  <EyeIcon style={{width: '1rem', height: '1rem'}} />
                </button>
                <button
                  onClick={() => handleEditMedicalRecord(record.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                  }}
                  title="Chỉnh sửa bệnh án"
                >
                  <PencilIcon style={{width: '1rem', height: '1rem'}} />
                </button>
              </div>
            </div>
          ))}
        
        {filteredRecords.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <HeartIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    margin: 0,
                    marginBottom: '0.5rem'
                  }}>
                    Không tìm thấy hồ sơ y tế nào
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#9ca3af',
                    margin: 0
                  }}>
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                  </p>
                </div>
              </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
} 
