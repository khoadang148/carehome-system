"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { residentAPI, activitiesAPI, photosAPI, staffAPI } from '@/lib/api';
import { carePlansAPI, roomsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

// Update PhotoData interface to match new API
interface PhotoData {
  _id: string;
  resident_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  caption: string;
  activity_type: string;
  tags: string[];
  upload_date: string;
  taken_date?: string;
  staff_notes?: string;
  related_activity_id?: string | null;
  family_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PhotoGalleryPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState('');
  const [filterActivityType, setFilterActivityType] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [residents, setResidents] = useState<Array<any>>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [staffs, setStaffs] = useState<Array<any>>([]);
  const [roomNumbers, setRoomNumbers] = useState<{ [residentId: string]: string }>({});

  // Load photos from API
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Chuẩn bị params lọc nếu có
        const params: any = {};
        if (filterResident) params.resident_id = filterResident;
        if (filterActivityType) params.activity_type = filterActivityType;
        // Có thể thêm params ngày nếu backend hỗ trợ
        // if (filterDateRange !== 'all') params.dateRange = filterDateRange;
        const data = await photosAPI.getAll(params);
        setPhotos(Array.isArray(data) ? data : []);
      } catch (error: any) {
        setPhotos([]);
        setError(error?.message || 'Không thể tải ảnh');
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [filterResident, filterActivityType, filterDateRange]);
   
  // Load residents from API cho dropdown filter
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const data = await residentAPI.getAll();
        setResidents(Array.isArray(data) ? data : []);
      } catch (err) {
        setResidents([]);
      }
    };
    fetchResidents();
  }, []);

  // Load activity types from API
  useEffect(() => {
    const fetchActivityTypes = async () => {
      try {
        const data = await activitiesAPI.getAll();
        // Lấy các activityName duy nhất
        const uniqueTypes = Array.from(new Set((Array.isArray(data) ? data : []).map((a: any) => a.activityName).filter(Boolean)));
        setActivityTypes(uniqueTypes);
      } catch (err) {
        setActivityTypes([]);
      }
    };
    fetchActivityTypes();
  }, []);

  // Load staff từ API cho mapping uploadedBy
  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const data = await staffAPI.getAll();
        setStaffs(Array.isArray(data) ? data : []);
      } catch (err) {
        setStaffs([]);
      }
    };
    fetchStaffs();
  }, []);

  // Lấy số phòng cho từng resident xuất hiện trong gallery
  useEffect(() => {
    const fetchRooms = async () => {
      const residentIds = Array.from(new Set(photos.map((p) => p.resident_id)));
      for (const residentId of residentIds) {
        if (!residentId || roomNumbers[residentId]) continue;
        try {
          const assignments = await carePlansAPI.getByResidentId(residentId);
          const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
          const roomId = assignment?.assigned_room_id;
          if (roomId) {
            const room = await roomsAPI.getById(roomId);
            setRoomNumbers((prev) => ({ ...prev, [residentId]: room?.room_number || 'Chưa cập nhật' }));
          } else {
            setRoomNumbers((prev) => ({ ...prev, [residentId]: 'Chưa cập nhật' }));
          }
        } catch {
          setRoomNumbers((prev) => ({ ...prev, [residentId]: 'Chưa cập nhật' }));
        }
      }
    };
    if (photos.length > 0) fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  useEffect(() => {
    console.log('Modal states:', {showModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showModal;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff', 'family'].includes(String(user.role))) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Filter photos based on criteria
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch =
      (photo.caption && photo.caption.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (getResidentNameByResidentId(photo.resident_id).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (Array.isArray(photo.tags) && photo.tags.some(tag => tag && tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesResident = filterResident === '' || photo.resident_id === filterResident;
    const matchesActivityType = filterActivityType === '' || photo.activity_type === filterActivityType;

    // Date filter
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const photoDate = new Date(photo.upload_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (filterDateRange) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case '3months':
          matchesDate = daysDiff <= 90;
          break;
      }
    }
    // For family users, only show photos with family_id matching user or shared logic if needed
    if (user && String(user.role) === 'family') {
      return matchesSearch && matchesResident && matchesActivityType && matchesDate && (user as any)?.family_id && photo.family_id === (user as any).family_id;
    }
    return matchesSearch && matchesResident && matchesActivityType && matchesDate;
  });

  // Sort photos by upload date (newest first)
  const sortedPhotos = filteredPhotos.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePhotoClick = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setShowModal(true);
    
    // No viewCount in new API, just open modal
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
  };

  // Hàm lấy URL ảnh từ file_path
  const getPhotoUrl = (photo: any) => {
    if (!photo || !photo.file_path) return '/window.svg';
    // Nếu là URL tuyệt đối thì trả về luôn
    if (photo.file_path.startsWith('http')) return photo.file_path;
    // Chuẩn hóa dấu gạch chéo
    const cleanPath = photo.file_path.replace(/\\/g, '/').replace(/"/g, '/');
    // Nếu backend chạy local, sửa lại host cho đúng
    return `http://localhost:8000/${cleanPath.replace(/^\//, '')}`;
  };

  // Hàm lấy tên resident từ resident_id
  const getResidentNameByResidentId = (residentId: string) => {
    const resident = residents.find((r: any) => r._id === residentId);
    return resident ? resident.full_name : 'Không rõ';
  };

  // Hàm lấy tên staff từ uploaded_by
  const getStaffNameById = (staffId: string) => {
    const staff = staffs.find((s: any) => s._id === staffId);
    return staff ? staff.full_name : 'Không rõ';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,rgb(251, 251, 248) 0%,rgb(249, 247, 243) 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem',
            color: 'white'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
              <button
                onClick={() => router.push('/residents')}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </button>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <PhotoIcon style={{width: '2.5rem', height: '2.5rem', color: 'white'}} />
                  <div>
                    <h1 style={{fontSize: '1.8rem', fontWeight: 700, margin: 0}}>
                      Thư viện ảnh
                    </h1>
                    <p style={{fontSize: '0.9rem', margin: '0.5rem 0 0 0', opacity: 0.9}}>
                      Xem lại những khoảnh khắc đáng nhớ của các cụ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{padding: '2rem'}}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
                             {/* Search */}
               <div style={{position: 'relative'}}>
                 <MagnifyingGlassIcon style={{
                   position: 'absolute',
                   left: '0.75rem',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   width: '1.25rem',
                   height: '1.25rem',
                   color: '#9ca3af',
                   zIndex: 1
                 }} />
                 <input
                   type="text"
                   placeholder="Tìm kiếm theo mô tả, tên cụ, tags..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                     borderRadius: '0.75rem',
                     border: '2px solid #e5e7eb',
                     fontSize: '0.95rem',
                     outline: 'none',
                     background: 'white'
                   }}
                 />
               </div>

              {/* Resident Filter */}
              <select
                value={filterResident}
                onChange={(e) => setFilterResident(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              >
                <option value="">Tất cả người cao tuổi</option>
                {residents.map((resident: any) => (
                  <option key={resident._id} value={resident._id}>
                    {resident.full_name} {resident.room ? `- Phòng ${resident.room}` : ''}
                  </option>
                ))}
              </select>

            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              <span>Hiển thị {sortedPhotos.length} / {photos.length} ảnh</span>
              {user?.role !== 'family' && (
                <button
                  onClick={() => router.push('/residents/photos')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Đăng ảnh mới
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        {loading && (
          <div style={{textAlign: 'center', color: '#64748b', margin: '2rem 0'}}>Đang tải ảnh...</div>
        )}
        {error && (
          <div style={{textAlign: 'center', color: '#ef4444', margin: '2rem 0'}}>{error}</div>
        )}
        {sortedPhotos.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <PhotoIcon style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1rem',
              color: '#d1d5db'
            }} />
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0'}}>
              Chưa có ảnh nào
            </h3>
            <p style={{color: '#6b7280', margin: 0}}>
              {photos.length === 0 
                ? 'Chưa có ảnh nào được đăng tải.' 
                : 'Không tìm thấy ảnh nào phù hợp với bộ lọc hiện tại.'
              }
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {sortedPhotos.map((photo) => (
              <div
                key={photo._id}
                onClick={() => handlePhotoClick(photo)}
                
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e5e7eb'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Photo */}
                <div style={{
                  height: '200px',
                  background: `url(${getPhotoUrl(photo)}) center/cover`,
                  position: 'relative'
                }}>
                  
                  
                </div>

                {/* Content */}
                <div style={{padding: '1rem'}}>
                  {/* Info Grid - Cơ bản */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'max-content 1fr',
                    rowGap: '0.25rem',
                    columnGap: '1rem',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '0.5rem'
                  }}>
                    <span style={{fontWeight: 600, color: '#6b7280', fontSize: '0.92rem', textAlign: 'left'}}>Tên:</span>
                    <span style={{fontWeight: 500, color: '#222', fontSize: '1rem'}}>
                      {getResidentNameByResidentId(photo.resident_id)}
                    </span>
                    <span style={{fontWeight: 600, color: '#6b7280', fontSize: '0.92rem', textAlign: 'left'}}>Phòng:</span>
                    <span style={{fontWeight: 500, color: '#222', fontSize: '1rem'}}>{roomNumbers[photo.resident_id] || 'Chưa cập nhật'}</span>
                    <span style={{fontWeight: 600, color: '#6b7280', fontSize: '0.92rem', textAlign: 'left'}}>Hoạt động:</span>
                    <span style={{fontWeight: 500, color: '#222', fontSize: '1rem'}}>{photo.activity_type}</span>
                    <span style={{fontWeight: 600, color: '#6b7280', fontSize: '0.92rem', textAlign: 'left'}}>Đăng bởi:</span>
                    <span style={{fontWeight: 500, color: '#222', fontSize: '1rem'}}>{getStaffNameById(photo.uploaded_by)}</span>
                  </div>

                  {/* Mô tả */}
                  <div style={{margin: '0.5rem 0 0.5rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem'}}>
                    <span style={{fontWeight: 600, color: '#6b7280', fontSize: '0.92rem'}}>Mô tả:</span>
                    <span style={{marginLeft: 8, color: '#374151', fontSize: '0.98rem'}}>{photo.caption}</span>
                  </div>

                  {/* Tags */}
                  {Array.isArray(photo.tags) && photo.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0.5rem 0 0.5rem 0',
                      flexWrap: 'wrap',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '0.5rem'
                    }}>
                      <TagIcon style={{width: '1rem', height: '1rem', color: '#22c55e'}} />
                      <span style={{fontWeight: 600, color: '#6b7280', fontSize: '0.92rem'}}>Tags:</span>
                      {photo.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={tag + '-' + index}
                          style={{
                            background: 'rgba(34, 197, 94, 0.12)',
                            color: '#22c55e',
                            padding: '0.12rem 0.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span style={{
                          color: '#6b7280',
                          fontSize: '0.85rem'
                        }}>
                          +{photo.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.88rem',
                    color: '#94a3b8',
                    marginTop: '0.5rem',
                    gap: '1rem',
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                      <CalendarDaysIcon style={{width: '1rem', height: '1rem'}} />
                      <span style={{fontWeight: 600}}>Ngày đăng:</span>
                      <span style={{color: '#64748b'}}>{formatDate(photo.upload_date)}</span>
                    </div>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Detail Modal */}
        {showModal && selectedPhoto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backdropFilter: 'blur(5px)',
            marginLeft: '120px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '95vh',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* Close Button */}
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '3rem',
                  height: '3rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1001,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <XMarkIcon style={{width: '1.5rem', height: '1.5rem'}} />
              </button>

              {/* Image Section */}
              <div style={{position: 'relative'}}>
                <img
                  src={getPhotoUrl(selectedPhoto)}
                  alt={selectedPhoto.caption}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={e => { e.currentTarget.src = '/window.svg'; }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                  color: 'white',
                  padding: '2rem 2rem 1.5rem 2rem'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: '0 0 0.5rem 0',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}>
                    {getResidentNameByResidentId(selectedPhoto.resident_id)}
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    margin: 0,
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                  }}>
                    {selectedPhoto.caption}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div style={{
                padding: '2rem',
                maxHeight: 'calc(95vh - 400px)',
                overflowY: 'auto'
              }}>
                {/* Thông tin cơ bản */}
                <div style={{
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '1.5rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '2px'
                    }}></div>
                    Thông tin chi tiết
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                      }}>
                        Tên người cao tuổi
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {getResidentNameByResidentId(selectedPhoto.resident_id)}
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                      }}>
                        Số phòng
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        Phòng {roomNumbers[selectedPhoto.resident_id] || 'Chưa cập nhật'}
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                      }}>
                        Loại hoạt động
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {selectedPhoto.activity_type}
                      </div>
                    </div>

                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem'
                      }}>
                        Đăng bởi
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {getStaffNameById(selectedPhoto.uploaded_by)}
                      </div>
                    </div>

                    
                    {/* Chia sẻ với gia đình: Không còn trong API mới, bỏ qua */}
                  </div>
                </div>

                {/* Mô tả */}
                <div style={{
                  background: 'linear-gradient(135deg, #fef7f0 0%, #fed7aa 100%)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #fed7aa'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#ea580c',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '1.5rem',
                      background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      borderRadius: '2px'
                    }}></div>
                    Mô tả chi tiết
                  </h3>
                  <div style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #fed7aa'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#c2410c',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem'
                    }}>
                      Nội dung mô tả
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      lineHeight: '1.6',
                      color: '#1e293b'
                    }}>
                      {selectedPhoto.caption}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {Array.isArray(selectedPhoto.tags) && selectedPhoto.tags.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#15803d',
                      margin: '0 0 1rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '1.5rem',
                        background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                        borderRadius: '2px'
                      }}></div>
                      Thẻ tags
                    </h3>
                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#15803d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem'
                      }}>
                        Các thẻ đính kèm
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {selectedPhoto.tags.map((tag, index) => (
                          <span
                            key={tag + '-' + index}
                            style={{
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '2rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff Notes */}
                {selectedPhoto.staff_notes && String(user?.role) !== 'family' && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid #fef08a'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#ca8a04',
                      margin: '0 0 1rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '1.5rem',
                        background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                        borderRadius: '2px'
                      }}></div>
                      Ghi chú nhân viên
                    </h3>
                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #fef08a'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#ca8a04',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        Ghi chú nội bộ
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontStyle: 'italic',
                        lineHeight: '1.6',
                        color: '#1e293b'
                      }}>
                        {selectedPhoto.staff_notes}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}