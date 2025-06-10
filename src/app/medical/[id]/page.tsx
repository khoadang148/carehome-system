"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ClockIcon, 
  UserIcon,
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Mock medical records data
const medicalRecordsData = [
  {
    id: 1,
    residentId: 1,
    residentName: 'Nguyễn Văn A',
    recordType: 'Khám định kỳ',
    date: '2024-01-15',
    doctor: 'Dr. Robert Brown',
    symptoms: 'Đau đầu nhẹ, mệt mỏi, khó ngủ',
    diagnosis: 'Tăng huyết áp nhẹ, thiếu vitamin D',
    treatment: 'Điều chỉnh chế độ ăn uống, tăng cường vận động nhẹ, bổ sung vitamin D',
    medications: ['Lisinopril 10mg', 'Vitamin D3 1000IU'],
    followUp: '2024-02-15',
    notes: 'Cần theo dõi huyết áp hàng tuần. Khuyến khích tham gia các hoạt động thể chất nhẹ.',
    priority: 'Trung bình',
    status: 'Hoàn thành',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    residentId: 2,
    residentName: 'Trần Thị B',
    recordType: 'Cấp cứu',
    date: '2024-01-16',
    doctor: 'Dr. Sarah Williams',
    symptoms: 'Khó thở, đau ngực, choáng váng',
    diagnosis: 'Cơn hen suyễn cấp',
    treatment: 'Nebulizer với albuterol, corticosteroid, theo dõi oxy trong máu',
    medications: ['Albuterol inhaler', 'Prednisolone 20mg'],
    followUp: '2024-01-20',
    notes: 'Phản ứng tốt với điều trị. Cần tránh các tác nhân gây dị ứng. Đã hướng dẫn sử dụng inhaler.',
    priority: 'Cao',
    status: 'Cần theo dõi',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    residentId: 3,
    residentName: 'Lê Văn C',
    recordType: 'Báo cáo xét nghiệm',
    date: '2024-01-17',
    doctor: 'Dr. Elizabeth Wilson',
    symptoms: 'Không có triệu chứng đặc biệt',
    diagnosis: 'Kết quả xét nghiệm máu bình thường',
    treatment: 'Duy trì chế độ ăn uống và vận động hiện tại',
    medications: [],
    followUp: '2024-04-17',
    notes: 'Tất cả các chỉ số trong giới hạn bình thường. Tiếp tục theo dõi định kỳ.',
    priority: 'Thấp',
    status: 'Hoàn thành',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 4,
    residentId: 4,
    residentName: 'Hoàng Văn D',
    recordType: 'Tư vấn chuyên khoa',
    date: '2024-01-18',
    doctor: 'Dr. Michael Chen',
    symptoms: 'Đau khớp, cứng khớp buổi sáng, khó di chuyển',
    diagnosis: 'Viêm khớp dạng thấp',
    treatment: 'Vật lý trị liệu, thuốc chống viêm, chế độ ăn chống viêm',
    medications: ['Methotrexate 15mg', 'Folic acid 5mg', 'Ibuprofen 400mg'],
    followUp: '2024-02-18',
    notes: 'Bệnh nhân cần điều trị dài hạn. Theo dõi tác dụng phụ của thuốc. Tham khảo chuyên gia dinh dưỡng.',
    priority: 'Cao',
    status: 'Đang xử lý',
    createdAt: '2024-01-18T11:45:00Z'
  }
];

export default function MedicalRecordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get recordId from params directly
  const recordId = params.id;
  
  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const id = parseInt(recordId);
        
        // Check localStorage for medical records data
        let records = medicalRecordsData;
        const savedRecords = localStorage.getItem('nurseryHomeMedicalRecords');
        if (savedRecords) {
          records = JSON.parse(savedRecords);
        }
        
        const foundRecord = records.find(r => r.id === id);
        
        if (foundRecord) {
          setRecord(foundRecord);
        } else {
          router.push('/medical');
        }
      } catch (error) {
        console.error('Error fetching medical record:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [recordId, router]);
  
  const handleEditClick = () => {
    router.push(`/medical/${recordId}/edit`);
  };
  
  // Helper function to render priority with appropriate color
  const renderPriority = (priority: string) => {
    const bgColor = 
      priority === 'Khẩn cấp' ? '#fecaca' : 
      priority === 'Cao' ? '#fed7aa' :
      priority === 'Trung bình' ? '#fef3c7' :
      priority === 'Thấp' ? '#dcfce7' : '#f3f4f6';
      
    const textColor = 
      priority === 'Khẩn cấp' ? '#dc2626' : 
      priority === 'Cao' ? '#ea580c' :
      priority === 'Trung bình' ? '#d97706' :
      priority === 'Thấp' ? '#166534' : '#374151';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.25rem 0.75rem', 
        fontSize: '0.75rem', 
        fontWeight: 500, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor
      }}>
        {priority}
      </span>
    );
  };
  
  // Helper function to render status with appropriate color
  const renderStatus = (status: string) => {
    const bgColor = 
      status === 'Đang xử lý' ? '#dbeafe' : 
      status === 'Hoàn thành' ? '#dcfce7' :
      status === 'Cần theo dõi' ? '#fef3c7' :
      status === 'Đã hủy' ? '#fecaca' : '#f3f4f6';
      
    const textColor = 
      status === 'Đang xử lý' ? '#1d4ed8' : 
      status === 'Hoàn thành' ? '#166534' :
      status === 'Cần theo dõi' ? '#d97706' :
      status === 'Đã hủy' ? '#dc2626' : '#374151';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.25rem 0.75rem', 
        fontSize: '0.75rem', 
        fontWeight: 500, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor
      }}>
        {status}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  if (!record) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy hồ sơ y tế.</p>
      </div>
    );
  }
  
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
              <Link href="/medical" style={{
                color: '#6b7280', 
                display: 'flex',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}>
                <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </Link>
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
                  Chi tiết hồ sơ y tế
                </h1>

              </div>
            </div>
            
            <button
              onClick={handleEditClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(22, 163, 74, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
              }}
            >
              <PencilIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Chỉnh sửa
            </button>
          </div>
        </div>
      
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}>
        {/* Header with basic info */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)',
          padding: '2rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h2 style={{
                fontSize: '1.875rem', 
                fontWeight: 700, 
                color: '#92400e', 
                margin: 0,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                {record.recordType}
              </h2>
              <p style={{
                fontSize: '1.125rem', 
                color: '#a16207', 
                marginTop: '0.5rem', 
                marginBottom: '0.75rem',
                fontWeight: 600
              }}>
                Bệnh nhân: {record.residentName}
              </p>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem'}}>
                {renderPriority(record.priority)}
                {renderStatus(record.status)}
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{
                fontSize: '0.875rem', 
                color: '#92400e', 
                margin: 0,
                fontWeight: 600
              }}>
                Ngày khám: {new Date(record.date).toLocaleDateString('vi-VN')}
              </p>
              <p style={{
                fontSize: '0.875rem', 
                color: '#92400e', 
                margin: '0.25rem 0 0 0',
                fontWeight: 600
              }}>
                ID: #{record.id.toString().padStart(4, '0')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{padding: '2rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem'}}>
            
            {/* Basic Information */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)'
            }}>
              <h3 style={{
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: '#111827', 
                marginTop: 0, 
                marginBottom: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                <UserIcon style={{width: '1.5rem', height: '1.5rem', color: '#3b82f6'}} />
                Thông tin cơ bản
              </h3>
              
              <div style={{display: 'grid', gap: '0.75rem'}}>
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Bác sĩ phụ trách:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{record.doctor}</p>
                </div>
                
                <div>
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Ngày tạo:</span>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                    <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                    {new Date(record.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                
                {record.followUp && (
                  <div>
                    <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563'}}>Tái khám:</span>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <CalendarIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {new Date(record.followUp).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Medical Details */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)'
            }}>
              <h3 style={{
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: '#111827', 
                marginTop: 0, 
                marginBottom: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                <HeartIcon style={{width: '1.5rem', height: '1.5rem', color: '#ef4444'}} />
                Chi tiết y tế
              </h3>
              
              <div style={{display: 'grid', gap: '1rem'}}>
                {record.symptoms && (
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                      Triệu chứng
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, lineHeight: 1.6}}>{record.symptoms}</p>
                  </div>
                )}
                
                {record.diagnosis && (
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                      Chẩn đoán
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, lineHeight: 1.6}}>{record.diagnosis}</p>
                  </div>
                )}
                
                {record.treatment && (
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                      Phương pháp điều trị
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0, lineHeight: 1.6}}>{record.treatment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Medications */}
          {record.medications && record.medications.length > 0 && (
            <div style={{
              marginTop: '2rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)'
            }}>
              <h3 style={{
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: '#111827', 
                marginTop: 0, 
                marginBottom: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                <BeakerIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                Thuốc men đã kê đơn
              </h3>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem'}}>
                {record.medications.map((medication: string, index: number) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#0c4a6e',
                    border: '1px solid #bae6fd'
                  }}>
                    {medication}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes Section */}
          {record.notes && (
            <div style={{
              marginTop: '2rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)'
            }}>
              <h3 style={{
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: '#111827', 
                marginTop: 0, 
                marginBottom: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                <DocumentTextIcon style={{width: '1.5rem', height: '1.5rem', color: '#f59e0b'}} />
                Ghi chú của bác sĩ
              </h3>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fefce8',
                borderRadius: '0.375rem',
                border: '1px solid #fde047'
              }}>
                <p style={{fontSize: '0.875rem', color: '#713f12', margin: 0, lineHeight: 1.6}}>{record.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
} 