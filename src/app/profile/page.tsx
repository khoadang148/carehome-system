"use client";

import { useState, useRef, useCallback } from 'react';
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
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(familyMembers[0]);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Static profile data
  const profileData = {
    name: user?.name || '',
    email: user?.email || '',
    phone: '+84 123 456 789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    dateOfBirth: '1985-06-15',
    department: user?.role === 'staff' ? 'Chăm sóc bệnh nhân' : '',
    startDate: '2020-01-15',
    relationship: user?.role === 'family' ? 'Con' : '',
  };

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
    
    if (previewUrl) {
      setAvatarImage(previewUrl);
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
                {avatarImage ? (
                  <img 
                    src={avatarImage}
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
                  user?.name?.substring(0, 2).toUpperCase() || 'ND'
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
                {profileData.name}
              </h2>
            </div>
          </div>

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
                    {profileData.email}
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
                    {profileData.phone}
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
                    {profileData.address}
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
                  Ngày sinh
                </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>
                      <CalendarIcon style={{width: '0.875rem', height: '0.875rem', color: '#9ca3af'}} />
                    {new Date(profileData.dateOfBirth).toLocaleDateString('vi-VN')}
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
                {user?.role === 'family' ? (
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
                {user?.role === 'family' ? (
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
                      
                      {familyMembers.length > 1 ? (
                        <div>
                          <select
                            value={selectedFamilyMember.id}
                            onChange={(e) => {
                              const member = familyMembers.find(m => m.id === parseInt(e.target.value));
                              if (member) setSelectedFamilyMember(member);
                            }}
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
                            {familyMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.relationship})
                              </option>
                            ))}
                          </select>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            Phòng {selectedFamilyMember.room} • {selectedFamilyMember.age} tuổi • {selectedFamilyMember.status}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#111827',
                            fontWeight: 500
                          }}>
                            {selectedFamilyMember?.name || 'Chưa được phân công'}
                          </div>
                          {selectedFamilyMember && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginTop: '0.25rem'
                            }}>
                              Phòng {selectedFamilyMember.room} • {selectedFamilyMember.age} tuổi • {selectedFamilyMember.status}
                            </div>
                          )}
                        </div>
                      )}
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
                        Mối quan hệ
                      </label>
                        <div style={{
                          fontSize: '0.875rem',
                      color: '#111827'
                        }}>
                      {profileData.relationship}
                        </div>
                    </div>
                  </>
                ) : (
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
                      {profileData.department}
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
                        {new Date(profileData.startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
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

