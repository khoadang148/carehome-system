"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
  UserIcon,
  CameraIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { residentAPI, userAPI, carePlansAPI, roomsAPI } from '@/lib/api';

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return undefined;
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) return avatarPath;
  
  // If it's a base64 data URL, return as is
  if (avatarPath.startsWith('data:')) return avatarPath;
  
  // Convert relative path to full URL
  return userAPI.getAvatarUrl(avatarPath);
};

// Family members data (matching family page)
const familyMembers = [
  { 
    id: 1, 
    name: 'Nguyễn Văn Nam', 
    room: 'A01', 
    age: 78,
    relationship: 'Cha',
    status: 'Ổn định'
  },
  { 
    id: 2, 
    name: 'Lê Thị Hoa', 
    room: 'A02', 
    age: 75,
    relationship: 'Mẹ',
    status: 'Khá'
  }
];



export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  // --- Thay familyMembers thành residents động từ API ---
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa cập nhật');
  const [roomLoading, setRoomLoading] = useState(false);

  // Static profile data
  // const profileData = { ... } // Xoá hoặc comment dòng này
  const [userData, setUserData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      userAPI.getAuthProfile()
        .then(data => {
          setUserData(data);
          setProfileError('');
          if (data.avatar) setAvatarImage(data.avatar);
        })
        .catch(() => setProfileError('Không lấy được thông tin tài khoản'))
        .finally(() => setProfileLoading(false));
    }
  }, [user]);

    // File validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Chỉ hỗ trợ file ảnh định dạng JPG, PNG, WEBP';
    }

    if (file.size > maxSize) {
      return 'Kích thước file không được vượt quá 10MB';
    }

    return null;
  };

    // Handle file selection
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('Image loaded:', result?.substring(0, 50) + '...');
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Simulate upload with progress
  const simulateUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setUploadProgress(i);
    }

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (selectedFile && user?.id) {
      try {
        // Gọi API upload avatar với file gốc
        const response = await userAPI.updateAvatar(user.id, selectedFile);
        console.log('Avatar upload response:', response);
        
        // Cập nhật avatar image với đường dẫn mới từ response
        if (response.avatar) {
          setAvatarImage(response.avatar);
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
        const errorMessage = (err as Error)?.message || 'Lỗi khi cập nhật ảnh đại diện.';
        
        // Kiểm tra nếu là lỗi 403 (Forbidden) - có thể family members không có quyền
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          setUploadError('Tài khoản của bạn không có quyền thay đổi ảnh đại diện. Vui lòng liên hệ quản trị viên.');
        } else {
          setUploadError(errorMessage);
        }
        
        setIsUploading(false);
        return;
      }
    }
    
    setIsUploading(false);
    setShowUploadModal(false);
    resetUploadState();
    
    console.log('Avatar uploaded successfully:', selectedFile?.name);
  };

  // Reset upload state
  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open upload modal
  const openUploadModal = () => {
    setShowUploadModal(true);
    resetUploadState();
  };

  // Close upload modal
  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
  };

  // Lấy residents động theo user.id nếu là family
  useEffect(() => {
    if (user?.role === 'family' && user?.id) {
      setLoading(true);
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr);
          setSelectedResidentId(arr.length > 0 ? arr[0]._id : "");
          setError('');
        })
        .catch((err) => {
          setError('Không tìm thấy thông tin người thân hoặc lỗi kết nối API.');
          setResidents([]);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Lấy resident đang chọn
  const selectedResident = residents.find(r => r._id === selectedResidentId);

  useEffect(() => {
    if (!selectedResidentId) {
      setRoomNumber('Chưa cập nhật');
      return;
    }
    setRoomLoading(true);
    carePlansAPI.getByResidentId(selectedResidentId)
      .then((assignments: any[]) => {
        const assignment = Array.isArray(assignments) ? assignments.find(a => a.assigned_room_id) : null;
        const roomId = assignment?.assigned_room_id;
        if (roomId) {
          return roomsAPI.getById(roomId)
            .then((room: any) => {
              setRoomNumber(room?.room_number || 'Chưa cập nhật');
            })
            .catch(() => setRoomNumber('Chưa cập nhật'));
        } else {
          setRoomNumber('Chưa cập nhật');
        }
      })
      .catch(() => setRoomNumber('Chưa cập nhật'))
      .finally(() => setRoomLoading(false));
  }, [selectedResidentId]);


  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
       <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>

        <div style={{
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '1.5rem',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)'
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
  <div style={{
      width: '3rem',
      height: '3rem',
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
  }}>
      <UserIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
    </div>
    <div>
      <h1 style={{
        fontSize: '1.8rem',
        fontWeight: '800',
        color: '#4f46e5',
        margin: '0',
        letterSpacing: '-0.025em',
        lineHeight: '1.2'
      }}>
        Hồ sơ cá nhân
      </h1>
      <p style={{
        fontSize: '0.9rem',
        color: '#64748b',
        margin: '0.75rem 0 0 0',
        fontWeight: '500',
        letterSpacing: '0.01em'
      }}>
        Thông tin tài khoản và cài đặt cá nhân
      </p>
    </div>
  </div>
</div>

        {/* Profile Card */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Avatar & Basic Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              position: 'relative',
              flexShrink: 0
          }}>
                          <div style={{
                width: '5rem',
                height: '5rem',
                borderRadius: '1rem',
                backgroundImage: !avatarImage ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 700,
                border: avatarImage ? '2px solid #e5e7eb' : 'none',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {avatarImage && getAvatarUrl(avatarImage) ? (
                  <img 
                    src={getAvatarUrl(avatarImage)!}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      borderRadius: '1rem'
                    }}
                  />
                ) : (
                  userData?.full_name?.substring(0, 2).toUpperCase() || 'ND'
                )}
                {isUploading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '1rem',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    zIndex: 10
                  }}>
                    Đang tải...
                  </div>
                )}
              </div>
              
              {/* Upload button */}
              <button
                onClick={openUploadModal}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  bottom: '-0.25rem',
                  right: '-0.25rem',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: '#6366f1',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.2s',
                  opacity: isUploading ? 0.6 : 1
                }}
                onMouseOver={(e) => !isUploading && (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseOut={(e) => !isUploading && (e.currentTarget.style.transform = 'scale(1)')}
                title="Thay đổi ảnh đại diện"
              >
                <CameraIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </button>
              </div>
              
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                margin: '0'
              }}>
                {userData?.full_name || ''}
              </h2>
            </div>
          </div>

          {/* Nếu là admin chỉ hiển thị 4 trường */}
          {userData?.role === 'admin' ? (
            <div style={{
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.25rem', 
              maxWidth: 600,
              margin: '0 auto'
            }}>
              <div>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Họ tên
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  fontWeight: 600
                }}>
                  <UserIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                  {userData.full_name}
                </div>
              </div>
              <div>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  fontWeight: 600
                }}>
                  <EnvelopeIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                  {userData.email}
                </div>
              </div>
              <div>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Số điện thoại
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  fontWeight: 600
                }}>
                  <PhoneIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                  {userData.phone}
                </div>
              </div>
              <div>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Username
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  fontWeight: 600
                }}>
                  <UserCircleIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                  {userData.username}
                </div>
              </div>
            </div>
          ) : (
            
            <>
          {/* Information Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Contact Info */}
            <div>
            <h3 style={{
                fontSize: '1rem',
              fontWeight: 600,
                color: '#374151',
                margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
                <EnvelopeIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
              Thông tin liên hệ
            </h3>

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Email
                </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <EnvelopeIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                    {userData?.email}
                  </div>
              </div>

              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Số điện thoại
                </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <PhoneIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                    {userData?.phone}
                  </div>
              </div>

              <div>
                <label style={{
                    fontSize: '0.75rem',
                  fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    display: 'block'
                }}>
                  Địa chỉ
                </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <MapPinIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                    {userData?.address}
                  </div>
              </div>

             
              </div>
            </div>

            {/* Role-specific Info */}
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {user && user.role === 'family' ? (
                  <>
                    <UserCircleIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
                    Thông tin người thân
                  </>
                ) : (
                  <>
                    <BriefcaseIcon style={{width: '1.125rem', height: '1.125rem', color: '#6366f1'}} />
                    Thông tin công việc
                  </>
                )}
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {user && user.role === 'family' ? (
                  <>
                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Người thân được chăm sóc
                      </label>
                      {loading ? (
                        <div>Đang tải thông tin người thân...</div>
                      ) : error ? (
                        <div style={{color: 'red'}}>{error}</div>
                      ) : residents.length > 1 ? (
                        <div>
                          <select
                            value={selectedResidentId}
                            onChange={e => setSelectedResidentId(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              backgroundColor: 'white',
                              marginBottom: '0.5rem'
                            }}
                          >
                            {residents.map(member => (
                              <option key={member._id} value={member._id}>
                                     {member.full_name}
                              </option>
                            ))}
                          </select>
                          {selectedResident && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              Phòng {roomLoading ? 'Đang tải...' : roomNumber} • {selectedResident.date_of_birth ? (() => {
                                const dob = new Date(selectedResident.date_of_birth);
                                if (!isNaN(dob.getTime())) {
                                  const today = new Date();
                                  let age = today.getFullYear() - dob.getFullYear();
                                  const m = today.getMonth() - dob.getMonth();
                                  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                                    age--;
                                  }
                                  return age + ' tuổi';
                                }
                                return '-- tuổi';
                              })() : '-- tuổi'}
                            </div>
                          )}
                        </div>
                      ) : residents.length === 1 && selectedResident ? (
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: 500
                          }}>
                            {selectedResident.fullName || 'Chưa được phân công'}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            Phòng {selectedResident.room || 'Chưa cập nhật'} • {selectedResident.date_of_birth ? (() => {
                                const dob = new Date(selectedResident.date_of_birth);
                                if (!isNaN(dob.getTime())) {
                                  const today = new Date();
                                  let age = today.getFullYear() - dob.getFullYear();
                                  const m = today.getMonth() - dob.getMonth();
                                  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                                    age--;
                                  }
                                  return age + ' tuổi';
                                }
                                return '-- tuổi';
                              })() : '-- tuổi'}
                          </div>
                        </div>
                      ) : (
                        <div>Không có dữ liệu người thân.</div>
                      )}
                    </div>
                  </>
                ) : (
                  // Chỉ hiển thị thông tin công việc cho role khác family
                  <>
                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Phòng ban
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>
                        <BriefcaseIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                        {userData?.department}
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                        display: 'block'
                      }}>
                        Ngày bắt đầu
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>
                        <CalendarIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                        {userData?.startDate ? new Date(userData.startDate).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0
                }}>
                  Thay đổi ảnh đại diện
                </h3>
                <button
                  onClick={closeUploadModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    color: '#6b7280'
                  }}
                >
                  <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>
              </div>

              {/* Upload Area */}
              {!previewUrl && (
                <div
                  onDragEnter={handleDragIn}
                  onDragLeave={handleDragOut}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragActive ? '#6366f1' : '#d1d5db'}`,
                    borderRadius: '0.75rem',
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: dragActive ? '#f0f0ff' : '#f9fafb',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ArrowUpTrayIcon style={{
                    width: '3rem',
                    height: '3rem',
                    color: dragActive ? '#6366f1' : '#9ca3af',
                    margin: '0 auto 1rem'
                  }} />
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#374151',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {dragActive ? 'Thả file ảnh vào đây' : 'Kéo thả ảnh hoặc click để chọn'}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                </div>
              )}

              {/* Preview Area */}
              {previewUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#374151',
                    margin: '0 0 1rem 0'
                  }}>
                    Xem trước
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                                         backgroundColor: '#f9fafb',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      borderRadius: '50%',
                                           backgroundImage: `url(${previewUrl})`,
                     backgroundSize: 'cover',
                     backgroundPosition: 'center center',
                     backgroundRepeat: 'no-repeat',
                      border: '2px solid #e5e7eb'
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#111827',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {selectedFile?.name}
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={resetUploadState}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        color: '#ef4444'
                      }}
                    >
                      <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                                     backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                  <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                    {uploadError}
                  </span>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                      Đang tải lên...
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '0.5rem',
                                         backgroundColor: '#e5e7eb',
                    borderRadius: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                                             backgroundImage: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={closeUploadModal}
                  disabled={isUploading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                                       border: '1px solid #d1d5db',
                   backgroundColor: 'white',
                   color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    opacity: isUploading ? 0.6 : 1
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={simulateUpload}
                  disabled={!selectedFile || isUploading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: (!selectedFile || isUploading) ? '#9ca3af' : '#6366f1',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isUploading ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <CheckIcon style={{ width: '1rem', height: '1rem' }} />
                      Xác nhận
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 

