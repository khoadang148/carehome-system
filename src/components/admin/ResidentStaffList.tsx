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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Hiển thị 6 items/trang (2 hàng x 3 cột)
  const [totalPages, setTotalPages] = useState(1);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Reset to first page when switching tabs
    setCurrentPage(1);
  }, [activeTab]);

  // Filter data when search term changes
  useEffect(() => {
    const filterData = () => {
      const term = searchTerm.toLowerCase().trim();
      
      if (term === '') {
        setFilteredResidents(residents);
        setFilteredStaff(staff);
      } else {
        // Filter residents
        const filteredRes = residents.filter(resident =>
          resident.full_name.toLowerCase().includes(term) ||
          (resident.room_number && resident.room_number.includes(term)) ||
          (resident.bed_number && resident.bed_number.includes(term))
        );
        setFilteredResidents(filteredRes);

        // Filter staff
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
      
      // Fetch residents with active status
      const residentsData = await residentAPI.getAll();
      const activeResidents = residentsData.filter((resident: any) => 
        resident.status === 'active'
      );
      setResidents(activeResidents);
      setFilteredResidents(activeResidents);

      // Fetch active staff
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

  // Get current page data
  const getCurrentPageData = () => {
    const data = activeTab === 'residents' ? filteredResidents : filteredStaff;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const calculateTotalPages = () => {
    const data = activeTab === 'residents' ? filteredResidents : filteredStaff;
    return Math.ceil(data.length / itemsPerPage);
  };

  // Update total pages when data changes
  useEffect(() => {
    const total = calculateTotalPages();
    setTotalPages(total);
    // Reset to first page if current page is out of range
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredResidents, filteredStaff, activeTab, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
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

    // Previous button
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

    // Page numbers
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

    // Next button
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
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            color: '#1e293b'
          }}>
            Quản lý cư dân & nhân viên
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: 0
          }}>
            Danh sách người cao tuổi đang nằm viện và nhân viên đang làm việc
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#f1f5f9',
            borderRadius: '0.75rem'
          }}>
            <UsersIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              {residents.length} cư dân
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#f1f5f9',
            borderRadius: '0.75rem'
          }}>
            <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              {staff.length} nhân viên
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {/* Content Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1e293b',
              margin: 0
            }}>
              {activeTab === 'residents' ? 'Danh sách người cao tuổi' : 'Danh sách nhân viên'}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              <span>Hiển thị {currentData.length}/{totalItems}</span>
              {totalPages > 1 && (
                <span>• Trang {currentPage}/{totalPages}</span>
              )}
            </div>
          </div>

          {/* Search Bar */}
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

          {/* Search Results Info */}
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

        {/* Grid Content */}
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
                      <span>{calculateAge(resident.date_of_birth)} tuổi</span>
                      <span>•</span>
                      <span>{resident.gender === 'male' ? 'Nam' : 'Nữ'}</span>
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
                    color: '#64748b'
                  }}>
                    <CalendarDaysIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>Nhập viện: {formatDate(resident.admission_date)}</span>
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

        {/* Pagination */}
        {renderPagination()}

        {/* Empty State */}
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
                  ? 'Hiện tại chưa có người cao tuổi nào đang nằm viện. Dữ liệu sẽ hiển thị khi có cư dân mới.'
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
