"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  PlusCircleIcon,
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  UsersIcon,
  EyeIcon,
  UserPlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useEffect } from 'react';

// Mock user data
const users = [
  { 
    id: 1, 
    name: 'Admin Nguyễn', 
    email: 'admin@carehome.com',
    role: 'Quản trị viên',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa', 'Xóa'],
    department: 'Quản lý',
    lastActive: '2023-05-10',
    status: 'Hoạt động',
    avatar: null
  },
  { 
    id: 2, 
    name: 'Y tá Trần', 
    email: 'nurse@carehome.com',
    role: 'Y tá',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
    department: 'Y tế',
    lastActive: '2023-05-09',
    status: 'Hoạt động',
    avatar: null
  },
  { 
    id: 3, 
    name: 'Bác sĩ Lê', 
    email: 'doctor@carehome.com',
    role: 'Bác sĩ',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
    department: 'Y tế',
    lastActive: '2023-05-08',
    status: 'Hoạt động',
    avatar: null
  },
  { 
    id: 4, 
    name: 'Nhân viên Trịnh', 
    email: 'staff@carehome.com',
    role: 'Nhân viên',
    permissions: ['Đọc', 'Ghi'],
    department: 'Chăm sóc',
    lastActive: '2023-05-07',
    status: 'Hoạt động',
    avatar: null
  },
  { 
    id: 5, 
    name: 'Kế toán Phạm', 
    email: 'finance@carehome.com',
    role: 'Kế toán',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
    department: 'Tài chính',
    lastActive: '2023-05-06',
    status: 'Hoạt động',
    avatar: null
  },
];

const roles = ['Tất cả', 'Quản trị viên', 'Bác sĩ', 'Y tá', 'Nhân viên', 'Kế toán'];
const departments = ['Tất cả', 'Quản lý', 'Y tế', 'Chăm sóc', 'Tài chính'];

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Quản trị viên':
      return {
        bg: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
        color: '#1e40af',
        border: '#93c5fd'
      };
    case 'Bác sĩ':
      return {
        bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        color: '#166534',
        border: '#86efac'
      };
    case 'Y tá':
      return {
        bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        color: '#15803d',
        border: '#a3e635'
      };
    case 'Kế toán':
      return {
        bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        color: '#92400e',
        border: '#fbbf24'
      };
    default:
      return {
        bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        color: '#4338ca',
        border: '#c7d2fe'
      };
  }
};

const getPermissionIcon = (permission: string) => {
  switch (permission) {
    case 'Đọc':
      return <EyeIcon style={{width: '0.75rem', height: '0.75rem', marginRight: '0.25rem'}} />;
    case 'Ghi':
      return <PencilIcon style={{width: '0.75rem', height: '0.75rem', marginRight: '0.25rem'}} />;
    case 'Chỉnh sửa':
      return <PencilIcon style={{width: '0.75rem', height: '0.75rem', marginRight: '0.25rem'}} />;
    case 'Xóa':
      return <TrashIcon style={{width: '0.75rem', height: '0.75rem', marginRight: '0.25rem'}} />;
    default:
      return <CheckCircleIcon style={{width: '0.75rem', height: '0.75rem', marginRight: '0.25rem'}} />;
  }
};

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Tất cả');
  const [filterDepartment, setFilterDepartment] = useState('Tất cả');
  
  const router = useRouter();
  const { user } = useAuth();
  
  // Check access permissions - Only admin can access permissions management
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
  
  // Filter users based on search term, role and department
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'Tất cả' || user.role === filterRole;
    const matchesDepartment = filterDepartment === 'Tất cả' || user.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleAddUser = () => {
    // Navigate to add user page
    router.push('/permissions/new');
  };

  const handleEditUser = (userId: number) => {
    // Navigate to edit user page
    router.push(`/permissions/${userId}/edit`);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      // In a real application, this would make an API call to delete the user
      alert(`Người dùng ID ${userId} đã được xóa thành công!`);
      // Optionally refresh the page or update the state to remove the user from the list
    }
  };

  const handleManagePermissions = (userId: number) => {
    // Navigate to permissions management page
    router.push(`/permissions/${userId}/manage`);
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
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <UsersIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý phân quyền
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Quản lý người dùng và phân quyền hệ thống
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <button
                onClick={handleAddUser}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <UserPlusIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Thêm người dùng mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem'
        }}>
          {/* Total Users */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h3 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#166534', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Tổng người dùng
            </h3>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#16a34a',
                lineHeight: 1
              }}>
                {users.length}
              </div>
              <UsersIcon style={{width: '3rem', height: '3rem', color: '#22c55e'}} />
            </div>
          </div>

          {/* Active Users */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h3 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#1e40af', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Người dùng hoạt động
            </h3>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#2563eb',
                lineHeight: 1
              }}>
                {users.filter(u => u.status === 'Hoạt động').length}
              </div>
              <CheckCircleIcon style={{width: '3rem', height: '3rem', color: '#3b82f6'}} />
            </div>
          </div>

          {/* Departments */}
          <div style={{
            background: 'linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h3 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#6b21a8', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Phòng ban
            </h3>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#7c3aed',
                lineHeight: 1
              }}>
                {departments.filter(d => d !== 'Tất cả').length}
              </div>
              <ShieldCheckIcon style={{width: '3rem', height: '3rem', color: '#8b5cf6'}} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Filters */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
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
                    placeholder="Tìm kiếm theo tên hoặc email..."
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
                  />
                </div>
              </div>
            
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '0.5rem'
                }}>
                  <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#8b5cf6'}} />
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#8b5cf6'}}>
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
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role === 'Tất cả' ? 'Tất cả vai trò' : role}
                    </option>
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
                    minWidth: '10rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === 'Tất cả' ? 'Tất cả phòng ban' : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Users Table */}
          <div style={{overflowX: 'auto'}}>
            <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg,rgba(124, 58, 237, 0.55) 100%, #e2e8f0 100%)'
                }}>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Người dùng
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Vai trò
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Phòng ban
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Quyền hạn
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Hoạt động gần nhất
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
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
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    style={{
                      borderBottom: index !== filteredUsers.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <div style={{
                          width: '3rem', 
                          height: '3rem', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          marginRight: '1rem', 
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                        }}>
                          <UserCircleIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                        </div>
                        <div>
                          <div style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem'}}>
                            {user.name}
                          </div>
                          <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '9999px',
                        background: getRoleColor(user.role).bg,
                        color: getRoleColor(user.role).color,
                        border: '1px solid',
                        borderColor: getRoleColor(user.role).border
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {user.department}
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                        {user.permissions.map((permission, idx) => (
                          <span key={idx} style={{
                            display: 'inline-flex',
                            alignItems: 'center', 
                            padding: '0.375rem 0.75rem', 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: '#7c3aed',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                          }}>
                            {getPermissionIcon(permission)}
                            {permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <ClockIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                        {new Date(user.lastActive).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button
                          onClick={() => handleEditUser(user.id)}
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
                          title="Chỉnh sửa người dùng"
                        >
                          <PencilIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
                          title="Xóa người dùng"
                        >
                          <TrashIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                        <button
                          onClick={() => handleManagePermissions(user.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
                          }}
                          title="Quản lý quyền hạn"
                        >
                          <ShieldCheckIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
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
                        Không tìm thấy người dùng phù hợp
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
