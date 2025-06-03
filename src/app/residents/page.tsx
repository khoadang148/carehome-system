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
  TrashIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import { RESIDENTS_DATA } from '@/lib/residents-data';

export default function ResidentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCareLevel, setFilterCareLevel] = useState('');
  const [residentsData, setResidentsData] = useState(RESIDENTS_DATA);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<number | null>(null);
  
  // Load residents from localStorage when component mounts
  useEffect(() => {
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      try {
        const parsedResidents = JSON.parse(savedResidents);
        setResidentsData(parsedResidents);
      } catch (error) {
        console.error('Error parsing saved residents data:', error);
        // If there's an error, reset to default data
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
        setResidentsData(RESIDENTS_DATA);
      }
    } else {
      // Initialize localStorage with default data if it's empty
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
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
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <UserGroupIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý cư dân
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {residentsData.length} cư dân
                </p>
              </div>
            </div>
            
            <Link 
              href="/residents/add" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <PlusCircleIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
              Thêm cư dân
            </Link>
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
                  placeholder="Tìm kiếm cư dân..."
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
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                />
              </div>
            </div>
          
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '0.5rem'
              }}>
                <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#667eea'}} />
                <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#667eea'}}>
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
                  minWidth: '12rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                value={filterCareLevel}
                onChange={(e) => setFilterCareLevel(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <option value="">Tất cả gói dịch vụ</option>
                <option value="Cơ bản">Gói cơ bản</option>
                <option value="Nâng cao">Gói nâng cao</option>
                <option value="Cao cấp">Gói cao cấp</option>
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
                    Tuổi
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
                    Phòng
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
                    Gói dịch vụ
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
                    Ngày tiếp nhận
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
                {filteredResidents.map((resident, index) => (
                  <tr 
                    key={resident.id} 
                    style={{
                      borderBottom: index !== filteredResidents.length - 1 ? '1px solid #f1f5f9' : 'none',
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
                      {resident.name}
                    </td>
                    <td style={{
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {resident.age}
                    </td>
                    <td style={{
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {resident.room}
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.375rem 0.875rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '9999px',
                        background: 
                          resident.careLevel === 'Cơ bản' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 
                          resident.careLevel === 'Nâng cao' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 
                          'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                        color: 
                          resident.careLevel === 'Cơ bản' ? '#1d4ed8' : 
                          resident.careLevel === 'Nâng cao' ? '#166534' : '#7c3aed',
                        border: '1px solid',
                        borderColor:
                          resident.careLevel === 'Cơ bản' ? '#93c5fd' : 
                          resident.careLevel === 'Nâng cao' ? '#86efac' : '#c4b5fd'
                      }}>
                        {resident.careLevel}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {new Date(resident.admissionDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{padding: '1.25rem 1.5rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button
                          onClick={() => handleViewResident(resident.id)}
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
                          onClick={() => handleEditResident(resident.id)}
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
                          onClick={() => handleDeleteClick(resident.id)}
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
                {filteredResidents.length === 0 && (
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
                        <UserGroupIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                        Không tìm thấy cư dân nào
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
                Xác nhận xóa cư dân
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                Bạn có chắc chắn muốn xóa cư dân này? Hành động này không thể hoàn tác.
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