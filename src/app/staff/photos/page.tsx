"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { residentAPI, photosAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';

export default function PhotoUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Photo upload states with professional validation
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedResident, setSelectedResident] = useState('');
  const [activityType, setActivityType] = useState('');
  const [customActivityType, setCustomActivityType] = useState('');
  const [photoTags, setPhotoTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploading, setCurrentUploading] = useState(0); // Ảnh đang upload thứ mấy
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [shareWithFamily, setShareWithFamily] = useState(true);
  const [residents, setResidents] = useState<any[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Load residents from API
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        // Nếu là staff, chỉ lấy cư dân được phân công (active assignments)
        if (user?.role === 'staff') {
          const data = await staffAssignmentsAPI.getMyAssignments();
          const assignmentsData = Array.isArray(data) ? data : [];
          
          // Debug: Log assignments data
          console.log('Raw assignments data for photos:', assignmentsData);
          
          // Chỉ lấy những assignment có trạng thái active
          const activeAssignments = assignmentsData.filter((assignment: any) => assignment.status === 'active');
          console.log('Active assignments for photos:', activeAssignments);
          
          const residentsWithRoom = await Promise.all(activeAssignments.map(async (assignment: any) => {
            const resident = assignment.resident_id;
            let room_number = '';
            try {
              // Ưu tiên sử dụng bedAssignmentsAPI
              try {
                const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident._id);
                const bedAssignment = Array.isArray(bedAssignments) ? 
                  bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
                
                if (bedAssignment?.bed_id?.room_id) {
                  if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                    room_number = bedAssignment.bed_id.room_id.room_number;
                  } else {
                    const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                    if (roomId) {
                      const room = await roomsAPI.getById(roomId);
                      room_number = room?.room_number || '';
                    }
                  }
                } else {
                  throw new Error('No bed assignment found');
                }
              } catch (bedError) {
                console.warn(`Failed to get bed assignment for resident ${resident._id}:`, bedError);
                // Fallback về carePlansAPI
                const assignments = await carePlansAPI.getByResidentId(resident._id);
                const assignment = Array.isArray(assignments) ? assignments.find(a => a.bed_id?.room_id || a.assigned_room_id) : null;
                const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
                const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                if (roomIdString) {
                  const room = await roomsAPI.getById(roomIdString);
                  room_number = room?.room_number || '';
                }
              }
            } catch {}
            return { ...resident, room_number };
          }));
          setResidents(residentsWithRoom);
          console.log('Staff residents with room_number:', residentsWithRoom);
        } else {
          // Nếu là admin, lấy tất cả cư dân
          const data = await residentAPI.getAll();
          const residentsWithRoom = await Promise.all((Array.isArray(data) ? data : []).map(async (resident: any) => {
            let room_number = '';
            try {
              // Ưu tiên sử dụng bedAssignmentsAPI
              try {
                const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident._id);
                const bedAssignment = Array.isArray(bedAssignments) ? 
                  bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
                
                if (bedAssignment?.bed_id?.room_id) {
                  if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                    room_number = bedAssignment.bed_id.room_id.room_number;
                  } else {
                    const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                    if (roomId) {
                      const room = await roomsAPI.getById(roomId);
                      room_number = room?.room_number || '';
                    }
                  }
                } else {
                  throw new Error('No bed assignment found');
                }
              } catch (bedError) {
                console.warn(`Failed to get bed assignment for resident ${resident._id}:`, bedError);
                // Fallback về carePlansAPI
                const assignments = await carePlansAPI.getByResidentId(resident._id);
                const assignment = Array.isArray(assignments) ? assignments.find(a => a.bed_id?.room_id || a.assigned_room_id) : null;
                const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
                const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                if (roomIdString) {
                  const room = await roomsAPI.getById(roomIdString);
                  room_number = room?.room_number || '';
                }
              }
            } catch {}
            return { ...resident, room_number };
          }));
          setResidents(residentsWithRoom);
          console.log('All residents with room_number:', residentsWithRoom);
        }
      } catch (err) {
        console.error('Error fetching residents:', err);
        setResidents([]);
      }
    };
    
    if (user) {
      fetchResidents();
    }
  }, [user]);
  
  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);
  
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
    } else if (activityType === 'Khác' && !customActivityType.trim()) {
      errors.customActivityType = 'Vui lòng nhập loại hoạt động tùy chỉnh';
    }
    
    // Description validation
    if (!photoDescription.trim()) {
      errors.photoDescription = 'Vui lòng nhập mô tả hoạt động';
    } else if (photoDescription.trim().length < 10) {
      errors.photoDescription = 'Mô tả phải có ít nhất 10 ký tự';
    } else if (photoDescription.trim().length > 500) {
      errors.photoDescription = 'Mô tả không được vượt quá 500 ký tự';
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
    // Nối files mới vào danh sách cũ
    const newFiles = [...selectedFiles, ...files];
    // Giới hạn tối đa 10 ảnh
    if (newFiles.length > MAX_FILES_COUNT) {
      setValidationErrors(prev => ({...prev, files: `Tối đa ${MAX_FILES_COUNT} ảnh mỗi lần tải lên`}));
      event.target.value = '';
      return;
    }
    // Validate files mới
    const validation = validateFiles(newFiles);
    if (validation.isValid) {
      setSelectedFiles(newFiles);
      setValidationErrors(prev => ({...prev, files: ''}));
      
      // Tạo preview URLs cho files mới
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    } else {
      setValidationErrors(prev => ({...prev, files: validation.errors.join('; ')}));
      event.target.value = '';
    }
  };

  const handleUploadPhotos = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploading(0);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Lấy resident object từ danh sách residents (so sánh kiểu string)
      const residentObj = residents.find(r => String(r._id) === String(selectedResident));
      console.log('residentObj:', residentObj);
      
      if (!residentObj) {
        setValidationErrors(prev => ({...prev, selectedResident: 'Không tìm thấy thông tin cư dân'}));
        setIsUploading(false);
        return;
      }
      
      // Kiểm tra familyId - có thể không cần thiết cho staff upload ảnh
      const familyId = (residentObj as any).family_member_id || (residentObj as any).familyId || (residentObj as any).family_id;
      console.log('familyId:', familyId);
      
      // Nếu là staff và không có familyId, vẫn cho phép upload (có thể là cư dân mới chưa có family)
      if (user?.role === 'staff' && !familyId) {
        console.log('Staff upload without familyId - allowed');
      } else if (!familyId) {
        setValidationErrors(prev => ({...prev, selectedResident: 'Không tìm thấy thông tin người thân (familyId)'}));
        setIsUploading(false);
        return;
      }
      // Upload song song tất cả ảnh
      const uploadPromises = selectedFiles.map((file, i) => {
        const formData = new FormData();
        formData.append('file', file); // Đảm bảo đúng key 'file'
        formData.append('resident_id', residentObj._id); // Đúng key snake_case cho backend
        formData.append('caption', photoDescription.trim());
        formData.append('activity_type', activityType === 'Khác' ? customActivityType.trim() : activityType);
        photoTags.forEach(tag => formData.append('tags', tag));
        formData.append('taken_date', new Date().toISOString());
        
        // Truyền thêm tên người gửi
        let senderName = 'Nhân viên';
        if (user) {
          if ('full_name' in user && (user as any).full_name) senderName = (user as any).full_name;
          else if ('username' in user && (user as any).username) senderName = (user as any).username;
          else if ('email' in user && (user as any).email) senderName = (user as any).email;
        }
        formData.append('staff_notes', String(senderName));
        
        // Thêm familyId nếu có (cho admin) hoặc để trống (cho staff)
        if (familyId) {
          formData.append('family_id', familyId);
        }
        // formData.append('related_activity_id', '');
        return photosAPI.upload(formData)
          .then(() => {
            successCount++;
          })
          .catch((err) => {
            errorCount++;
            console.error('Upload error:', err);
          })
          .finally(() => {
            setCurrentUploading(prev => prev + 1);
            setUploadProgress(prev => {
              const done = prev + Math.round(100 / selectedFiles.length);
              return done > 100 ? 100 : done;
            });
          });
      });
      await Promise.all(uploadPromises);
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setResultMessage(`✅ Đã tải lên ${successCount}/${selectedFiles.length} ảnh thành công!${errorCount > 0 ? ' Có ' + errorCount + ' ảnh lỗi.' : ''}`);
      setShowResultModal(true);
      if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
      const timeout = setTimeout(() => {
        setShowResultModal(false);
        router.push('/staff/photos/gallery');
      }, 2000);
      setAutoCloseTimeout(timeout);
    } catch (error) {
      setResultMessage('❌ Có lỗi xảy ra khi tải ảnh. Vui lòng thử lại.');
      setShowResultModal(true);
      if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
      const timeout = setTimeout(() => {
        setShowResultModal(false);
      }, 2000);
      setAutoCloseTimeout(timeout);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploading(0);
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
    // Cleanup preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    
    setSelectedFiles([]);
    setPhotoDescription('');
    setSelectedResident('');
    setActivityType('');
    setCustomActivityType('');
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
              {residents.map((resident: any) => (
                <option key={resident._id} value={resident._id}>
                  {resident.full_name} {resident.room_number ? `- Phòng ${resident.room_number}` : ''}
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
                setCustomActivityType('');
                setValidationErrors(prev => ({...prev, activityType: '', customActivityType: ''}));
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
            
            {/* Custom Activity Type Input */}
            {activityType === 'Khác' && (
              <div style={{marginTop: '1rem'}}>
                <label style={{
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Nhập loại hoạt động tùy chỉnh <span style={{color: '#ef4444'}}>*</span>
                </label>
                <input
                  type="text"
                  value={customActivityType}
                  onChange={(e) => {
                    setCustomActivityType(e.target.value);
                    setValidationErrors(prev => ({...prev, customActivityType: ''}));
                  }}
                  placeholder="VD: Hoạt động dã ngoại, Lễ kỷ niệm, Hoạt động tình nguyện..."
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${validationErrors.customActivityType ? '#ef4444' : '#e5e7eb'}`,
                    fontSize: '0.95rem',
                    background: validationErrors.customActivityType ? '#fef2f2' : 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
                {validationErrors.customActivityType && (
                  <p style={{color: '#ef4444', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontWeight: 500}}>
                    {validationErrors.customActivityType}
                  </p>
                )}
              </div>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb'
              }}>
                {selectedFiles.map((file, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Image Preview */}
                    <div style={{
                      width: '100%',
                      height: '120px',
                      borderRadius: '0.5rem',
                      margin: '0 auto 0.75rem',
                      overflow: 'hidden',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <img
                        src={previewUrls[index]}
                        alt={`Preview ${file.name}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '0.5rem'
                        }}
                        onError={(e) => {
                          // Fallback nếu ảnh không load được
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {/* Fallback icon nếu ảnh không load được */}
                      <div 
                        className="fallback"
                        style={{
                          display: 'none',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #22c55e 0%, #f59e0b 100%)',
                          borderRadius: '0.5rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '2rem'
                        }}
                      >
                        📷
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#374151',
                      margin: '0 0 0.25rem 0',
                      wordBreak: 'break-word',
                      fontWeight: 500
                    }}>
                      {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                    </p>
                    <p style={{
                      fontSize: '0.7rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    
                    {/* Nút xóa ảnh */}
                    <button
                      type="button"
                      onClick={() => {
                        // Cleanup preview URL
                        URL.revokeObjectURL(previewUrls[index]);
                        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '2rem',
                        height: '2rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Xóa ảnh này"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          

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
                  Đang tải ảnh {currentUploading}/{selectedFiles.length}... {uploadProgress}%
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
              onClick={() => router.push('/staff/photos/gallery')}
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
      {/* Modal kết quả upload */}
      {showResultModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem 2.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            minWidth: 320,
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{fontSize: '2rem', marginBottom: 12}}>
              {resultMessage.startsWith('✅') ? '✅' : '❌'}
            </div>
            <div style={{fontSize: '1.1rem', fontWeight: 600, color: resultMessage.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: 16}}>
              {resultMessage.replace(/^✅|^❌/, '')}
            </div>
            <button
              onClick={() => {
                setShowResultModal(false);
                if (resultMessage.startsWith('✅')) router.push('/residents');
              }}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                background: resultMessage.startsWith('✅') ? '#22c55e' : '#ef4444',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 