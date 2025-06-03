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

export default function MedicalRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const recordId = resolvedParams.id;
  
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
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href="/medical" style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chi tiết hồ sơ y tế</h1>
        </div>
        
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#16a34a',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <PencilIcon style={{width: '1rem', height: '1rem'}} />
          Chỉnh sửa
        </button>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
        {/* Header with basic info */}
        <div style={{backgroundColor: '#f9fafb', padding: '1.5rem', borderBottom: '1px solid #e5e7eb'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0}}>{record.recordType}</h2>
              <p style={{fontSize: '1rem', color: '#6b7280', marginTop: '0.25rem', marginBottom: '0.5rem'}}>
                Cư dân: {record.residentName}
              </p>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem'}}>
                {renderPriority(record.priority)}
                {renderStatus(record.status)}
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                Ngày khám: {new Date(record.date).toLocaleDateString('vi-VN')}
              </p>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                ID: #{record.id.toString().padStart(4, '0')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{padding: '1.5rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem'}}>
            
            {/* Basic Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <UserIcon style={{width: '1.25rem', height: '1.25rem'}} />
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
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <HeartIcon style={{width: '1.25rem', height: '1.25rem'}} />
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
            <div style={{marginTop: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <BeakerIcon style={{width: '1.25rem', height: '1.25rem'}} />
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
            <div style={{marginTop: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <DocumentTextIcon style={{width: '1.25rem', height: '1.25rem'}} />
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
  );
} 