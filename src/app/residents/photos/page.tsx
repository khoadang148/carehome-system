"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { RESIDENTS_DATA } from '@/lib/data/residents-data';
import { useAuth } from '@/lib/contexts/auth-context';

export default function PhotoUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Photo upload states with professional validation
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
      errors.selectedResident = 'Vui lòng chọn người cao tuổi';
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

      const resident = RESIDENTS_DATA.find(r => r.id.toString() === selectedResident);
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

      // Show success message
      alert(`✅ Đã tải lên ${newPhotos.length} ảnh thành công! ${shareWithFamily ? 'Gia đình sẽ được thông báo.' : ''}`);
      
      // Navigate back to residents page
      router.push('/residents');
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

  const resetForm = () => {
    setSelectedFiles([]);
    setPhotoDescription('');
    setSelectedResident('');
    setActivityType('');
    setStaffNotes('');
    setPhotoTags([]);
    setValidationErrors({});
    setShareWithFamily(true);
  };

  const handleGoBack = () => {
    router.push('/residents');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,rgb(251, 251, 248) 0%,rgb(249, 247, 243) 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
          color: 'white'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
            <button
              onClick={handleGoBack}
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
                     Đăng ảnh của người cao tuổi
                  </h1>
                  <p style={{fontSize: '0.9rem', margin: '0.5rem 0 0 0', opacity: 0.9}}>
                    Ghi lại những khoảnh khắc đáng nhớ và chia sẻ với gia đình
                  </p>
                </div>
              </div>
            </div>
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
              Chọn người cao tuổi <span style={{color: '#ef4444'}}>*</span>
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
              <option value="">-- Chọn người cao tuổi --</option>
              {RESIDENTS_DATA.map(resident => (
                <option key={resident.id} value={resident.id.toString()}>
                  {resident.name} - Phòng {resident.room}
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
              <option value="">-- Chọn loại hoạt động --</option>
              {ACTIVITY_TYPES.map(type => (
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
              Tags cảm xúc (tùy chọn)
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              {PHOTO_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    border: photoTags.includes(tag) ? '2px solid #22c55e' : '2px solid #e5e7eb',
                    background: photoTags.includes(tag) ? '#22c55e' : 'white',
                    color: photoTags.includes(tag) ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
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
              Ghi chú nhân viên (tùy chọn)
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
              placeholder="Ghi chú riêng cho nhân viên về hoạt động này..."
              rows={3}
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
                                e.currentTarget.style.borderColor = validationErrors.files ? '#ef4444' : '#22c55e';
                              e.currentTarget.style.background = validationErrors.files ? '#fef2f2' : 'rgba(34, 197, 94, 0.05)';
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
              
              <PhotoIcon style={{
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
                      background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)',
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
                      color: '#6b7280',
                      margin: '0 0 0.25rem 0',
                      wordBreak: 'break-word'
                    }}>
                      {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                    </p>
                    <p style={{
                      fontSize: '0.7rem',
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share with Family */}
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
                <div>Chia sẻ với gia đình</div>
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
              background: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem'}}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  border: '2px solid rgba(34, 197, 94, 0.3)',
                  borderTopColor: '#22c55e',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{fontSize: '0.95rem', fontWeight: 600, color: '#22c55e'}}>
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
                  background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)',
                  transition: 'width 0.3s ease',
                  borderRadius: '0.25rem'
                }} />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => router.push('/residents/photos/gallery')}
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid #d97706',
                background: 'white',
                color: '#d97706',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f59e0b';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#d97706';
              }}
            >
              <PhotoIcon style={{width: '1.25rem', height: '1.25rem'}} />
              Xem thư viện ảnh
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

      {/* Add spinning animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 