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
    position: 'Y tá', 
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
    department: 'Chăm sóc người cao tuổi', 
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
    notes: 'Tốt nghiệp xuất sắc ngành điều dưỡng. Khả năng giao tiếp tốt với người cao tuổi.'
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
    department: 'Chăm sóc người cao tuổi', 
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
    notes: 'Có kinh nghiệm chăm sóc ban đêm. Đặc biệt giỏi trong việc giúp người cao tuổi có giấc ngủ ngon.'
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
    notes: 'Rất sáng tạo trong việc phát triển các hoạt động giải trí cho người cao tuổi. Đặc biệt giỏi về âm nhạc và nghệ thuật.'
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
    <div style={{maxWidth: '1100px', margin: '0 auto', marginTop: 32, marginBottom: 32}}>
      {/* Header lớn với avatar và action */}
      <div style={{
        background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ef 100%)',
        borderRadius: '1.5rem',
        padding: '2rem 2rem 1.5rem 2rem',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        boxShadow: '0 2px 12px 0 rgba(100,116,139,0.06)'
      }}>
        <Link href="/staff" style={{color: '#64748b', display: 'flex', alignItems: 'center', marginRight: 18}}>
          <ArrowLeftIcon style={{width: 24, height: 24}} />
        </Link>
        {/* Avatar */}
        <div style={{
          width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc 0%, #f0abfc 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.10)'
        }}>
          {staff.name?.[0] || '?'}
        </div>
        <div style={{flex: 1}}>
          <h1 style={{fontSize: '2.1rem', fontWeight: 800, color: '#334155', margin: 0, letterSpacing: '-0.01em'}}>{staff.name}</h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
  Chức vụ: {staff.position} 
</p>

<p style={{ fontSize: '1.05rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
  Khoa :{staff.department}
</p>

        </div>
        <div style={{display: 'flex', gap: 14}}>
          
          <button
            onClick={handleEditClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.2rem', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', borderRadius: '0.75rem', border: 'none', fontSize: '0.97rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <PencilIcon style={{ width: '1rem', height: '1rem' }} />Chỉnh sửa
          </button>
        </div>
      </div>
      {/* Card section */}
      <div style={{background: '#fff', borderRadius: '1.25rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(100,116,139,0.04)', overflow: 'hidden'}}>
        {/* Header với thông tin cơ bản */}
        <div style={{background: '#f1f5f9', padding: '2rem 2rem 1.5rem 2rem', borderBottom: '1px solid #ffffff'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24}}>
            <div>
              <h2 style={{fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0}}>Thông tin nhân viên</h2>
             
            </div>
            <div>
              <p style={{fontSize: '0.97rem', color: '#64748b', margin: 0}}>
                <span style={{fontWeight: 600}}>Ngày vào làm:</span>{' '}
                {new Date(staff.hireDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        {/* Main content */}
        <div style={{padding: '2.5rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem'}}>
            {/* Thông tin cá nhân */}
            <div style={{borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem'}}>
              <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
                Thông tin cá nhân
              </h3>
              <div style={{display: 'grid', gap: '1.1rem'}}>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Ngày sinh:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}><strong>Ngày sinh:</strong> {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Giới tính:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}><strong>Giới tính:</strong> {staff.gender === 'male' ? 'Nam' : staff.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Địa chỉ:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}><strong>Địa chỉ:</strong> {staff.address || 'N/A'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Chứng chỉ:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.certification || 'Không có'}</span>
                </div>
              </div>
            </div>
            {/* Thông tin liên hệ */}
            <div style={{borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem'}}>
              <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
                Thông tin liên hệ
              </h3>
              <div style={{display: 'grid', gap: '1.1rem'}}>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Email:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.email || 'N/A'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Số điện thoại:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.contactPhone}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>Liên hệ khẩn cấp:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.emergencyContact || 'N/A'}</span>
                </div>
                <div>
                  <span style={{fontWeight: 600, color: '#475569'}}>SĐT khẩn cấp:</span>
                  <span style={{marginLeft: 8, color: '#64748b'}}>{staff.emergencyPhone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Notes Section */}
          <div style={{marginTop: '2.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', padding: '2rem'}}>
            <h3 style={{fontSize: '1.12rem', fontWeight: 700, color: '#334155', marginTop: 0, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 8}}>
              Ghi chú
            </h3>
            <p style={{fontSize: '1.05rem', color: '#64748b', margin: 0}}>{staff.notes || 'Không có ghi chú.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 