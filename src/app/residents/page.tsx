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
  TrashIcon 
} from '@heroicons/react/24/outline';

// Mock resident data
const initialResidents = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    age: 78, 
    room: '101', 
    careLevel: 'Low', 
    admissionDate: '2023-02-15',
    medicalConditions: ['Hypertension', 'Arthritis']
  },
  { 
    id: 2, 
    name: 'Robert Smith', 
    age: 82, 
    room: '102', 
    careLevel: 'Medium', 
    admissionDate: '2023-01-10',
    medicalConditions: ['Diabetes', 'Heart Disease']
  },
  { 
    id: 3, 
    name: 'Mary Williams', 
    age: 85, 
    room: '103', 
    careLevel: 'High', 
    admissionDate: '2022-11-23',
    medicalConditions: ['Alzheimer\'s', 'Osteoporosis']
  },
  { 
    id: 4, 
    name: 'James Brown', 
    age: 76, 
    room: '104', 
    careLevel: 'Medium', 
    admissionDate: '2023-03-05',
    medicalConditions: ['COPD', 'Arthritis']
  },
  { 
    id: 5, 
    name: 'Patricia Davis', 
    age: 81, 
    room: '105', 
    careLevel: 'Low', 
    admissionDate: '2023-04-12',
    medicalConditions: ['Hypertension', 'Depression']
  },
];

export default function ResidentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCareLevel, setFilterCareLevel] = useState('');
  const [residentsData, setResidentsData] = useState(initialResidents);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<number | null>(null);
  
  // Load residents from localStorage when component mounts
  useEffect(() => {
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      setResidentsData(JSON.parse(savedResidents));
    }
  }, []);
  
  // Filter residents based on search term and care level filter
  const filteredResidents = residentsData.filter((resident) => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resident.room.includes(searchTerm);
    
    const matchesCareLevel = filterCareLevel === '' || resident.careLevel === filterCareLevel;
    
    return matchesSearch && matchesCareLevel;
  });
  
  // Handle view resident details
  const handleViewResident = (id: number) => {
    router.push(`/residents/${id}`);
  };
  
  // Handle edit resident
  const handleEditResident = (id: number) => {
    router.push(`/residents/${id}/edit`);
  };
  
  // Handle delete resident
  const handleDeleteClick = (id: number) => {
    setResidentToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (residentToDelete !== null) {
      const updatedResidents = residentsData.filter(resident => resident.id !== residentToDelete);
      setResidentsData(updatedResidents);
      
      // Save to localStorage after deleting
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
      
      setShowDeleteModal(false);
      setResidentToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setResidentToDelete(null);
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Quản lý cư dân</h1>
        <Link 
          href="/residents/add" 
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
          Thêm cư dân
        </Link>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem'}}>
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
                placeholder="Tìm kiếm cư dân..."
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
              <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
              <select
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}
                value={filterCareLevel}
                onChange={(e) => setFilterCareLevel(e.target.value)}
              >
                <option value="">Tất cả mức độ chăm sóc</option>
                <option value="Low">Chăm sóc nhẹ</option>
                <option value="Medium">Chăm sóc trung bình</option>
                <option value="High">Chăm sóc đặc biệt</option>
              </select>
            </div>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tên</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tuổi</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Phòng</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Mức chăm sóc</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ngày tiếp nhận</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredResidents.map((resident) => (
                <tr key={resident.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{resident.name}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{resident.age}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{resident.room}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        resident.careLevel === 'Low' ? '#dcfce7' : 
                        resident.careLevel === 'Medium' ? '#fef9c3' : '#fee2e2',
                      color: 
                        resident.careLevel === 'Low' ? '#166534' : 
                        resident.careLevel === 'Medium' ? '#854d0e' : '#b91c1c'
                    }}>
                      {resident.careLevel}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    {new Date(resident.admissionDate).toLocaleDateString()}
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <button 
                        onClick={() => handleViewResident(resident.id)}
                        style={{color: '#2563eb', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                        title="Xem thông tin chi tiết"
                      >
                        <EyeIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button
                        onClick={() => handleEditResident(resident.id)}
                        style={{color: '#16a34a', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                        title="Chỉnh sửa thông tin"
                      >
                        <PencilIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(resident.id)}
                        style={{color: '#dc2626', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                        title="Xoá cư dân"
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
        
        {filteredResidents.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy cư dân phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>

      {/* Modal xác nhận xoá cư dân */}
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
              Bạn có chắc chắn muốn xoá cư dân này? Thao tác này không thể hoàn tác.
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