"use client";

import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon,
  HeartIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { residentAPI, userAPI } from '@/lib/api';
import { getAvatarUrlWithFallback } from '@/lib/utils/avatarUtils';
import EmptyState from './EmptyState';

interface Resident {
  _id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  status: string;
  admission_date: string;
  avatar?: string;
  room_number?: string;
  bed_number?: string;
}

interface Staff {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  position?: string;
  qualification?: string;
}

export default function ResidentStaffList() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'residents' | 'staff'>('residents');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const filterData = () => {
      const term = searchTerm.toLowerCase().trim();
      
      if (term === '') {
        setFilteredResidents(residents);
        setFilteredStaff(staff);
      } else {
        const filteredRes = residents.filter(resident =>
          resident.full_name.toLowerCase().includes(term) ||
          (resident.room_number && resident.room_number.includes(term)) ||
          (resident.bed_number && resident.bed_number.includes(term))
        );
        setFilteredResidents(filteredRes);

        const filteredStf = staff.filter(member =>
          member.full_name.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term) ||
          (member.phone && member.phone.includes(term)) ||
          (member.position && member.position.toLowerCase().includes(term))
        );
        setFilteredStaff(filteredStf);
      }
    };

    filterData();
  }, [searchTerm, residents, staff]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const residentsData = await residentAPI.getAll();
      const activeResidents = residentsData.filter((resident: any) => 
        resident.status === 'active'
      );
      setResidents(activeResidents);
      setFilteredResidents(activeResidents);

      const staffData = await userAPI.getAll();
      const activeStaff = staffData.filter((user: any) => 
        user.role === 'staff' && user.status === 'active'
      );
      setStaff(activeStaff);
      setFilteredStaff(activeStaff);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getAvatarUrl = (avatar?: string) => {
    return getAvatarUrlWithFallback(avatar || '');
  };

  const getCurrentPageData = () => {
    const data = activeTab === 'residents' ? filteredResidents : filteredStaff;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const calculateTotalPages = () => {
    const data = activeTab === 'residents' ? filteredResidents : filteredStaff;
    return Math.ceil(data.length / itemsPerPage);
  };

  useEffect(() => {
    const total = calculateTotalPages();
    setTotalPages(total);
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredResidents, filteredStaff, activeTab, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: React.ReactElement[] = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          background: currentPage === 1 ? '#f3f4f6' : 'white',
          color: currentPage === 1 ? '#9ca3af' : '#374151',
          borderRadius: '0.375rem',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        <ChevronLeftIcon style={{ width: '1rem', height: '1rem' }} />
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            background: currentPage === i ? '#3b82f6' : 'white',
            color: currentPage === i ? 'white' : '#374151',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: currentPage === i ? 600 : 400
          }}
        >
          {i}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #d1d5db',
          background: currentPage === totalPages ? '#f3f4f6' : 'white',
          color: currentPage === totalPages ? '#9ca3af' : '#374151',
          borderRadius: '0.375rem',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        <ChevronRightIcon style={{ width: '1rem', height: '1rem' }} />
      </button>
    );

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}>
        {pages}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          width: '100%',
          height: '400px',
          background: '#e2e8f0',
          borderRadius: '0.75rem'
        }} />
      </div>
    );
  }

  const currentData = getCurrentPageData();
  const totalItems = activeTab === 'residents' ? filteredResidents.length : filteredStaff.length;
  const originalTotalItems = activeTab === 'residents' ? residents.length : staff.length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1.25rem',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
       
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%'
        }} />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              margin: '0 0 0.75rem 0',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              Quản lý cư dân & nhân viên
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontWeight: 400
            }}>
              Tổng quan và quản lý thông tin người cao tuổi, nhân viên tại viện dưỡng lão
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                padding: '0.5rem',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '0.5rem'
              }}>
                <UsersIcon style={{ width: '1.5rem', height: '1.5rem', color: '#fecaca' }} />
              </div>
              <div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: 'white',
                  lineHeight: 1
                }}>
                  {residents.length}
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500
                }}>
                  Người cao tuổi
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                padding: '0.5rem',
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '0.5rem'
              }}>
                <UserGroupIcon style={{ width: '1.5rem', height: '1.5rem', color: '#bbf7d0' }} />
              </div>
              <div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: 'white',
                  lineHeight: 1
                }}>
                  {staff.length}
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500
                }}>
                  Nhân viên
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <button
          onClick={() => setActiveTab('residents')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'residents' ? '#3b82f6' : '#64748b',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'residents' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Người cao tuổi ({residents.length})
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'staff' ? '#3b82f6' : '#64748b',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'staff' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Nhân viên ({staff.length})
          </div>
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                borderRadius: '2px'
              }} />
              <h3 style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                {activeTab === 'residents' ? 'Danh sách người cao tuổi' : 'Danh sách nhân viên'}
              </h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: 500
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#10b981',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }} />
                <span>Hiển thị {currentData.length}/{totalItems}</span>
              </div>
              {totalPages > 1 && (
                <>
                  <div style={{
                    width: '1px',
                    height: '16px',
                    background: '#d1d5db'
                  }} />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#3b82f6',
                    fontWeight: 600
                  }}>
                    <span>Trang {currentPage}/{totalPages}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              position: 'relative',
              flex: 1,
              maxWidth: '400px'
            }}>
              <MagnifyingGlassIcon style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.25rem',
                height: '1.25rem',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder={activeTab === 'residents' 
                  ? 'Tìm kiếm theo tên, phòng, giường...' 
                  : 'Tìm kiếm theo tên, email, số điện thoại...'
                }
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  background: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
            </div>
            
            {searchTerm && (
              <button
                onClick={clearSearch}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          {searchTerm && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#1e40af'
            }}>
              <strong>Kết quả tìm kiếm:</strong> Tìm thấy {totalItems} kết quả 
              {totalItems !== originalTotalItems && (
                <span> (trong tổng số {originalTotalItems})</span>
              )}
              {searchTerm && (
                <span> cho "{searchTerm}"</span>
              )}
            </div>
          )}
        </div>
              
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem',
          padding: '1.5rem'
        }}>
          {activeTab === 'residents' ? (
            currentData.map((resident) => (
              <div key={resident._id} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <img
                    src={getAvatarUrl(resident.avatar)}
                    alt={resident.full_name}
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e2e8f0'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.svg';
                    }}
                  />
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      margin: '0 0 0.25rem 0',
                      color: '#1e293b'
                    }}>
                      {resident.full_name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}>
                      <span>Tuổi: {calculateAge(resident.date_of_birth)}</span>
                      <span>•</span>
                      <span>Giới tính: {resident.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#64748b',
                    gridColumn: '1 / -1'
                  }}>
                    <CalendarDaysIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>Ngày nhập viện: {formatDate(resident.admission_date)}</span>
                  </div>
                  
                  {(resident.room_number || resident.bed_number) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#64748b'
                    }}>
                      <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>
                        {resident.room_number && `P${resident.room_number}`}
                        {resident.bed_number && ` - G${resident.bed_number}`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#dcfce7',
                  color: '#065f46',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  Đang nằm viện
                </div>
              </div>
            ))
          ) : (
            currentData.map((member) => (
              <div key={member._id} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <img
                    src={getAvatarUrl(member.avatar)}
                    alt={member.full_name}
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e2e8f0'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.svg';
                    }}
                  />
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      margin: '0 0 0.25rem 0',
                      color: '#1e293b'
                    }}>
                      {member.full_name}
                    </h3>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}>
                      {member.position || 'Nhân viên chăm sóc'}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#64748b'
                  }}>
                    <EnvelopeIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>{member.email}</span>
                  </div>
                  
                  {member.phone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#64748b'
                    }}>
                      <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  
                  {member.qualification && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      {member.qualification}
                    </div>
                  )}
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  Đang làm việc
                </div>
              </div>
            ))
          )}
        </div>

        {renderPagination()}

        {currentData.length === 0 && (
          <div style={{ padding: '3rem 1.5rem' }}>
            <EmptyState
              type="no-data"
              title={searchTerm 
                ? `Không tìm thấy kết quả cho "${searchTerm}"`
                : activeTab === 'residents' 
                  ? 'Không có người cao tuổi nào đang nằm viện'
                  : 'Không có nhân viên nào đang làm việc'
              }
              message={searchTerm
                ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem tất cả.'
                : activeTab === 'residents'
                  ? 'Hiện tại chưa có người cao tuổi nào đang nằm viện. Dữ liệu sẽ hiển thị khi có người cao tuổi mới.'
                  : 'Hiện tại chưa có nhân viên nào đang làm việc. Dữ liệu sẽ hiển thị khi có nhân viên mới.'
              }
              icon={activeTab === 'residents' ? UsersIcon : UserGroupIcon}
            />
          </div>
        )}
      </div>
    </div>
  );
}
