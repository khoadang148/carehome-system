"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon,
  UserIcon,
  HeartIcon,
  PhoneIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { RESIDENTS_DATA } from '@/lib/data/residents-data';
import { useAuth } from '@/lib/contexts/auth-context';

import CareNotesDisplay from '@/components/staff/CareNotesDisplay';
import AppointmentsDisplay from '@/components/staff/AppointmentsDisplay';


export default function ResidentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get residentId from params directly
  const residentId = params.id;
  
  useEffect(() => {
    // Simulate API call to fetch resident data
    const fetchResident = async () => {
      try {
        // In a real application, you would fetch from an API endpoint
        const id = parseInt(residentId);
        
        // Check if there's saved residents data in localStorage
        let residents = RESIDENTS_DATA;
        const savedResidents = localStorage.getItem('nurseryHomeResidents');
        if (savedResidents) {
          residents = JSON.parse(savedResidents);
        }
        
        const foundResident = residents.find(r => r.id === id);
        
        if (foundResident) {
          setResident(foundResident);
        } else {
          // Resident not found, redirect to list
          router.push('/residents');
        }
      } catch (error) {
        console.error('Error fetching resident:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResident();
  }, [residentId, router, refreshKey]);
  
  const handleEditClick = () => {
    router.push(`/residents/${residentId}/edit`);
  };

  const handleActionComplete = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Show loading state while fetching data
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
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Đang tải thông tin cư dân...
          </p>
        </div>
      </div>
    );
  }
  
  // If resident is not found
  if (!resident) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <ExclamationCircleIcon style={{
            width: '3rem',
            height: '3rem',
            color: '#f59e0b',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            Không tìm thấy cư dân
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            Cư dân này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/residents"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }
  
  // Helper function to render care level with appropriate color
  const renderCareLevel = (level: string) => {
    const colors = {
      'Cơ bản': { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' },
      'Nâng cao': { bg: '#dcfce7', text: '#166534', border: '#10b981' },
      'Cao cấp': { bg: '#f3e8ff', text: '#7c3aed', border: '#8b5cf6' },
      'Đặc biệt': { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' }
    };
    
    const color = colors[level as keyof typeof colors] || colors['Cơ bản'];
      
    return (
      <span style={{
        display: 'inline-flex', 
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.5rem 1rem', 
        fontSize: '0.875rem', 
        fontWeight: 600, 
        borderRadius: '0.75rem',
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}20`
      }}>
        <ShieldCheckIcon style={{ width: '1rem', height: '1rem' }} />
        {level}
      </span>
    );
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'đang chăm sóc':
        return { bg: '#dcfce7', text: '#166534', icon: CheckCircleIcon };
      case 'discharged':
      case 'đã xuất viện':
        return { bg: '#fef3c7', text: '#d97706', icon: ExclamationCircleIcon };
      default:
        return { bg: '#dbeafe', text: '#1d4ed8', icon: CheckCircleIcon };
    }
  };

  const statusStyle = getStatusColor(resident.status || 'Đang chăm sóc');

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: UserIcon },
    { id: 'medical', label: 'Y tế', icon: HeartIcon },
    { id: 'contact', label: 'Liên hệ', icon: PhoneIcon },
    { id: 'activities', label: 'Hoạt động', icon: CalendarIcon },
    { id: 'notes', label: 'Ghi chú', icon: ClipboardDocumentListIcon }
  ];
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <Link
              href="/residents"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.75rem',
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Link>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b'
              }}>
                {resident.name}
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <span style={{
                  fontSize: '1rem',
                  color: '#64748b'
                }}>
                  {resident.age} tuổi • Phòng {resident.room}
                </span>
                {renderCareLevel(resident.careLevel)}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderRadius: '9999px',
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text
                }}>
                  <statusStyle.icon style={{ width: '0.875rem', height: '0.875rem' }} />
                  {resident.status || 'Đang chăm sóc'}
                </span>
              </div>
        </div>
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            color: 'white',
                borderRadius: '0.75rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
          }}
        >
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
          Chỉnh sửa thông tin
        </button>
      </div>
      
          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.5rem'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: activeTab === tab.id ? 
                    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                    'rgba(248, 250, 252, 0.8)',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  border: `1px solid ${activeTab === tab.id ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <tab.icon style={{ width: '1rem', height: '1rem' }} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Personal Information Card */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                Thông tin cá nhân
              </h3>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Ngày sinh
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Giới tính
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'Khác'}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                    Tình trạng di chuyển
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.mobilityStatus || 'Chưa cập nhật'}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                    Chế độ ăn đặc biệt
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                    {resident.dietaryRestrictions || 'Không có'}
                  </p>
                </div>
              </div>
            </div>

              {/* Care Package Card */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheckIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    Gói dịch vụ
                </h3>
                </div>
                
                {resident.carePackage ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Tên gói
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                        {resident.carePackage.name}
                      </p>
                  </div>
                  <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Giá gói
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(resident.carePackage.price)}/tháng
                    </p>
                  </div>
                  <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Ngày đăng ký
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {new Date(resident.carePackage.purchaseDate).toLocaleDateString('vi-VN')}
                    </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                  Chưa đăng ký gói dịch vụ nào
                </p>
                <Link
                  href="/services"
                  style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                        borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}
                >
                  Xem các gói dịch vụ
                </Link>
              </div>
            )}
          </div>
            </div>
          )}

          {/* Medical Tab */}
          {activeTab === 'medical' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Medical Conditions */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HeartIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    Tình trạng sức khỏe
                  </h3>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {(resident.medicalConditions || []).length > 0 ? (
                    (resident.medicalConditions || []).map((condition: string, index: number) => (
                      <div key={index} style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                          {condition}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Không có tình trạng sức khỏe đặc biệt
                    </p>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Thuốc đang sử dụng
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {(resident.medications || []).length > 0 ? (
                    (resident.medications || []).map((medication: string, index: number) => (
                      <div key={index} style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                          {medication}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Không có thuốc đang sử dụng
                    </p>
                  )}
                </div>
              </div>

              {/* Allergies */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Dị ứng
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {(resident.allergies || []).length > 0 ? (
                    (resident.allergies || []).map((allergy: string, index: number) => (
                      <div key={index} style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        fontWeight: 500
                      }}>
                        {allergy}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Không có dị ứng đã biết
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PhoneIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: 0,
                  color: '#1e293b'
                }}>
                  Thông tin liên hệ khẩn cấp
                </h3>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    Người liên hệ khẩn cấp
                  </p>
                  <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                    {resident.emergencyContact || 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    Số điện thoại liên hệ
                  </p>
                  <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                    {resident.contactPhone || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Individual Appointments */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Lịch hẹn riêng lẻ
                </h3>
                <AppointmentsDisplay
                  appointments={resident.appointments || []}
                  isStaff={user?.role === 'staff'}
                />
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Care Notes */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Ghi chú chăm sóc
                </h3>
                <CareNotesDisplay
                  careNotes={resident.careNotes || []}
                  isStaff={user?.role === 'staff'}
                />
          </div>
          
              {/* Personal Notes */}
              {resident.personalNotes && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: '0 0 1rem 0',
                    color: '#1e293b'
                  }}>
                    Ghi chú cá nhân
            </h3>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, lineHeight: '1.6' }}>
                      {resident.personalNotes}
                    </p>
                  </div>
                </div>
              )}
          </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 