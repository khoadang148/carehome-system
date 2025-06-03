"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, CalendarIcon } from '@heroicons/react/24/outline';

// Mock staff data (same as in the staff page)
const initialStaffMembers = [
  { 
    id: 1, 
    name: 'John Smith', 
    firstName: 'John',
    lastName: 'Smith',
    position: 'Y tá đã đăng ký', 
    department: 'Y tế', 
    shiftType: 'Sáng', 
    hireDate: '2022-03-15',
    dateOfBirth: '1985-06-12',
    gender: 'male',
    email: 'john.smith@example.com',
    certification: 'RN, BSN',
    contactPhone: '555-123-4567',
    address: '123 Maple Street, Anytown',
    emergencyContact: 'Mary Smith',
    emergencyPhone: '555-987-6543',
    notes: 'Chuyên môn về chăm sóc người cao tuổi. Kinh nghiệm 10 năm trong lĩnh vực y tế.'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    firstName: 'Sarah',
    lastName: 'Johnson',
    position: 'Người chăm sóc', 
    department: 'Chăm sóc cư dân', 
    shiftType: 'Chiều', 
    hireDate: '2022-05-20',
    dateOfBirth: '1990-04-23',
    gender: 'female',
    email: 'sarah.j@example.com',
    certification: 'CNA',
    contactPhone: '555-234-5678',
    address: '456 Oak Avenue, Hometown',
    emergencyContact: 'Robert Johnson',
    emergencyPhone: '555-876-5432',
    notes: 'Tốt nghiệp xuất sắc ngành điều dưỡng. Khả năng giao tiếp tốt với cư dân.'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    firstName: 'Michael',
    lastName: 'Brown',
    position: 'Chuyên viên vật lý trị liệu', 
    department: 'Phục hồi chức năng', 
    shiftType: 'Ngày', 
    hireDate: '2021-11-10',
    dateOfBirth: '1988-10-05',
    gender: 'male',
    email: 'mb@example.com',
    certification: 'DPT',
    contactPhone: '555-345-6789',
    address: '789 Pine Road, Cityville',
    emergencyContact: 'Jessica Brown',
    emergencyPhone: '555-765-4321',
    notes: 'Chuyên về phục hồi chức năng cho bệnh nhân sau đột quỵ. Tham gia nhiều khóa đào tạo đặc biệt.'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    firstName: 'Emily',
    lastName: 'Davis',
    position: 'Trợ lý y tá', 
    department: 'Chăm sóc cư dân', 
    shiftType: 'Đêm', 
    hireDate: '2023-01-05',
    dateOfBirth: '1992-12-18',
    gender: 'female',
    email: 'emily.d@example.com',
    certification: 'CNA',
    contactPhone: '555-456-7890',
    address: '321 Cedar Lane, Townsville',
    emergencyContact: 'Mark Davis',
    emergencyPhone: '555-654-3210',
    notes: 'Có kinh nghiệm chăm sóc ban đêm. Đặc biệt giỏi trong việc giúp cư dân có giấc ngủ ngon.'
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    firstName: 'David',
    lastName: 'Wilson',
    position: 'Điều phối viên hoạt động', 
    department: 'Hoạt động', 
    shiftType: 'Ngày', 
    hireDate: '2022-08-22',
    dateOfBirth: '1987-03-30',
    gender: 'male',
    email: 'dwilson@example.com',
    certification: 'Liệu pháp giải trí',
    contactPhone: '555-567-8901',
    address: '654 Birch Street, Villagetown',
    emergencyContact: 'Linda Wilson',
    emergencyPhone: '555-543-2109',
    notes: 'Rất sáng tạo trong việc phát triển các hoạt động giải trí cho cư dân. Đặc biệt giỏi về âm nhạc và nghệ thuật.'
  },
];

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    // Resolve params Promise
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);
  
  useEffect(() => {
    if (!resolvedParams) return;
    
    // Simulate API call to fetch staff data
    const fetchStaff = async () => {
      try {
        // In a real application, you would fetch from an API endpoint
        const staffId = parseInt(resolvedParams.id);
        
        // Find the staff member from the mock data
        const foundStaff = initialStaffMembers.find(s => s.id === staffId);
        
        if (foundStaff) {
          setStaff(foundStaff);
        } else {
          // Staff not found, could redirect to 404 page
          console.error('Staff not found');
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaff();
  }, [resolvedParams, router]);
  
  const handleEditClick = () => {
    if (!resolvedParams) return;
    router.push(`/staff/${resolvedParams.id}/edit`);
  };
  
  const handleScheduleClick = () => {
    if (!resolvedParams) return;
    router.push(`/staff/${resolvedParams.id}/schedule`);
  };
  
  // Show loading state while fetching data
  if (loading || !resolvedParams) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  // If staff is not found
  if (!staff) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin nhân viên.</p>
      </div>
    );
  }
  
  // Helper function to render shift type with appropriate color
  const renderShiftType = (shift: string) => {
    const bgColor = 
      shift === 'Sáng' ? '#dbeafe' : 
      shift === 'Chiều' ? '#f3e8ff' :
      shift === 'Đêm' ? '#e0e7ff' : '#dcfce7';
      
    const textColor = 
      shift === 'Sáng' ? '#1e40af' : 
      shift === 'Chiều' ? '#7e22ce' :
      shift === 'Đêm' ? '#4338ca' : '#166534';
      
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
        {shift}
      </span>
    );
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href="/staff" style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chi tiết nhân viên</h1>
        </div>
        
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={handleScheduleClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#7e22ce',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <CalendarIcon style={{width: '1rem', height: '1rem'}} />
            Lịch làm việc
          </button>
          
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
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
        {/* Header with basic info */}
        <div style={{backgroundColor: '#f9fafb', padding: '1.5rem', borderBottom: '1px solid #e5e7eb'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0}}>{staff.name}</h2>
              <p style={{fontSize: '1rem', color: '#6b7280', marginTop: '0.25rem', marginBottom: '0.5rem'}}>
                {staff.position} | {staff.department}
              </p>
              <div style={{marginTop: '0.5rem'}}>
                <span style={{fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem'}}>Ca làm việc:</span>
                {renderShiftType(staff.shiftType)}
              </div>
            </div>
            
            <div>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                <span style={{fontWeight: 500}}>Ngày vào làm:</span>{' '}
                {new Date(staff.hireDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{padding: '1.5rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
            {/* Personal Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                Thông tin cá nhân
              </h3>
              
              <div style={{display: 'grid', gap: '1rem'}}>
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Ngày sinh
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                    {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Giới tính
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                    {staff.gender === 'male' ? 'Nam' : staff.gender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Địa chỉ
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.address || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Chứng chỉ
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.certification || 'Không có'}</p>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                Thông tin liên hệ
              </h3>
              
              <div style={{display: 'grid', gap: '1rem'}}>
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Email
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.email || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Số điện thoại
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.contactPhone}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Liên hệ khẩn cấp
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.emergencyContact || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    SĐT khẩn cấp
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.emergencyPhone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div style={{marginTop: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
            <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
              Ghi chú
            </h3>
            <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{staff.notes || 'Không có ghi chú.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 