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
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { residentAPI, bedAssignmentsAPI, API_BASE_URL } from '@/lib/api';
import { carePlansAPI } from '@/lib/api';
import { roomsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { userAPI } from "@/lib/api";
import Avatar from '@/components/Avatar';


export default function ResidentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [residentsData, setResidentsData] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<number | null>(null);
  const [carePlanOptions, setCarePlanOptions] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned' | 'discharged'>('assigned');
  

  
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
    

  }, [user, router]);
  

  
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const apiData = await residentAPI.getAll();
        const mapped = apiData.map((r: any) => ({
          id: r._id,
          name: r.full_name || '',
          age: r.date_of_birth ? (new Date().getFullYear() - new Date(r.date_of_birth).getFullYear()) : '',
          careLevel: r.care_level || '',
          emergencyContact: r.emergency_contact?.name || '',
          contactPhone: r.emergency_contact?.phone || '',
          avatar: r.avatar ? `${API_BASE_URL}/${r.avatar}` : null,
          gender: (r.gender || '').toLowerCase(),
          status: r.status || 'active',
        }));
        setResidentsData(mapped);
        mapped.forEach(async (resident: any) => {
          try {
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident.id);
            const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
            
            if (bedAssignment?.bed_id?.room_id) {
              if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                setRoomNumbers(prev => ({ ...prev, [resident.id]: bedAssignment.bed_id.room_id.room_number }));
              } else {
                const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                if (roomId) {
                  const room = await roomsAPI.getById(roomId);
                  setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
                } else {
                  setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
                }
              }
            } else {
              const assignments = await carePlansAPI.getByResidentId(resident.id);
              const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
              const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              if (roomIdString) {
                const room = await roomsAPI.getById(roomIdString);
                setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
              } else {
                setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
              }
            }
          } catch (error) {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
          }
        });
        
      } catch (err) {
        setResidentsData([]);
      }
    };
    fetchResidents();
  }, []);

  useEffect(() => {
    const fetchCarePlans = async () => {
      try {
        const data = await carePlansAPI.getAll();
        setCarePlanOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setCarePlanOptions([]);
      }
    };
    fetchCarePlans();
  }, []);
  

  
  const filteredResidents = residentsData.filter((resident) => {
    const searchValue = (searchTerm || '').toString();
    const residentName = (resident.name || '').toString();
    const residentRoom = (roomNumbers[resident.id] || '').toString();
    return residentName.toLowerCase().includes(searchValue.toLowerCase()) ||
                         residentRoom.toLowerCase().includes(searchValue.toLowerCase());
  });

  const residentsWithRooms = filteredResidents.filter(resident => 
    resident.status === 'active' && roomNumbers[resident.id] && roomNumbers[resident.id] !== 'Chưa hoàn tất đăng kí'
  );
  
  const residentsWithoutRooms = filteredResidents.filter(resident => 
    resident.status === 'active' && (!roomNumbers[resident.id] || roomNumbers[resident.id] === 'Chưa hoàn tất đăng kí')
  );

  const residentsDischarged = filteredResidents.filter(resident => 
    resident.status === 'discharged'
  );
  
  const handleViewResident = (residentId: number) => {
    router.push(`/staff/residents/${residentId}`);
  };
  
  const handleEditResident = (residentId: number) => {
    router.push(`/staff/residents/${residentId}/edit`);
  };
  
  const handleDeleteClick = (id: number) => {
    setResidentToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (residentToDelete !== null) {
      try {
        await residentAPI.delete(residentToDelete.toString());
        
        const updatedResidents = residentsData.filter(resident => resident.id !== residentToDelete);
        setResidentsData(updatedResidents);
        
        setShowDeleteModal(false);
        setResidentToDelete(null);
        
        setSuccessMessage('Đã xóa thông tin người cao tuổi thành công! Tài khoản gia đình vẫn được giữ nguyên.');
        setModalType('success');
        setShowSuccessModal(true);
      } catch (error) {
        setShowDeleteModal(false);
        setResidentToDelete(null);
        
        setSuccessMessage('Có lỗi xảy ra khi xóa người cao tuổi. Vui lòng thử lại.');
        setModalType('error');
        setShowSuccessModal(true);
      }
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setResidentToDelete(null);
  };

  const renderResidentsTable = (residents: any[], showRoomColumn: boolean = true, showStatusColumn: boolean = false) => (
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
                    Người cao tuổi
                  </th>
              {showRoomColumn && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Phòng
                  </th>
              )}
              {showStatusColumn && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Trạng thái
                  </th>
              )}
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
            {residents.map((resident, index) => (
                  <tr 
                    key={resident.id}
                    style={{
                  borderBottom: index < residents.length - 1 ? '1px solid #f3f4f6' : 'none',
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
                        <Avatar
                          src={resident.avatar}
                          alt={resident.name}
                          size="small"
                          className="w-10 h-10"
                          showInitials={false}
                          name={resident.name}
                          fallbackSrc="/default-avatar.svg"
                        />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#111827',
                            margin: 0
                          }}>
                            {resident.name}
                          </p>
                          
                        </div>
                      </div>
                    </td>
                {showRoomColumn && (
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
                )}
                {showStatusColumn && (
                    <td style={{padding: '1rem'}}>
                      <span style={{
                        background: resident.status === 'discharged' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: resident.status === 'discharged' ? '#ef4444' : '#10b981',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {resident.status === 'discharged' ? 'Đã xuất viện' : 'Đang ở viện'}
                      </span>
                    </td>
                )}
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
                          title="Xem thông tin chi tiết người cao tuổi"
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

      {residents.length === 0 && (
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
            {activeTab === 'assigned' ? 'Không có người cao tuổi nào đã được phân phòng' : 
             activeTab === 'unassigned' ? 'Không có người cao tuổi nào chưa được phân phòng' :
             'Không có người cao tuổi nào đã xuất viện'}
              </h3>
              <p style={{margin: 0, fontSize: '0.875rem'}}>
            {activeTab === 'assigned' ? 'Tất cả người cao tuổi đều chưa được phân phòng' : 
             activeTab === 'unassigned' ? 'Tất cả người cao tuổi đều đã được phân phòng' :
             'Tất cả người cao tuổi đều đang ở viện'}
              </p>
            </div>
          )}
        </div>
  );





  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>


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
                  Danh sách người cao tuổi
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Tổng số: {residentsData.length} người cao tuổi
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              {user?.role === 'admin' && (
                <Link 
                  href="/staff/residents/add" 
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
                  Thêm Người cao tuổi
                </Link>
              )}
            </div>
          </div>
        </div>

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
                Hiển thị: {activeTab === 'assigned' ? residentsWithRooms.length : 
                           activeTab === 'unassigned' ? residentsWithoutRooms.length :
                           residentsDischarged.length} người cao tuổi
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setActiveTab('assigned')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'assigned' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: activeTab === 'assigned' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'assigned' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <HomeIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Đã phân phòng ({residentsWithRooms.length} người)
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'unassigned' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: activeTab === 'unassigned' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'unassigned' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <ExclamationTriangleIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Chưa phân phòng ({residentsWithoutRooms.length} người)
            </button>
            <button
              onClick={() => setActiveTab('discharged')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'discharged' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                color: activeTab === 'discharged' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'discharged' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
              }}
            >
              <svg style={{width: '1.125rem', height: '1.125rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đã xuất viện ({residentsDischarged.length} người)
            </button>
          </div>


        </div>

        {activeTab === 'assigned' ? renderResidentsTable(residentsWithRooms, true, false) : 
         activeTab === 'unassigned' ? renderResidentsTable(residentsWithoutRooms, false, false) :
         renderResidentsTable(residentsDischarged, false, true)}

      </div>

      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#111827'}}>
              Xác nhận xóa thông tin người cao tuổi
            </h3>
            <p style={{margin: '0 0 1.5rem 0', color: '#6b7280'}}>
              Bạn có chắc chắn muốn xóa thông tin người cao tuổi này? Hành động này sẽ chỉ xóa thông tin resident mà không ảnh hưởng đến tài khoản gia đình. Hành động này không thể hoàn tác.
            </p>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: modalType === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              {modalType === 'success' ? (
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
              color: '#1f2937'
            }}>
              {modalType === 'success' ? 'Thành công' : 'Lỗi'}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
