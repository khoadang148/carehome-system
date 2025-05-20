"use client";

import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusCircleIcon,
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Mock user data
const users = [
  { 
    id: 1, 
    name: 'Admin Nguyễn', 
    email: 'admin@carehome.com',
    role: 'Quản trị viên',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa', 'Xóa'],
    department: 'Quản lý',
    lastActive: '2023-05-10'
  },
  { 
    id: 2, 
    name: 'Y tá Trần', 
    email: 'nurse@carehome.com',
    role: 'Y tá',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
    department: 'Y tế',
    lastActive: '2023-05-09'
  },
  { 
    id: 3, 
    name: 'Bác sĩ Lê', 
    email: 'doctor@carehome.com',
    role: 'Bác sĩ',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
    department: 'Y tế',
    lastActive: '2023-05-08'
  },
  { 
    id: 4, 
    name: 'Nhân viên Trịnh', 
    email: 'staff@carehome.com',
    role: 'Nhân viên',
    permissions: ['Đọc', 'Ghi'],
    department: 'Chăm sóc',
    lastActive: '2023-05-07'
  },
  { 
    id: 5, 
    name: 'Kế toán Phạm', 
    email: 'finance@carehome.com',
    role: 'Kế toán',
    permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
    department: 'Tài chính',
    lastActive: '2023-05-06'
  },
];

const roles = ['Tất cả', 'Quản trị viên', 'Bác sĩ', 'Y tá', 'Nhân viên', 'Kế toán'];

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Tất cả');
  
  // Filter users based on search term and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'Tất cả' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Quản lý phân quyền</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <PlusCircleIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Thêm người dùng mới
          </button>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{position: 'relative', width: '100%', maxWidth: '20rem'}}>
            <div style={{position: 'absolute', top: 0, bottom: 0, left: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none'}}>
              <MagnifyingGlassIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
                paddingRight: '0.75rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <select
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem'
              }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role} value={role}>{role === 'Tất cả' ? 'Tất cả vai trò' : role}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Người dùng</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Vai trò</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Phòng ban</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Quyền hạn</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Hoạt động gần nhất</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <div style={{width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem', flexShrink: 0}}>
                        <UserCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#6b7280'}} />
                      </div>
                      <div>
                        <div style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{user.name}</div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        user.role === 'Quản trị viên' ? '#f0f9ff' :
                        user.role === 'Bác sĩ' || user.role === 'Y tá' ? '#dcfce7' :
                        user.role === 'Kế toán' ? '#fef3c7' :
                        '#e0e7ff',
                      color: 
                        user.role === 'Quản trị viên' ? '#0369a1' :
                        user.role === 'Bác sĩ' || user.role === 'Y tá' ? '#166534' :
                        user.role === 'Kế toán' ? '#92400e' :
                        '#4338ca'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{user.department}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                      {user.permissions.map((permission, index) => (
                        <span key={index} style={{
                          display: 'inline-flex',
                          alignItems: 'center', 
                          padding: '0.125rem 0.5rem', 
                          fontSize: '0.75rem',
                          backgroundColor: '#f3f4f6',
                          color: '#4b5563',
                          borderRadius: '0.25rem'
                        }}>
                          {permission === 'Đọc' && (
                            <CheckCircleIcon style={{width: '0.75rem', height: '0.75rem', color: '#16a34a', marginRight: '0.25rem'}} />
                          )}
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{user.lastActive}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <button style={{color: '#2563eb', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                        <PencilIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button style={{color: '#dc2626', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                        <TrashIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button style={{color: '#16a34a', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                        <ShieldCheckIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy người dùng phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
} 