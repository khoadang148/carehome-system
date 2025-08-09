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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { residentAPI, bedAssignmentsAPI } from '@/lib/api';
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
  

  
  // Check access permissions and URL parameters
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
  

  
  // Load residents from API when component mounts
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const apiData = await residentAPI.getAll();
        // Map API data về đúng format UI với key mới
        const mapped = apiData.map((r: any) => ({
          id: r._id,
          name: r.full_name || '',
          age: r.date_of_birth ? (new Date().getFullYear() - new Date(r.date_of_birth).getFullYear()) : '',
          careLevel: r.care_level || '',
          emergencyContact: r.emergency_contact?.name || '',
          contactPhone: r.emergency_contact?.phone || '',
          avatar: Array.isArray(r.avatar) ? r.avatar[0] : r.avatar || null,
          gender: (r.gender || '').toLowerCase(),
        }));
        setResidentsData(mapped);
        console.log('Mapped residents:', mapped);
        console.log('Avatar debug:', mapped.map(r => ({ name: r.name, avatar: r.avatar })));
        // Lấy số phòng cho từng resident
        mapped.forEach(async (resident: any) => {
          try {
            // Ưu tiên sử dụng bedAssignmentsAPI
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident.id);
            const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
            
            if (bedAssignment?.bed_id?.room_id) {
              // Nếu room_id đã có thông tin room_number, sử dụng trực tiếp
              if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                console.log(`Room for resident ${resident.id} (direct):`, bedAssignment.bed_id.room_id.room_number);
                setRoomNumbers(prev => ({ ...prev, [resident.id]: bedAssignment.bed_id.room_id.room_number }));
              } else {
                // Nếu chỉ có _id, fetch thêm thông tin
                const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                if (roomId) {
                  const room = await roomsAPI.getById(roomId);
                  console.log(`Room for resident ${resident.id} (fetched):`, room);
                  setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kíkí' }));
                } else {
                  setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
                }
              }
            } else {
              // Fallback: lấy từ care plan assignments
              const assignments = await carePlansAPI.getByResidentId(resident.id);
              const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
              const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
              // Đảm bảo roomId là string, không phải object
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              if (roomIdString) {
                const room = await roomsAPI.getById(roomIdString);
                console.log(`Room for resident ${resident.id} (fallback):`, room);
                setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
              } else {
                console.log(`No room assigned for resident ${resident.id}`);
                setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
              }
            }
          } catch (error) {
            console.log(`Error getting room for resident ${resident.id}:`, error);
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
          }
        });

  // Debug: Log room numbers
  console.log('Room numbers state:', roomNumbers);
  
  } catch (err) {
        setResidentsData([]);
      }
    };
    fetchResidents();
  }, []);

  // Load care plans for filter dropdown
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
    router.push(`/admin/residents/${residentId}`);
  };
  
  // Handle edit resident
  const handleEditResident = (residentId: number) => {
    router.push(`/admin/residents/${residentId}/edit`);
  };
  
  // Handle delete resident
  const handleDeleteClick = (id: number) => {
    setResidentToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (residentToDelete !== null) {
      try {
        // Gọi API để xóa resident trên backend
        await residentAPI.delete(residentToDelete.toString());
        
        // Cập nhật state frontend sau khi xóa thành công
        const updatedResidents = residentsData.filter(resident => resident.id !== residentToDelete);
        setResidentsData(updatedResidents);
        
        setShowDeleteModal(false);
        setResidentToDelete(null);
        
        // Hiển thị modal thông báo xóa thành công
        setSuccessMessage('Đã xóa thông tin người cao tuổi thành công! Tài khoản gia đình vẫn được giữ nguyên.');
        setModalType('success');
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Error deleting resident:', error);
        setShowDeleteModal(false);
        setResidentToDelete(null);
        
        // Hiển thị modal thông báo lỗi
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
                  Quản lý người cao tuổi
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
                  href="/admin/residents/add" 
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
                  Thêm Người cao tuổi mới
                </Link>
              )}
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
                Hiển thị: {filteredResidents.length} người cao tuổi
              </p>
            </div>
          </div>
        </div>

        {/* Residents Table */}
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
                        <button
                          onClick={() => handleEditResident(resident.id)}
                          title="Chỉnh sửa thông tin người cao tuổi"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f59e0b';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                            e.currentTarget.style.color = '#f59e0b';
                          }}
                        >
                          <PencilIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteClick(resident.id)}
                            title="Xóa người cao tuổi khỏi hệ thống"
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <TrashIcon style={{width: '1rem', height: '1rem'}} />
                          </button>
                        )}
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
                Không tìm thấy người cao tuổi
              </h3>
              <p style={{margin: 0, fontSize: '0.875rem'}}>
                Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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

      {/* Success Modal */}
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
