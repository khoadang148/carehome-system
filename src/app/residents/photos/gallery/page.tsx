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
import { RESIDENTS_DATA } from '@/lib/data/residents-data';
import { useAuth } from '@/lib/contexts/auth-context';

interface PhotoData {
  id: number;
  url: string;
  fileName: string;
  fileSize: number;
  caption: string;
  activityType: string;
  staffNotes: string;
  tags: string[];
  residentId: string;
  residentName: string;
  residentRoom: string;
  uploadDate: string;
  uploadedBy: string;
  uploadedByRole: string;
  shareWithFamily: boolean;
  reviewStatus: string;
  approvedBy: string | null;
  approvedDate: string | null;
  viewCount: number;
  familyViewed: boolean;
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

  // Load photos from localStorage
  useEffect(() => {
    const savedPhotos = localStorage.getItem('uploadedPhotos');
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos);
        setPhotos(parsedPhotos);
      } catch (error) {
        console.error('Error parsing saved photos:', error);
        setPhotos([]);
      }
    }
  }, []);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff', 'family'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const ACTIVITY_TYPES = [
    'Hoạt động thể chất',
    'Hoạt động tinh thần',
    'Bữa ăn',
    'Y tế/Chăm sóc',
    'Hoạt động xã hội',
    'Giải trí',
    'Học tập',
    'Thăm viếng gia đình',
    'Sinh nhật/Lễ hội',
    'Khác'
  ];

  // Filter photos based on criteria
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesResident = filterResident === '' || photo.residentId === filterResident;
    
    const matchesActivityType = filterActivityType === '' || photo.activityType === filterActivityType;

    // Date filter
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const photoDate = new Date(photo.uploadDate);
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

    // For family users, only show photos shared with family
    if (user?.role === 'family') {
      return matchesSearch && matchesResident && matchesActivityType && matchesDate && photo.shareWithFamily;
    }

    return matchesSearch && matchesResident && matchesActivityType && matchesDate;
  });

  // Sort photos by upload date (newest first)
  const sortedPhotos = filteredPhotos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

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
    
    // Update view count
    const updatedPhotos = photos.map(p => 
      p.id === photo.id ? { ...p, viewCount: p.viewCount + 1 } : p
    );
    setPhotos(updatedPhotos);
    localStorage.setItem('uploadedPhotos', JSON.stringify(updatedPhotos));
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
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
                {RESIDENTS_DATA.map(resident => (
                  <option key={resident.id} value={resident.id.toString()}>
                    {resident.name} - Phòng {resident.room}
                  </option>
                ))}
              </select>

              {/* Activity Type Filter */}
              <select
                value={filterActivityType}
                onChange={(e) => setFilterActivityType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              >
                <option value="">Tất cả hoạt động</option>
                {ACTIVITY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
                <option value="3months">3 tháng qua</option>
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
                key={photo.id}
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
                  background: `url(${photo.url}) center/cover`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 600

                  }}>
                    <EyeIcon style={{width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '0.25rem'}} />
                    {photo.viewCount}
                  </div>
                  {photo.shareWithFamily && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      background: 'rgba(34, 197, 94, 0.9)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      👨‍👩‍👧‍👦 Gia đình
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{padding: '1rem'}}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#374151',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {photo.residentName}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        Phòng {photo.residentRoom}
                      </p>
                    </div>
                    <span style={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {photo.activityType}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    margin: '0 0 0.75rem 0',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {photo.caption}
                  </p>

                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem',
                      marginBottom: '0.75rem'
                    }}>
                      {photo.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span style={{
                          color: '#6b7280',
                          fontSize: '0.75rem'
                        }}>
                          +{photo.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.375rem'}}>
                      <CalendarDaysIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {formatDate(photo.uploadDate)}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.375rem'}}>
                      <UserIcon style={{width: '0.875rem', height: '0.875rem'}} />
                      {photo.uploadedBy}
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
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}>
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1001
                }}
              >
                <XMarkIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </button>

              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '1rem 1rem 0 0'
                }}
              />

              <div style={{padding: '2rem'}}>
                <div style={{marginBottom: '1.5rem'}}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#374151',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {selectedPhoto.residentName}
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Phòng {selectedPhoto.residentRoom} • {selectedPhoto.activityType}
                  </p>
                </div>

                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#374151',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Mô tả hoạt động
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#374151',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {selectedPhoto.caption}
                  </p>
                </div>

                {selectedPhoto.tags.length > 0 && (
                  <div style={{marginBottom: '1.5rem'}}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Tags cảm xúc
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {selectedPhoto.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPhoto.staffNotes && user?.role !== 'family' && (
                  <div style={{marginBottom: '1.5rem'}}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Ghi chú nhân viên
                    </h3>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#6b7280',
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      {selectedPhoto.staffNotes}
                    </p>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <div>
                    <strong>Ngày đăng:</strong><br />
                    {formatDate(selectedPhoto.uploadDate)}
                  </div>
                  <div>
                    <strong>Đăng bởi:</strong><br />
                    {selectedPhoto.uploadedBy}
                  </div>
                  <div>
                    <strong>Lượt xem:</strong><br />
                    {selectedPhoto.viewCount}
                  </div>
                  <div>
                    <strong>Chia sẻ gia đình:</strong><br />
                    {selectedPhoto.shareWithFamily ? '✅ Có' : '❌ Không'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}