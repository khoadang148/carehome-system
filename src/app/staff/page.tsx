"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  EyeIcon, 
  CalendarIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';

// Mock staff data
const initialStaffMembers = [
  { 
    id: 1, 
    name: 'John Smith', 
    position: 'Y tá', 
    department: 'Y tế', 
    shiftType: 'Sáng', 
    hireDate: '2022-03-15',
    certification: 'RN, BSN',
    contactPhone: '555-123-4567'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    position: 'Người chăm sóc', 
    department: 'Chăm sóc cư dân', 
    shiftType: 'Chiều', 
    hireDate: '2022-05-20',
    certification: 'CNA',
    contactPhone: '555-234-5678'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    position: 'Chuyên viên vật lý trị liệu', 
    department: 'Phục hồi chức năng', 
    shiftType: 'Ngày', 
    hireDate: '2021-11-10',
    certification: 'DPT',
    contactPhone: '555-345-6789'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    position: 'Trợ lý y tá', 
    department: 'Chăm sóc cư dân', 
    shiftType: 'Đêm', 
    hireDate: '2023-01-05',
    certification: 'CNA',
    contactPhone: '555-456-7890'
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    position: 'Điều phối viên hoạt động', 
    department: 'Hoạt động', 
    shiftType: 'Ngày', 
    hireDate: '2022-08-22',
    certification: 'Liệu pháp giải trí',
    contactPhone: '555-567-8901'
  },
];

const departments = ['Tất cả', 'Y tế', 'Chăm sóc cư dân', 'Phục hồi chức năng', 'Hoạt động', 'Quản lý'];
const shifts = ['Tất cả', 'Sáng', 'Chiều', 'Đêm', 'Ngày'];

export default function StaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check access permissions - Only admin can access staff management
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('Tất cả');
  const [filterShift, setFilterShift] = useState('Tất cả');
  const [staffData, setStaffData] = useState(initialStaffMembers);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  
  const loadPendingPackages = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const pending = residents
          .filter((r: any) => r.carePackage && r.carePackage.status === 'pending_approval')
          .map((r: any) => ({
            ...r.carePackage,
            residentName: r.name,
            residentId: r.id,
            residentAge: r.age,
            residentRoom: r.room
          }));
        setPendingPackages(pending);
      }
    } catch (error) {
      console.error('Error loading pending packages:', error);
    }
  };



  // Load staff data from localStorage when component mounts
  useEffect(() => {
    const savedStaff = localStorage.getItem('nurseryHomeStaff');
    if (savedStaff) {
      setStaffData(JSON.parse(savedStaff));
    }
    
    // Load pending service packages
    loadPendingPackages();
  }, []);
  
  // Filter staff based on search term and filters
  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          staff.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'Tất cả' || staff.department === filterDepartment;
    const matchesShift = filterShift === 'Tất cả' || staff.shiftType === filterShift;
    
    return matchesSearch && matchesDepartment && matchesShift;
  });
  
  // Handle delete staff member
  const handleDeleteClick = (id: number) => {
    setStaffToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (staffToDelete !== null) {
      const updatedStaff = staffData.filter(staff => staff.id !== staffToDelete);
      setStaffData(updatedStaff);
      
      // Save to localStorage after deleting
      localStorage.setItem('nurseryHomeStaff', JSON.stringify(updatedStaff));
      
      setShowDeleteModal(false);
      setStaffToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };
  
  // Handle view staff details
  const handleViewStaff = (staffId: number) => {
    router.push(`/staff/${staffId}`);
  };
  
  // Handle edit staff
  const handleEditStaff = (staffId: number) => {
    router.push(`/staff/${staffId}/edit`);
  };
  
  // Handle create new staff
  const handleCreateStaff = () => {
    router.push('/staff/new');
  };



  // Handle approve/reject service packages
  const handleApprovePackage = (registrationId: string) => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = residents.map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === registrationId) {
            return {
              ...r,
              carePackage: {
                ...r.carePackage,
                status: 'active',
                approvedDate: new Date().toISOString(),
                approvedBy: 'Nhân viên quản lý'
              }
            };
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
        alert('✅ Đã duyệt gói dịch vụ thành công!');
      }
    } catch (error) {
      console.error('Error approving package:', error);
      alert('❌ Có lỗi xảy ra khi duyệt gói dịch vụ!');
    }
  };

  const handleRejectPackage = (registrationId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = residents.map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === registrationId) {
            return {
              ...r,
              carePackage: {
                ...r.carePackage,
                status: 'rejected',
                rejectedDate: new Date().toISOString(),
                rejectedBy: 'Nhân viên quản lý',
                rejectionReason: reason
              }
            };
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
        alert('❌ Đã từ chối gói dịch vụ!');
      }
    } catch (error) {
      console.error('Error rejecting package:', error);
      alert('❌ Có lỗi xảy ra khi từ chối gói dịch vụ!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  // Thêm effect để ẩn header khi modal duyệt gói dịch vụ mở
  useEffect(() => {
    if (showApprovalModal) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showApprovalModal]);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>

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
        
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <UsersIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý Đội ngũ chăm sóc
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {staffData.length} thành viên
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <button
                onClick={() => setShowApprovalModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: pendingPackages.length > 0 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: pendingPackages.length > 0 
                    ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
                    : '0 4px 12px rgba(107, 114, 128, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = pendingPackages.length > 0 
                    ? '0 8px 20px rgba(245, 158, 11, 0.4)' 
                    : '0 8px 20px rgba(107, 114, 128, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = pendingPackages.length > 0 
                    ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
                    : '0 4px 12px rgba(107, 114, 128, 0.3)';
                }}
              >
                <svg style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Duyệt gói dịch vụ
                {pendingPackages.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '1.5rem',
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '2px solid white'
                  }}>
                    {pendingPackages.length}
                  </span>
                )}
              </button>
          
                      <div style={{display: 'flex', gap: '1rem'}}>
              

              <Link 
                href="/staff/add" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <PlusCircleIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Thêm nhân viên
              </Link>
            </div>
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
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            {/* Tìm kiếm */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
                fontSize: '1rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc chức vụ..."
                  style={{
                    width: '100%',
                    paddingLeft: 40,
                    paddingRight: 12,
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Khoa */}
            <div style={{ minWidth: 180 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
                fontSize: '1rem'
              }}>
                Khoa
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: '1rem',
                  background: 'white',
                  fontWeight: 500
                }}
                value={filterDepartment}
                onChange={e => setFilterDepartment(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Table Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                }}>
                  <th style={{
                    padding: '1rem 1.5rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Tên
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Chức vụ
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Khoa
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Số điện thoại
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Thao tác
                  </th>
              </tr>
            </thead>
              <tbody>
                {filteredStaff.map((staff, index) => (
                  <tr 
                    key={staff.id} 
                    style={{
                      borderBottom: index !== filteredStaff.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#111827'
                    }}>
                      {staff.name}
                    </td>
                    <td style={{
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {staff.position}
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.375rem 0.875rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '9999px',
                        background: 
                          staff.department === 'Y tế' ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 
                          staff.department === 'Chăm sóc cư dân' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 
                          staff.department === 'Phục hồi chức năng' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' :
                          staff.department === 'Hoạt động' ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
                          'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                        color: 
                          staff.department === 'Y tế' ? '#dc2626' : 
                          staff.department === 'Chăm sóc cư dân' ? '#166534' : 
                          staff.department === 'Phục hồi chức năng' ? '#1d4ed8' :
                          staff.department === 'Hoạt động' ? '#d97706' :
                          '#7c3aed',
                        border: '1px solid',
                        borderColor:
                          staff.department === 'Y tế' ? '#fca5a5' : 
                          staff.department === 'Chăm sóc cư dân' ? '#86efac' : 
                          staff.department === 'Phục hồi chức năng' ? '#93c5fd' :
                          staff.department === 'Hoạt động' ? '#fbbf24' :
                          '#c4b5fd'
                      }}>
                        {staff.department}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {staff.contactPhone}
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        {/* Nút xem */}
                        <div style={{position: 'relative', display: 'inline-block'}}>
                          <button 
                            onClick={() => handleViewStaff(staff.id)}
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
                            onFocus={e => e.currentTarget.parentElement.querySelector('.tooltip-view').style.opacity = 1}
                            onBlur={e => e.currentTarget.parentElement.querySelector('.tooltip-view').style.opacity = 0}
                            onMouseEnter={e => e.currentTarget.parentElement.querySelector('.tooltip-view').style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.parentElement.querySelector('.tooltip-view').style.opacity = 0}
                          >
                            <EyeIcon style={{width: '1rem', height: '1rem'}} />
                          </button>
                          <span className="tooltip-view" style={{
                            position: 'absolute',
                            left: '50%',
                            top: '-2.2rem',
                            transform: 'translateX(-50%)',
                            background: '#3b82f6',
                            color: 'white',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            opacity: 0,
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s',
                            zIndex: 10
                          }}>Xem chi tiết</span>
                        </div>
                        {/* Nút sửa */}
                        <div style={{position: 'relative', display: 'inline-block'}}>
                          <button
                            onClick={() => handleEditStaff(staff.id)}
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
                            onFocus={e => e.currentTarget.parentElement.querySelector('.tooltip-edit').style.opacity = 1}
                            onBlur={e => e.currentTarget.parentElement.querySelector('.tooltip-edit').style.opacity = 0}
                            onMouseEnter={e => e.currentTarget.parentElement.querySelector('.tooltip-edit').style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.parentElement.querySelector('.tooltip-edit').style.opacity = 0}
                          >
                            <PencilIcon style={{width: '1rem', height: '1rem'}} />
                          </button>
                          <span className="tooltip-edit" style={{
                            position: 'absolute',
                            left: '50%',
                            top: '-2.2rem',
                            transform: 'translateX(-50%)',
                            background: '#10b981',
                            color: 'white',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            opacity: 0,
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s',
                            zIndex: 10
                          }}>Chỉnh sửa</span>
                        </div>
                        {/* Nút xóa */}
                        <div style={{position: 'relative', display: 'inline-block'}}>
                          <button 
                            onClick={() => handleDeleteClick(staff.id)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.5rem',
                              border: 'none',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                            }}
                            onFocus={e => e.currentTarget.parentElement.querySelector('.tooltip-delete').style.opacity = 1}
                            onBlur={e => e.currentTarget.parentElement.querySelector('.tooltip-delete').style.opacity = 0}
                            onMouseEnter={e => e.currentTarget.parentElement.querySelector('.tooltip-delete').style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.parentElement.querySelector('.tooltip-delete').style.opacity = 0}
                          >
                            <TrashIcon style={{width: '1rem', height: '1rem'}} />
                          </button>
                          <span className="tooltip-delete" style={{
                            position: 'absolute',
                            left: '50%',
                            top: '-2.2rem',
                            transform: 'translateX(-50%)',
                            background: '#ef4444',
                            color: 'white',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            opacity: 0,
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s',
                            zIndex: 10
                          }}>Xóa</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td 
                      colSpan={6} 
                      style={{
                        padding: '3rem', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        fontSize: '1rem',
                        fontWeight: 500
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <UsersIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                        Không tìm thấy nhân viên nào
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
          </div>
      </div>
      
        {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
          <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '2rem',
            maxWidth: '28rem',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
                fontSize: '1.25rem',
              fontWeight: 600,
                marginBottom: '1rem',
                color: '#111827'
            }}>
                Xác nhận xóa nhân viên
            </h3>
            <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  Hủy
              </button>
              <button
                onClick={confirmDelete}
                style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    cursor: 'pointer',
                  fontWeight: 500,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Package Approval Modal */}
      {showApprovalModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{padding: 0, position: 'relative'}}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              padding: '2rem 2.5rem 1.25rem 2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #fde68a',
            }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  🔍 Duyệt gói dịch vụ chờ phê duyệt
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#b45309', margin: 0, fontWeight: 500 }}>
                  Có {pendingPackages.length} gói dịch vụ đang chờ duyệt
                </p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="hover:bg-yellow-100 transition-colors duration-150"
                style={{
                  border: 'none',
                  background: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#92400e',
                  fontSize: '1.5rem',
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  zIndex: 2
                }}
                aria-label="Đóng"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Content */}
            <div style={{ padding: '2rem 2.5rem' }}>
              {pendingPackages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                  <svg style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#374151' }}>
                    Không có gói dịch vụ nào chờ duyệt
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    Tất cả các gói dịch vụ đã được xử lý
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {pendingPackages.map((pkg, index) => (
                    <div key={pkg.registrationId} className="card" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '2rem 1.5rem' }}>
                      {/* Tiêu đề gói dịch vụ */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem'
                      }}>
                        <div>
                          <h2 style={{
                            fontSize: '1.35rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-0.01em'
                          }}>
                            {pkg.name}
                          </h2>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            color: '#334155',
                            marginTop: 8
                          }}>
                            <div><strong>Người thụ hưởng:</strong> {pkg.residentName}</div>
                            <div><strong>Tuổi:</strong> {pkg.residentAge} tuổi</div>
                            <div><strong>Phòng:</strong> {pkg.residentRoom}</div>
                            <div><strong>Mã đăng ký:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{pkg.registrationId}</span></div>
                          </div>
                        </div>
                        <div style={{
                          background: '#fef3c7',
                          border: '1px solid #fbbf24',
                          borderRadius: '1rem',
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#92400e',
                          marginLeft: 16,
                          minWidth: 120,
                          textAlign: 'center'
                        }}>
                          CHỜ DUYỆT
                        </div>
                      </div>
                      {/* Thông tin thanh toán & thời gian */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.06)'
                        }}>
                          <div style={{ fontWeight: 600, color: '#059669', marginBottom: 8 }}>Thông tin thanh toán</div>
                          <div style={{ color: '#334155', fontSize: '1rem', lineHeight: 1.6 }}>
                            <div>Giá gốc: <span style={{ fontWeight: 500 }}>{formatCurrency(pkg.price)}</span></div>
                            {pkg.discount > 0 && (
                              <div style={{ color: '#059669' }}>Giảm giá: -{formatCurrency(pkg.discountAmount)} ({pkg.discount}%)</div>
                            )}
                            <div style={{ fontWeight: 700, color: '#059669', fontSize: '1.1rem' }}>
                              Thành tiền: {formatCurrency(pkg.finalPrice)}/tháng
                            </div>
                          </div>
                        </div>
                        <div style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.06)'
                        }}>
                          <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 8 }}>Thông tin thời gian</div>
                          <div style={{ color: '#334155', fontSize: '1rem', lineHeight: 1.6 }}>
                            <div>Ngày đăng ký: <strong>{new Date(pkg.purchaseDate).toLocaleDateString('vi-VN')}</strong></div>
                            {pkg.startDate && (
                              <div>Ngày bắt đầu: <strong>{new Date(pkg.startDate).toLocaleDateString('vi-VN')}</strong></div>
                            )}
                            <div>Phương thức: <strong>{pkg.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</strong></div>
                          </div>
                        </div>
                      </div>
                      {/* Ghi chú y tế */}
                      {pkg.medicalNotes && (
                        <div style={{
                          background: '#fefce8',
                          border: '1px solid #fde047',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          marginTop: '1rem',
                          color: '#a16207',
                          fontSize: '1rem'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Ghi chú y tế</div>
                          <div style={{ color: '#374151', fontWeight: 400 }}>{pkg.medicalNotes}</div>
                        </div>
                      )}
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
                        <button
                          onClick={() => handleRejectPackage(pkg.registrationId)}
                          className="btn-outline-gradient"
                          style={{ minWidth: 120, display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <XMarkIcon style={{ width: '1.1em', height: '1.1em', marginRight: 6, color: '#ef4444' }} />
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApprovePackage(pkg.registrationId)}
                          className="btn-gradient"
                          style={{ minWidth: 120, display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <CheckCircleIcon style={{ width: '1.1em', height: '1.1em', marginRight: 6, color: 'white' }} />
                          Duyệt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '1.25rem 2.5rem', background: '#f9fafb', borderRadius: '0 0 1rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  loadPendingPackages(); // Refresh data when closing
                }}
                className="btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      
      </div>
    </div>
  );
} 
