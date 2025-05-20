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
  TrashIcon
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
  const handleViewStaff = (id: number) => {
    router.push(`/staff/${id}`);
  };
  
  // Handle edit staff
  const handleEditStaff = (id: number) => {
    router.push(`/staff/${id}/edit`);
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Quản lý nhân viên</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <Link 
            href="/staff/schedule" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <CalendarIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Lịch làm việc
          </Link>
          <Link 
            href="/staff/add" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <PlusCircleIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Thêm nhân viên
          </Link>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{position: 'relative', width: '100%', maxWidth: '20rem'}}>
              <div style={{position: 'absolute', top: 0, bottom: 0, left: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none'}}>
                <MagnifyingGlassIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
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
          
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept === 'Tất cả' ? 'Tất cả phòng ban' : `Phòng ban ${dept}`}</option>
                  ))}
                </select>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                >
                  {shifts.map((shift) => (
                    <option key={shift} value={shift}>{shift === 'Tất cả' ? 'Tất cả ca làm việc' : `Ca ${shift}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tên</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Vị trí</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Phòng ban</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ca làm việc</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Chứng chỉ</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Liên hệ</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{staff.name}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{staff.position}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{staff.department}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        staff.shiftType === 'Sáng' ? '#dbeafe' : 
                        staff.shiftType === 'Chiều' ? '#f3e8ff' :
                        staff.shiftType === 'Đêm' ? '#e0e7ff' : '#dcfce7',
                      color: 
                        staff.shiftType === 'Sáng' ? '#1e40af' : 
                        staff.shiftType === 'Chiều' ? '#7e22ce' :
                        staff.shiftType === 'Đêm' ? '#4338ca' : '#166534'
                    }}>
                      {staff.shiftType}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{staff.certification}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{staff.contactPhone}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <button 
                        onClick={() => handleViewStaff(staff.id)}
                        style={{color: '#2563eb', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                        title="Xem thông tin chi tiết"
                      >
                        <EyeIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button
                        onClick={() => handleEditStaff(staff.id)}
                        style={{color: '#16a34a', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                        title="Chỉnh sửa thông tin"
                      >
                        <PencilIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <Link href={`/staff/${staff.id}/schedule`} style={{color: '#9333ea', display: 'flex', alignItems: 'center'}} title="Xem lịch làm việc">
                        <CalendarIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                      <button 
                        onClick={() => handleDeleteClick(staff.id)}
                        style={{color: '#dc2626', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                        title="Xoá nhân viên"
                      >
                        <TrashIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStaff.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy nhân viên phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
      
      {/* Modal xác nhận xoá nhân viên */}
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
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '28rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.75rem'
            }}>
              Xác nhận xoá
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#4b5563',
              marginBottom: '1.5rem'
            }}>
              Bạn có chắc chắn muốn xoá nhân viên này? Thao tác này không thể hoàn tác.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Huỷ
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.375rem',
                  border: '1px solid transparent',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 