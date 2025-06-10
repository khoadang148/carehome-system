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
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { RESIDENTS_DATA } from '@/lib/residents-data';
import { useAuth } from '@/lib/auth-context';

export default function ResidentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check access permissions
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCareLevel, setFilterCareLevel] = useState('');
  const [residentsData, setResidentsData] = useState(RESIDENTS_DATA);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<number | null>(null);
  
  // Photo upload states with professional validation
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedResident, setSelectedResident] = useState('');
  const [activityType, setActivityType] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [photoTags, setPhotoTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [shareWithFamily, setShareWithFamily] = useState(true);
  
  // Professional constants for nursing home operations
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
  const MAX_FILES_COUNT = 10;
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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
  const PHOTO_TAGS = [
    'Vui vẻ', 'Khỏe mạnh', 'Tích cực', 'Hợp tác', 'Sáng tạo',
    'Thân thiện', 'Năng động', 'Tập trung', 'Hạnh phúc', 'An toàn'
  ];
  
  // Load residents from localStorage when component mounts
  useEffect(() => {
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      try {
        const parsedResidents = JSON.parse(savedResidents);
        const updatedResidents = parsedResidents.map((resident: any) => ({
          ...resident,
          careLevel: resident.careLevel === 'High' ? 'Cao cấp' : 
                    resident.careLevel === 'Medium' ? 'Nâng cao' : 
                    resident.careLevel === 'Low' ? 'Cơ bản' : 
                    resident.careLevel
        }));
        setResidentsData(updatedResidents);
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
      } catch (error) {
        console.error('Error parsing saved residents data:', error);
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
        setResidentsData(RESIDENTS_DATA);
      }
    } else {
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
    }
  }, []);
  
  // Professional validation functions
  const validateFiles = (files: File[]): {isValid: boolean, errors: string[]} => {
    const errors: string[] = [];
    
    // Check file count
    if (files.length === 0) {
      errors.push('Vui lòng chọn ít nhất 1 ảnh');
    } else if (files.length > MAX_FILES_COUNT) {
      errors.push(`Tối đa ${MAX_FILES_COUNT} ảnh mỗi lần tải lên`);
    }
    
    // Check individual files
    files.forEach((file, index) => {
      // File size validation
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Ảnh "${file.name}" quá lớn (tối đa 10MB)`);
      }
      
      // File format validation
      if (!ALLOWED_FORMATS.includes(file.type)) {
        errors.push(`Ảnh "${file.name}" không đúng định dạng (chỉ chấp nhận JPG, PNG, WebP)`);
      }
      
      // File name validation (nursing home security)
      if (file.name.length > 100) {
        errors.push(`Tên file "${file.name}" quá dài (tối đa 100 ký tự)`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Resident selection
    if (!selectedResident) {
      errors.selectedResident = 'Vui lòng chọn cư dân';
    }
    
    // Activity type
    if (!activityType) {
      errors.activityType = 'Vui lòng chọn loại hoạt động';
    }
    
    // Description validation
    if (!photoDescription.trim()) {
      errors.photoDescription = 'Vui lòng nhập mô tả hoạt động';
    } else if (photoDescription.trim().length < 10) {
      errors.photoDescription = 'Mô tả phải có ít nhất 10 ký tự';
    } else if (photoDescription.trim().length > 500) {
      errors.photoDescription = 'Mô tả không được vượt quá 500 ký tự';
    }
    
    // Staff notes validation
    if (staffNotes.length > 300) {
      errors.staffNotes = 'Ghi chú nhân viên không được vượt quá 300 ký tự';
    }
    
    // Files validation
    const fileValidation = validateFiles(selectedFiles);
    if (!fileValidation.isValid) {
      errors.files = fileValidation.errors.join('; ');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle photo upload with professional validation
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files immediately
    const validation = validateFiles(files);
    if (validation.isValid) {
      setSelectedFiles(files);
      setValidationErrors(prev => ({...prev, files: ''}));
    } else {
      setValidationErrors(prev => ({...prev, files: validation.errors.join('; ')}));
      // Clear the input
      event.target.value = '';
    }
  };

  const handleUploadPhotos = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resident = residentsData.find(r => r.id.toString() === selectedResident);
      const currentTime = new Date().toISOString();

      const newPhotos = selectedFiles.map((file, index) => ({
        id: Date.now() + index,
        url: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        caption: photoDescription.trim(),
        activityType,
        staffNotes: staffNotes.trim(),
        tags: photoTags,
        residentId: selectedResident,
        residentName: resident?.name || '',
        residentRoom: resident?.room || '',
        uploadDate: currentTime,
        uploadedBy: user?.name || 'Nhân viên',
        uploadedByRole: user?.role || 'staff',
        shareWithFamily,
        // Business logic fields
        reviewStatus: 'pending', // For supervisor review
        approvedBy: null,
        approvedDate: null,
        viewCount: 0,
        familyViewed: false
      }));

      // Save to localStorage with professional structure
      const savedPhotos = localStorage.getItem('uploadedPhotos');
      const existingPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
      const updatedPhotos = [...existingPhotos, ...newPhotos];
      localStorage.setItem('uploadedPhotos', JSON.stringify(updatedPhotos));

      // Complete progress
      setUploadProgress(100);
      
      // Wait a bit to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset form
      setSelectedFiles([]);
      setPhotoDescription('');
      setSelectedResident('');
      setActivityType('');
      setStaffNotes('');
      setPhotoTags([]);
      setValidationErrors({});
      setShowUploadModal(false);

      alert(`✅ Đã tải lên ${newPhotos.length} ảnh thành công! ${shareWithFamily ? 'Gia đình sẽ được thông báo.' : ''}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Có lỗi xảy ra khi tải ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper functions
  const handleTagToggle = (tag: string) => {
    setPhotoTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const resetUploadForm = () => {
    setSelectedFiles([]);
    setPhotoDescription('');
    setSelectedResident('');
    setActivityType('');
    setStaffNotes('');
    setPhotoTags([]);
    setValidationErrors({});
    setShareWithFamily(true);
  };
  
  // Filter residents based on search term and care level filter
  const filteredResidents = residentsData.filter((resident) => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resident.room.includes(searchTerm);
    
    const matchesCareLevel = filterCareLevel === '' || 
                            (filterCareLevel === 'CHUA_DANG_KY' && !resident.careLevel) ||
                            resident.careLevel === filterCareLevel;
    
    return matchesSearch && matchesCareLevel;
  });
  
  // Handle view resident details
  const handleViewResident = (residentId: number) => {
    router.push(`/residents/${residentId}`);
  };
  
  // Handle edit resident
  const handleEditResident = (residentId: number) => {
    router.push(`/residents/${residentId}/edit`);
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
                  Quản lý Cư dân
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
            
            <div style={{display: 'flex', gap: '1rem'}}>
              <button
                onClick={() => setShowUploadModal(true)}
                title="Đăng tải ảnh hoạt động của cư dân để chia sẻ với gia đình"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                }}
              >
                <PhotoIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Đăng ảnh cư dân
              </button>

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
                Thêm cư dân mới
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

            {/* Care Level Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Gói chăm sóc
              </label>
              <div style={{position: 'relative'}}>
                <select
                  value={filterCareLevel}
                  onChange={(e) => setFilterCareLevel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    background: 'white',
                    appearance: 'none'
                  }}
                >
                  <option value="">Tất cả gói</option>
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Nâng cao">Nâng cao</option>
                  <option value="Cao cấp">Cao cấp</option>
                  <option value="CHUA_DANG_KY">Chưa đăng ký</option>
                </select>
                <FunnelIcon style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af',
                  pointerEvents: 'none'
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
                    Gói chăm sóc
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
                          fontSize: '0.875rem'
                        }}>
                          {resident.name.charAt(0)}
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
                        {resident.room}
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
                      {resident.careLevel ? (
                        <span style={{
                          background: resident.careLevel === 'Cao cấp' ? 'rgba(139, 92, 246, 0.1)' :
                                     resident.careLevel === 'Nâng cao' ? 'rgba(59, 130, 246, 0.1)' : 
                                     'rgba(245, 158, 11, 0.1)',
                          color: resident.careLevel === 'Cao cấp' ? '#8b5cf6' :
                                 resident.careLevel === 'Nâng cao' ? '#3b82f6' : 
                                 '#f59e0b',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {resident.careLevel}
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(107, 114, 128, 0.1)',
                          color: '#6b7280',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          Chưa đăng ký
                        </span>
                      )}
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
                        <button
                          onClick={() => handleEditResident(resident.id)}
                          title="Chỉnh sửa thông tin cư dân"
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
                        <button
                          onClick={() => handleDeleteClick(resident.id)}
                          title="Xóa cư dân khỏi hệ thống"
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
                Không tìm thấy cư dân
              </h3>
              <p style={{margin: 0, fontSize: '0.875rem'}}>
                Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(15px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '0',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '2rem',
              borderRadius: '1.5rem 1.5rem 0 0',
              color: 'white'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <h3 style={{fontSize: '1.5rem', fontWeight: 700, margin: 0}}>
                    📸 Đăng ảnh hoạt động cư dân
                  </h3>
                  <p style={{fontSize: '0.95rem', margin: '0.5rem 0 0 0', opacity: 0.9}}>
                    Ghi lại những khoảnh khắc đáng nhớ và chia sẻ với gia đình
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetUploadForm();
                    setShowUploadModal(false);
                  }}
                  style={{
                    padding: '0.75rem',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <XMarkIcon style={{width: '1.25rem', height: '1.25rem'}} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div style={{padding: '2rem'}}>
              {/* Resident Selection */}
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Chọn cư dân <span style={{color: '#ef4444'}}>*</span>
                </label>
                <select
                  value={selectedResident}
                  onChange={(e) => {
                    setSelectedResident(e.target.value);
                    setValidationErrors(prev => ({...prev, selectedResident: ''}));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${validationErrors.selectedResident ? '#ef4444' : '#e5e7eb'}`,
                    fontSize: '0.95rem',
                    background: validationErrors.selectedResident ? '#fef2f2' : 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <option value="">Chọn cư dân...</option>
                  {residentsData.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} - Phòng {resident.room} ({resident.careLevel || 'Chưa có gói'})
                    </option>
                  ))}
                </select>
                {validationErrors.selectedResident && (
                  <p style={{color: '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: 500}}>
                    {validationErrors.selectedResident}
                  </p>
                )}
              </div>

              {/* Activity Type */}
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Loại hoạt động <span style={{color: '#ef4444'}}>*</span>
                </label>
                <select
                  value={activityType}
                  onChange={(e) => {
                    setActivityType(e.target.value);
                    setValidationErrors(prev => ({...prev, activityType: ''}));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${validationErrors.activityType ? '#ef4444' : '#e5e7eb'}`,
                    fontSize: '0.95rem',
                    background: validationErrors.activityType ? '#fef2f2' : 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <option value="">Chọn loại hoạt động...</option>
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {validationErrors.activityType && (
                  <p style={{color: '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: 500}}>
                    {validationErrors.activityType}
                  </p>
                )}
              </div>

              {/* Description */}
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Mô tả hoạt động <span style={{color: '#ef4444'}}>*</span>
                  <span style={{fontSize: '0.8rem', color: '#6b7280', fontWeight: 400}}>
                    ({photoDescription.length}/500 ký tự)
                  </span>
                </label>
                <textarea
                  value={photoDescription}
                  onChange={(e) => {
                    setPhotoDescription(e.target.value);
                    setValidationErrors(prev => ({...prev, photoDescription: ''}));
                  }}
                  placeholder="VD: Cô Lan tham gia hoạt động thể dục buổi sáng với các bạn, rất vui vẻ và tích cực..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${validationErrors.photoDescription ? '#ef4444' : '#e5e7eb'}`,
                    fontSize: '0.95rem',
                    background: validationErrors.photoDescription ? '#fef2f2' : 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                />
                {validationErrors.photoDescription && (
                  <p style={{color: '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: 500}}>
                    {validationErrors.photoDescription}
                  </p>
                )}
              </div>

              {/* Photo Tags */}
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.75rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Trạng thái cư dân (chọn nhiều)
                </label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                  {PHOTO_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '1.5rem',
                        border: 'none',
                        background: photoTags.includes(tag) 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : '#f3f4f6',
                        color: photoTags.includes(tag) ? 'white' : '#6b7280',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Notes */}
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Ghi chú nhân viên
                  <span style={{fontSize: '0.8rem', color: '#6b7280', fontWeight: 400}}>
                    ({staffNotes.length}/300 ký tự)
                  </span>
                </label>
                <textarea
                  value={staffNotes}
                  onChange={(e) => {
                    setStaffNotes(e.target.value);
                    setValidationErrors(prev => ({...prev, staffNotes: ''}));
                  }}
                  placeholder="Ghi chú riêng cho nhân viên khác, gia đình sẽ không thấy..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${validationErrors.staffNotes ? '#ef4444' : '#e5e7eb'}`,
                    fontSize: '0.95rem',
                    background: validationErrors.staffNotes ? '#fef2f2' : 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                />
                {validationErrors.staffNotes && (
                  <p style={{color: '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: 500}}>
                    {validationErrors.staffNotes}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div style={{marginBottom: '1.5rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Chọn ảnh <span style={{color: '#ef4444'}}>*</span>
                  <span style={{fontSize: '0.8rem', color: '#6b7280', fontWeight: 400}}>
                    (Tối đa {MAX_FILES_COUNT} ảnh, mỗi ảnh ≤ 10MB, JPG/PNG/WebP)
                  </span>
                </label>
                <div style={{
                  border: `2px dashed ${validationErrors.files ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: validationErrors.files ? '#fef2f2' : 'white'
                }}
                onClick={() => document.getElementById('fileInput')?.click()}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = validationErrors.files ? '#ef4444' : '#667eea';
                  e.currentTarget.style.background = validationErrors.files ? '#fef2f2' : 'rgba(102, 126, 234, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = validationErrors.files ? '#ef4444' : '#d1d5db';
                  e.currentTarget.style.background = validationErrors.files ? '#fef2f2' : 'white';
                }}
                >
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    style={{display: 'none'}}
                  />
                  <CloudArrowUpIcon style={{
                    width: '3rem', 
                    height: '3rem', 
                    margin: '0 auto 1rem', 
                    color: validationErrors.files ? '#ef4444' : '#9ca3af'
                  }} />
                  <div>
                    <p style={{
                      color: validationErrors.files ? '#ef4444' : '#6b7280', 
                      margin: 0, 
                      fontSize: '1rem',
                      fontWeight: 600
                    }}>
                      {selectedFiles.length > 0 
                        ? `✅ Đã chọn ${selectedFiles.length} ảnh` 
                        : 'Click để chọn ảnh'
                      }
                    </p>
                    <p style={{
                      color: '#9ca3af', 
                      margin: '0.5rem 0 0 0', 
                      fontSize: '0.85rem'
                    }}>
                      Kéo thả ảnh vào đây hoặc click để chọn
                    </p>
                  </div>
                </div>
                {validationErrors.files && (
                  <p style={{color: '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: 500}}>
                    {validationErrors.files}
                  </p>
                )}
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <p style={{fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem'}}>
                    📎 Ảnh đã chọn ({selectedFiles.length}):
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    {selectedFiles.map((file, index) => (
                      <div key={index} style={{
                        background: 'white',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '0.5rem',
                          margin: '0 auto 0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.5rem'
                        }}>
                          📷
                        </div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#374151',
                          margin: 0,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </p>
                        <p style={{
                          fontSize: '0.7rem',
                          color: '#9ca3af',
                          margin: '0.25rem 0 0 0'
                        }}>
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share with Family Toggle */}
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={shareWithFamily}
                    onChange={(e) => setShareWithFamily(e.target.checked)}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      accentColor: '#10b981'
                    }}
                  />
                  <div>
                    <div>📱 Chia sẻ với gia đình</div>
                    <div style={{fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem'}}>
                      Gia đình sẽ nhận được thông báo và có thể xem ảnh này
                    </div>
                  </div>
                </label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem'}}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      borderTopColor: '#667eea',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{fontSize: '0.95rem', fontWeight: 600, color: '#667eea'}}>
                      Đang tải ảnh lên... {uploadProgress}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '0.5rem',
                    background: '#e5e7eb',
                    borderRadius: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      transition: 'width 0.3s ease',
                      borderRadius: '0.25rem'
                    }} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => {
                    resetUploadForm();
                    setShowUploadModal(false);
                  }}
                  disabled={isUploading}
                  style={{
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    color: '#6b7280',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    opacity: isUploading ? 0.5 : 1
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUploadPhotos}
                  disabled={isUploading || Object.values(validationErrors).some(error => error !== '')}
                  style={{
                    padding: '0.875rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: (isUploading || Object.values(validationErrors).some(error => error !== ''))
                      ? '#d1d5db' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: (isUploading || Object.values(validationErrors).some(error => error !== ''))
                      ? 'not-allowed' 
                      : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: (isUploading || Object.values(validationErrors).some(error => error !== ''))
                      ? 'none'
                      : '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  {isUploading ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon style={{width: '1.25rem', height: '1.25rem'}} />
                      Đăng ảnh ({selectedFiles.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Spinner Animation */}
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

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
              Xác nhận xóa cư dân
            </h3>
            <p style={{margin: '0 0 1.5rem 0', color: '#6b7280'}}>
              Bạn có chắc chắn muốn xóa cư dân này? Hành động này không thể hoàn tác.
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
    </div>
  );
} 
