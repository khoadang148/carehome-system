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
  UserGroupIcon,
  PhotoIcon,
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { staffAssignmentsAPI, carePlansAPI, roomsAPI, userAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

interface Resident {
  _id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  emergency_contact?: string;
  medical_conditions?: string;
  allergies?: string;
  room_number?: string;
  bed_number?: string;
  avatar?: string;
}

interface StaffAssignment {
  _id: string;
  resident_id: Resident;
  assigned_date: string;
  end_date?: string;
  notes?: string;
  responsibilities: string[];
}

export default function StaffResidentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [residentsData, setResidentsData] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'staff') {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load residents from API when component mounts
  useEffect(() => {
    const fetchResidents = async () => {
      setLoadingData(true);
      try {
        const data = await staffAssignmentsAPI.getMyAssignments();
        const assignmentsData = Array.isArray(data) ? data : [];
        
        // Map API data về đúng format UI
        const mapped = assignmentsData.map((assignment: any) => {
          const resident = assignment.resident_id;
          const age = resident.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '';
          
          return {
            id: resident._id,
            name: resident.full_name || '',
            age: age || '',
            careLevel: resident.care_level || '',
            emergencyContact: resident.emergency_contact?.name || '',
            contactPhone: resident.emergency_contact?.phone || '',
            avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
            gender: (resident.gender || '').toLowerCase(),
          };
        });
        
        setResidentsData(mapped);
        
        // Lấy số phòng cho từng resident
        mapped.forEach(async (resident: any) => {
          try {
            const assignments = await carePlansAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
            const roomId = assignment?.assigned_room_id;
            if (roomId) {
              const room = await roomsAPI.getById(roomId);
              setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa cập nhật' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
          }
        });
        
        setError('');
      } catch (err) {
        console.error('Error loading assignments:', err);
        setError('Không thể tải danh sách cư dân được phân công.');
        setResidentsData([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (user && user.role === 'staff') {
      fetchResidents();
    }
  }, [user]);

  // Filter residents chỉ theo search term
  const filteredResidents = residentsData.filter((resident) => {
    const searchValue = (searchTerm || '').toString();
    const residentName = (resident.name || '').toString();
    const residentRoom = (roomNumbers[resident.id] || '').toString();
    return residentName.toLowerCase().includes(searchValue.toLowerCase()) ||
           residentRoom.toLowerCase().includes(searchValue.toLowerCase());
  });
  
  // Handle view resident details
  const handleViewResident = (residentId: number) => {
    router.push(`/staff/residents/${residentId}`);
  };



  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p style={{ marginLeft: 16, color: '#6366f1', fontWeight: 600 }}>Đang tải...</p>
      </div>
    );
  }

  if (user.role !== 'staff') return null;

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
                  Danh sách cư dân được phân công
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {residentsData.length} cư dân được phân công cho bạn
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <Link 
                href="/staff" 
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
                <ArrowLeftIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Quay lại
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Search Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{position: 'relative'}}>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc phòng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                />
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
              </div>
            </div>

            {/* Results Count */}
            <div style={{
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#667eea',
                margin: 0,
                fontWeight: 600
              }}>
                Hiển thị: {filteredResidents.length} cư dân
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loadingData && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '4rem 2rem'
          }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p style={{ marginLeft: '1rem', color: '#6b7280' }}>Đang tải danh sách cư dân...</p>
          </div>
        )}

        {/* Residents Table */}
        {!loadingData && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Cư dân
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Phòng
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Tuổi
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Giới tính
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Liên hệ khẩn cấp
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151'
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
                        borderBottom: index < filteredResidents.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{padding: '1rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            overflow: 'hidden'
                          }}>
                            {resident.avatar ? (
                              <img
                                src={userAPI.getAvatarUrl(resident.avatar)}
                                alt={resident.name}
                                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.textContent = resident.name.charAt(0).toUpperCase();
                                  }
                                }}
                              />
                            ) : (
                              <img
                                src="/default-avatar.svg"
                                alt="Default avatar"
                                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.textContent = resident.name.charAt(0).toUpperCase();
                                  }
                                }}
                              />
                            )}
                          </div>
                          <div>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: 0
                            }}>
                              {resident.name}
                            </p>
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              margin: 0
                            }}>
                              ID: {resident.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {roomNumbers[resident.id] || 'Đang tải...'}
                        </span>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: 500
                        }}>
                          {resident.age} tuổi
                        </span>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: 500
                        }}>
                          {resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'Khác'}
                        </span>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#111827',
                            margin: 0
                          }}>
                            {resident.emergencyContact}
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            {resident.contactPhone}
                          </p>
                                                 </div>
                       </td>
                       <td style={{padding: '1rem'}}>
                         <div style={{
                           display: 'flex',
                           justifyContent: 'center',
                           gap: '0.5rem'
                         }}>
                           <button
                             onClick={() => handleViewResident(resident.id)}
                             title="Xem thông tin chi tiết cư dân"
                             style={{
                               padding: '0.5rem',
                               borderRadius: '0.375rem',
                               border: 'none',
                               background: 'rgba(59, 130, 246, 0.1)',
                               color: '#3b82f6',
                               cursor: 'pointer',
                               transition: 'all 0.2s ease'
                             }}
                             onMouseOver={(e) => {
                               e.currentTarget.style.background = '#3b82f6';
                               e.currentTarget.style.color = 'white';
                             }}
                             onMouseOut={(e) => {
                               e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                               e.currentTarget.style.color = '#3b82f6';
                             }}
                           >
                             <EyeIcon style={{width: '1rem', height: '1rem'}} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>

            {filteredResidents.length === 0 && (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <UserGroupIcon style={{
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  color: '#d1d5db'
                }} />
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0',
                  color: '#374151'
                }}>
                  {searchTerm ? 'Không tìm thấy cư dân' : 'Chưa có cư dân nào được phân công'}
                </h3>
                <p style={{margin: 0, fontSize: '0.875rem'}}>
                  {searchTerm ? 'Thử thay đổi tiêu chí tìm kiếm' : 'Admin sẽ phân công cư dân cho bạn sớm'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 