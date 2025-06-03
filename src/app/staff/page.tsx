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
  UsersIcon
} from '@heroicons/react/24/outline';

// Mock staff data
const initialStaffMembers = [
  { 
    id: 1, 
    name: 'John Smith', 
    position: 'Y tá đã đăng ký', 
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('Tất cả');
  const [filterShift, setFilterShift] = useState('Tất cả');
  const [staffData, setStaffData] = useState(initialStaffMembers);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  
  // Load staff data from localStorage when component mounts
  useEffect(() => {
    const savedStaff = localStorage.getItem('nurseryHomeStaff');
    if (savedStaff) {
      setStaffData(JSON.parse(savedStaff));
    }
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
                  Quản lý nhân viên
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {staffData.length} nhân viên
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <Link 
            href="/staff/schedule" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
              textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                <CalendarIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
            Lịch làm việc
          </Link>
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
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '1.5rem'
          }}>
            <div style={{flex: '1', minWidth: '20rem'}}>
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
                placeholder="Tìm kiếm nhân viên..."
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
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                />
              </div>
            </div>
          
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '0.5rem'
              }}>
                <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#10b981'}} />
                <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#10b981'}}>
                  Lọc
                </span>
              </div>
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
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  background: 'white',
                  fontWeight: 500,
                  minWidth: '8rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                  }}
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {shifts.map(shift => (
                  <option key={shift} value={shift}>{shift}</option>
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
                    Ca làm việc
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
                    Liên hệ
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
                    <td style={{padding: '1.25rem 1.5rem'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '0.375rem',
                        background: 
                          staff.shiftType === 'Sáng' ? 'rgba(245, 158, 11, 0.1)' : 
                          staff.shiftType === 'Chiều' ? 'rgba(59, 130, 246, 0.1)' : 
                          staff.shiftType === 'Đêm' ? 'rgba(139, 92, 246, 0.1)' :
                          'rgba(16, 185, 129, 0.1)',
                      color: 
                          staff.shiftType === 'Sáng' ? '#d97706' : 
                          staff.shiftType === 'Chiều' ? '#2563eb' : 
                          staff.shiftType === 'Đêm' ? '#7c3aed' :
                          '#059669',
                        border: '1px solid',
                        borderColor:
                          staff.shiftType === 'Sáng' ? '#fbbf24' : 
                          staff.shiftType === 'Chiều' ? '#93c5fd' : 
                          staff.shiftType === 'Đêm' ? '#c4b5fd' :
                          '#86efac'
                    }}>
                      {staff.shiftType}
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
                      >
                        <EyeIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
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
                      >
                        <PencilIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
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
                      >
                        <TrashIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
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
      </div>
    </div>
  );
} 