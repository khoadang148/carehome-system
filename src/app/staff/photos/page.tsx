"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { residentAPI, photosAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, bedAssignmentsAPI, activitiesAPI, activityParticipationsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { filterOfficialResidents } from '@/lib/utils/resident-status';

export default function PhotoUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedResident, setSelectedResident] = useState('');
  const [activityType, setActivityType] = useState('');
  const [customActivityType, setCustomActivityType] = useState('');
  const [photoTags, setPhotoTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploading, setCurrentUploading] = useState(0); 
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [shareWithFamily, setShareWithFamily] = useState(true);
  const [residents, setResidents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchResidents = async () => {
      try {

        if (user?.role === 'staff') {
          const data = await staffAssignmentsAPI.getMyAssignments();
          const assignmentsData = Array.isArray(data) ? data : [];
          
          const activeAssignments = assignmentsData.filter((assignment: any) => assignment.status === 'active');
          
          const residentsWithRoom = await Promise.all(activeAssignments.map(async (assignment: any) => {
            const resident = assignment.resident_id;
            let room_number = '';
            try {
              
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
        } else {
          
          const data = await residentAPI.getAll();
          const allResidents = Array.isArray(data) ? data : [];
          const officialResidents = await filterOfficialResidents(allResidents);
          
          const residentsWithRoom = await Promise.all(officialResidents.map(async (resident: any) => {
            let room_number = '';
            try {
              
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
        }
      } catch (err) {
        setResidents([]);
      }
    };
    
    if (user) {
      fetchResidents();
    }
  }, [user]);

  
  // Load activities assigned to current staff via participations
  useEffect(() => {
    const fetchStaffActivities = async () => {
      try {
        if (!user || !('id' in user) || !(user as any).id) {
          setActivities([]);
          return;
        }
        const participations = await activityParticipationsAPI.getByStaffId((user as any).id);
        const activityIds = [...new Set((Array.isArray(participations) ? participations : []).map((p: any) => p.activity_id?._id || p.activity_id))].filter(Boolean);
        const activityPromises = activityIds.map(async (activityId: any) => {
          try {
            const activityData = await activitiesAPI.getById(activityId);
            return mapActivityFromAPI(activityData);
          } catch {
            return null;
          }
        });
        const mapped = (await Promise.all(activityPromises)).filter(Boolean);
        setActivities(mapped as any[]);
      } catch {
        setActivities([]);
      }
    };
    if (user) fetchStaffActivities();
  }, [user]);
  
  
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);
  
  
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
  
  
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
  
  
  const validateFiles = (files: File[]): {isValid: boolean, errors: string[]} => {
    const errors: string[] = [];
    
    
    if (files.length === 0) {
      errors.push('Vui lòng chọn ít nhất 1 ảnh');
    } else if (files.length > MAX_FILES_COUNT) {
      errors.push(`Tối đa ${MAX_FILES_COUNT} ảnh mỗi lần tải lên`);
    }
    
    files.forEach((file, index) => {
      
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Ảnh "${file.name}" quá lớn (tối đa 10MB)`);
      }
      
      
      if (!ALLOWED_FORMATS.includes(file.type)) {
        errors.push(`Ảnh "${file.name}" không đúng định dạng (chỉ chấp nhận JPG, PNG, WebP)`);
      }
      
      
      if (file.name.length > 100) {
        errors.push(`Tên file "${file.name}" quá dài (tối đa 100 ký tự)`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    
    if (!selectedResident) {
      errors.selectedResident = 'Vui lòng chọn người cao tuổi';
    }
    
    
    if (!activityType) {
      errors.activityType = 'Vui lòng chọn loại hoạt động';
    } else if (activityType === 'Khác' && !customActivityType.trim()) {
      errors.customActivityType = 'Vui lòng nhập loại hoạt động tùy chỉnh';
    }
    
    if (!selectedActivity || !/^[0-9a-fA-F]{24}$/.test(selectedActivity)) {
      errors.selectedActivity = 'Vui lòng chọn Hoạt động sinh hoạt hợp lệ';
    }
    
    
    if (!photoDescription.trim()) {
      errors.photoDescription = 'Vui lòng nhập mô tả hoạt động';
    } else if (photoDescription.trim().length < 10) {
      errors.photoDescription = 'Mô tả phải có ít nhất 10 ký tự';
    } else if (photoDescription.trim().length > 500) {
      errors.photoDescription = 'Mô tả không được vượt quá 500 ký tự';
    }
    
    
    const fileValidation = validateFiles(selectedFiles);
    if (!fileValidation.isValid) {
      errors.files = fileValidation.errors.join('; ');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const newFiles = [...selectedFiles, ...files];
    
    if (newFiles.length > MAX_FILES_COUNT) {
      setValidationErrors(prev => ({...prev, files: `Tối đa ${MAX_FILES_COUNT} ảnh mỗi lần tải lên`}));
      event.target.value = '';
      return;
    }
    
    const validation = validateFiles(newFiles);
    if (validation.isValid) {
      setSelectedFiles(newFiles);
      setValidationErrors(prev => ({...prev, files: ''}));
      
      
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
    const errors: string[] = [];

    try {
      
      
      if (!selectedFiles || selectedFiles.length === 0) {
        throw new Error('No files selected for upload');
      }
      
      
      selectedFiles.forEach((file, index) => {
        
        if (!file || file.size === 0) {
          throw new Error(`File ${file.name} is empty or invalid`);
        }
      });
      
      const residentObj = residents.find(r => String(r._id) === String(selectedResident));
      
      if (!residentObj) {
        setValidationErrors(prev => ({...prev, selectedResident: 'Không tìm thấy thông tin người cao tuổi'}));
        setIsUploading(false);
        return;
      }
      
      const familyId = (residentObj as any).family_member_id || (residentObj as any).familyId || (residentObj as any).family_id;
      
      if (user?.role === 'staff' && !familyId) {
        
      } else if (!familyId && user?.role !== 'staff') {
        setValidationErrors(prev => ({...prev, selectedResident: 'Không tìm thấy thông tin người thân (familyId)'}));
        setIsUploading(false);
        return;
      }
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentUploading(i + 1);
        
        try {
        const formData = new FormData();
          
          
          if (!file || file.size === 0) {
            throw new Error(`File ${file.name} is empty or invalid`);
          }
          
          formData.append('file', file);
          formData.append('resident_id', residentObj._id);
          
          if (photoDescription.trim()) {
        formData.append('caption', photoDescription.trim());
          }
          
          if (activityType && activityType !== 'Khác') {
            formData.append('activity_type', activityType);
          } else if (customActivityType.trim()) {
            formData.append('activity_type', customActivityType.trim());
          }
          
          if (selectedActivity && 
              selectedActivity.trim() !== '' && 
              selectedActivity !== 'null' && 
              selectedActivity !== 'undefined' &&
              /^[0-9a-fA-F]{24}$/.test(selectedActivity)) {
            formData.append('related_activity_id', selectedActivity);
            
          } else if (selectedActivity) {
            
          }
          
          if (photoTags.length > 0) {
        photoTags.forEach(tag => formData.append('tags', tag));
          }
          
        formData.append('taken_date', new Date().toISOString());
        
        let senderName = 'Nhân viên';
        if (user) {
          if ('full_name' in user && (user as any).full_name) senderName = (user as any).full_name;
          else if ('username' in user && (user as any).username) senderName = (user as any).username;
          else if ('email' in user && (user as any).email) senderName = (user as any).email;
        }
        formData.append('staff_notes', String(senderName));
        
          let retryCount = 0;
          const maxRetries = 2;
          let uploadSuccess = false;
          
          while (retryCount <= maxRetries && !uploadSuccess) {
            try {
              await photosAPI.upload(formData);
            successCount++;
              uploadSuccess = true;
              
            } catch (uploadError: any) {
              retryCount++;
              
              
              if (uploadError.message?.includes('cơ sở dữ liệu') || uploadError.message?.includes('Database')) {
                if (retryCount <= maxRetries) {
                  
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  continue;
                } else {
                  errors.push(`${file.name}: Lỗi cơ sở dữ liệu sau ${maxRetries + 1} lần thử`);
                }
              } else {
                errors.push(`${file.name}: ${uploadError.message || 'Lỗi không xác định'}`);
                break;
              }
            }
          }
          
          if (!uploadSuccess) {
            errorCount++;
          }
          
        } catch (fileError: any) {
          errorCount++;
          errors.push(`${file.name}: ${fileError.message || 'Lỗi không xác định'}`);
        }
        
        
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      
      
      if (successCount > 0) {
        const errorMessage = errorCount > 0 ? `\n\n❌ ${errorCount} ảnh lỗi:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... và ${errors.length - 3} lỗi khác` : ''}` : '';
        setResultMessage(`✅ Đã tải lên ${successCount}/${selectedFiles.length} ảnh thành công!${errorMessage}`);
      } else {
        setResultMessage(`❌ Không thể tải lên ảnh nào. Lỗi:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : ''}`);
      }
      
      setShowResultModal(true);
      
      
      if (successCount > 0) {
      if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
      const timeout = setTimeout(() => {
        setShowResultModal(false);
        router.push('/staff/photos/gallery');
        }, 2000);
      setAutoCloseTimeout(timeout);
      } else {
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
        const timeout = setTimeout(() => {
          setShowResultModal(false);
        }, 5000);
        setAutoCloseTimeout(timeout);
      }
    } catch (error: any) {
      setResultMessage(`❌ Có lỗi xảy ra khi tải ảnh: ${error.message || 'Lỗi không xác định'}`);
      setShowResultModal(true);
      if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
      const timeout = setTimeout(() => {
        setShowResultModal(false);
      }, 3000);
      setAutoCloseTimeout(timeout);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploading(0);
    }
  };

  
  const handleTagToggle = (tag: string) => {
    setPhotoTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const resetForm = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    
    setSelectedFiles([]);
    setPhotoDescription('');
    setSelectedResident('');
    setActivityType('');
    setCustomActivityType('');
    setPhotoTags([]);
    setSelectedActivity('');
    setValidationErrors({});
    setShareWithFamily(true);
  };

  const handleGoBack = () => {
    router.push('/staff/photos');
  };

  const mapActivityFromAPI = (apiActivity: any) => {
    try {
      if (!apiActivity || !apiActivity._id) return null;
      const scheduleTime = apiActivity.schedule_time ? new Date(apiActivity.schedule_time) : null;
      const durationInMinutes = typeof apiActivity.duration === 'number' ? apiActivity.duration : 0;
      const endTime = scheduleTime ? new Date(scheduleTime.getTime() + durationInMinutes * 60000) : null;
      return {
        _id: apiActivity._id,
        activity_name: apiActivity.activity_name,
        activity_type: apiActivity.activity_type,
        description: apiActivity.description,
        schedule_time: apiActivity.schedule_time,
        duration: apiActivity.duration,
        startTime: scheduleTime ? scheduleTime.toTimeString().slice(0, 5) : '',
        endTime: endTime ? endTime.toTimeString().slice(0, 5) : '',
        date: scheduleTime ? scheduleTime.toLocaleDateString('en-CA') : undefined,
        location: apiActivity.location,
      };
    } catch {
      return null;
    }
  };

  const getDateFromActivity = (a: any): Date | null => {
    const parseDateFlexible = (val: any): Date | null => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (typeof val === 'number') {
        const dt = new Date(val);
        return isNaN(dt.getTime()) ? null : dt;
      }
      if (typeof val === 'string') {
        const s = val.trim();
        const ymd = /^(\d{4})-(\d{2})-(\d{2})$/;
        const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const numeric = /^\d+$/;
        if (ymd.test(s)) {
          const dt = new Date(s + 'T00:00:00');
          return isNaN(dt.getTime()) ? null : dt;
        }
        if (dmy.test(s)) {
          const [, dd, mm, yy] = s.match(dmy)!;
          const dt = new Date(Number(yy), Number(mm) - 1, Number(dd));
          return isNaN(dt.getTime()) ? null : dt;
        }
        if (numeric.test(s)) {
          const num = Number(s);
          const ms = s.length === 10 ? num * 1000 : num;
          const dt = new Date(ms);
          return isNaN(dt.getTime()) ? null : dt;
        }
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? null : dt;
      }
      return null;
    };

    const candidates = [
      a.activity_date,
      a.activityDate,
      a.date,
      a.scheduled_date,
      a.scheduledDate,
      a.scheduled_at,
      a.start_time,
      a.startTime,
      a.start_at,
      a.startAt,
      a.created_at,
      a.updated_at
    ];
    for (const d of candidates) {
      const dt = parseDateFlexible(d);
      if (dt) return dt;
    }
    return null;
  };

  const isTodayLocal = (dt: Date) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return dt.getTime() >= start.getTime() && dt.getTime() <= end.getTime();
  };

  const todaysActivities = useMemo(() => {
    return Array.isArray(activities)
      ? activities.filter((a: any) => {
          const dt = getDateFromActivity(a);
          return dt ? isTodayLocal(dt) : false;
        })
      : [];
  }, [activities]);

  const [activityParticipants, setActivityParticipants] = useState<{ [activityId: string]: string[] }>({});

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const entries = await Promise.all(
          todaysActivities.map(async (a: any) => {
            const activityId = a._id || a.id;
            if (!activityId) return [null, []] as [string | null, string[]];
            const list = await activityParticipationsAPI.getAll({ activity_id: activityId });
            const filtered = (Array.isArray(list) ? list : []).filter((p: any) => {
              const pDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
              const aDate = a.date || (getDateFromActivity(a)?.toLocaleDateString('en-CA'));
              return pDate && aDate && pDate === aDate;
            });
            const residentIds = filtered.map((p: any) => p.resident_id?._id || p.resident_id).filter(Boolean);
            return [activityId, Array.from(new Set(residentIds))] as [string, string[]];
          })
        );
        const map: { [k: string]: string[] } = {};
        entries.forEach(([id, ids]) => { if (id) map[id] = ids; });
        setActivityParticipants(map);
      } catch {
        setActivityParticipants({});
      }
    };
    
    // Chỉ gọi loadParticipants nếu có activities và chưa load
    if (todaysActivities.length > 0) {
      loadParticipants();
    } else {
      // Chỉ set empty object nếu hiện tại không empty để tránh infinite loop
      setActivityParticipants(prev => {
        if (Object.keys(prev).length === 0) return prev;
        return {};
      });
    }
  }, [todaysActivities]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgb(251,251,248)_0%,rgb(249,247,243)_100%)] py-8 px-4">
      <div className="max-w-[800px] mx-auto bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            
            <div>
              <div className="flex items-center gap-3">
                <PhotoIcon className="w-10 h-10 text-white" />
                <div>
                  <h1 className="text-[1.8rem] font-bold m-0">
                Đăng ảnh của người cao tuổi
              </h1>
                  <p className="text-sm mt-2 opacity-90 m-0">
                Ghi lại những khoảnh khắc đáng nhớ và chia sẻ với gia đình
              </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="p-8">
          
          <div className="mb-6">
            <label className="block font-semibold mb-2 text-slate-700 text-[0.95rem]">
              Chọn người cao tuổi <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedResident}
              onChange={(e) => {
                setSelectedResident(e.target.value);
                setValidationErrors(prev => ({...prev, selectedResident: ''}));
              }}
              className={`w-full p-3 rounded-xl border-2 text-[0.95rem] outline-none ${validationErrors.selectedResident ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
            >
              <option value="">-- Chọn người cao tuổi --</option>
              {residents.map((resident: any) => (
                <option key={resident._id} value={resident._id}>
                  {resident.full_name} {resident.room_number ? `- Phòng ${resident.room_number}` : ''}
                </option>
              ))}
            </select>
            {validationErrors.selectedResident && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {validationErrors.selectedResident}
              </p>
            )}
          </div>

          
          <div className="mb-6">
            <label className="block font-semibold mb-2 text-slate-700 text-[0.95rem]">
              Hoạt động sinh hoạt
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => {
                setSelectedActivity(e.target.value);
              }}
              className={`w-full p-3 rounded-xl border-2 text-[0.95rem] outline-none ${validationErrors.selectedActivity ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
            >
              <option value="">-- Chọn hoạt động --</option>
              {!selectedResident ? (
                <option value="" disabled>Chọn người cao tuổi trước</option>
              ) : todaysActivities.length === 0 ? (
                <option value="" disabled>Người cao tuổi không có hoạt động hôm nay</option>
              ) : (() => {
                const residentActivities = todaysActivities.filter((activity: any) => {
                  const activityId = activity._id || activity.id;
                  const list = activityParticipants[activityId] || [];
                  return list.includes(selectedResident);
                });
                if (residentActivities.length === 0) {
                  return <option value="" disabled>Người cao tuổi không có hoạt động hôm nay</option>;
                }
                return residentActivities.map((activity: any) => (
                <option key={activity._id} value={activity._id}>
                  {activity.activity_name} - {activity.activity_type || 'Không phân loại'}
                </option>
                ));
              })()}
            </select>
           {validationErrors.selectedActivity && (
             <p className="text-red-500 text-sm mt-2 font-medium">
               {validationErrors.selectedActivity}
            </p>
           )}
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2 text-slate-700 text-[0.95rem]">
              Loại hoạt động <span className="text-red-500">*</span>
            </label>
            <select
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                setCustomActivityType('');
                setValidationErrors(prev => ({...prev, activityType: '', customActivityType: ''}));
              }}
              className={`w-full p-3 rounded-xl border-2 text-[0.95rem] outline-none ${validationErrors.activityType ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
            >
              <option value="">-- Chọn loại hoạt động --</option>
              {ACTIVITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {validationErrors.activityType && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {validationErrors.activityType}
              </p>
            )}
            
            
            {activityType === 'Khác' && (
              <div className="mt-4">
                <label className="block font-semibold mb-2 text-slate-700 text-[0.95rem]">
                  Nhập loại hoạt động tùy chỉnh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customActivityType}
                  onChange={(e) => {
                    setCustomActivityType(e.target.value);
                    setValidationErrors(prev => ({...prev, customActivityType: ''}));
                  }}
                  placeholder="VD: Hoạt động dã ngoại, Lễ kỷ niệm, Hoạt động tình nguyện..."
                  className={`w-full p-3 rounded-xl border-2 text-[0.95rem] outline-none ${validationErrors.customActivityType ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
                />
                {validationErrors.customActivityType && (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {validationErrors.customActivityType}
                  </p>
                )}
              </div>
            )}
          </div>

          
          <div className="mb-6">
            <label className="block font-semibold mb-2 text-slate-700 text-[0.95rem]">
              Mô tả hoạt động <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal ml-2">({photoDescription.length}/500 ký tự)</span>
            </label>
            <textarea
              value={photoDescription}
              onChange={(e) => {
                setPhotoDescription(e.target.value);
                setValidationErrors(prev => ({...prev, photoDescription: ''}));
              }}
              placeholder="VD: Cô Lan tham gia hoạt động thể dục buổi sáng với các bạn, rất vui vẻ và tích cực..."
              rows={4}
              className={`w-full p-3 rounded-xl border-2 text-[0.95rem] outline-none resize-y ${validationErrors.photoDescription ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
            />
            {validationErrors.photoDescription && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {validationErrors.photoDescription}
              </p>
            )}
          </div>

          
          <div className="mb-6">
            <label className="block font-semibold mb-3 text-slate-700 text-[0.95rem]">
              Tags cảm xúc (tùy chọn)
            </label>
            <div className="flex flex-wrap gap-3">
              {PHOTO_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-full text-[0.85rem] font-medium transition border ${photoTags.includes(tag) ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white text-slate-600 hover:border-green-400 hover:bg-green-50'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          
          <div className="mb-6">
            <label className="block font-semibold mb-2 text-slate-700 text-[0.95rem]">
              Chọn ảnh <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal ml-2">(Tối đa {MAX_FILES_COUNT} ảnh, mỗi ảnh ≤ 10MB, JPG/PNG/WebP)</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${validationErrors.files ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-green-500 hover:bg-green-50/50'}`}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <PhotoIcon className={`${validationErrors.files ? 'text-red-500' : 'text-gray-400'} w-12 h-12 mx-auto mb-4`} />
              <div>
                <p className={`${validationErrors.files ? 'text-red-500' : 'text-slate-600'} m-0 text-base font-semibold`}>
                  {selectedFiles.length > 0 
                    ? `Đã chọn ${selectedFiles.length} ảnh` 
                    : 'Click để chọn ảnh'
                  }
                </p>
                <p className="text-gray-400 mt-2 text-sm m-0">
                  Kéo thả ảnh vào đây hoặc click để chọn
                </p>
              </div>
            </div>
            {validationErrors.files && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {validationErrors.files}
              </p>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <p className="text-[0.95rem] font-semibold text-slate-700 mb-3">📎 Ảnh đã chọn ({selectedFiles.length}):</p>
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-white p-3 rounded-xl shadow-sm text-center relative overflow-hidden border border-slate-100">
                    <div className="w-full h-[120px] rounded-lg mb-3 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                      <img
                        src={previewUrls[index]}
                        alt={`Preview ${file.name}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = (target.parentElement?.querySelector('.fallback') as HTMLElement);
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="fallback hidden w-full h-full bg-gradient-to-br from-green-500 to-amber-500 rounded-lg items-center justify-center text-white text-2xl">
                        📷
                      </div>
                    </div>
                    <p className="text-[0.8rem] text-slate-800 m-0 mb-1 break-words font-medium">
                      {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                    </p>
                    <p className="text-[0.7rem] text-slate-500 m-0">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(previewUrls[index]);
                        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow hover:bg-red-500"
                      title="Xóa ảnh này"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          

          
          {isUploading && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 border-2 border-green-300 border-t-green-500 rounded-full animate-spin" />
                <span className="text-[0.95rem] font-semibold text-green-600">
                  Đang tải ảnh {currentUploading}/{selectedFiles.length}... {uploadProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-amber-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          
          <div className="flex justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => router.push('/staff/photos/gallery')}
              className="px-6 py-3 rounded-xl border border-amber-600 bg-white text-amber-600 font-semibold text-[0.95rem] flex items-center gap-2 hover:bg-amber-500 hover:text-white"
            >
              <PhotoIcon className="w-5 h-5" />
              Xem thư viện ảnh
            </button>
            
            <button
              onClick={handleUploadPhotos}
              disabled={isUploading || Object.values(validationErrors).some(error => error !== '')}
              className={`${isUploading || Object.values(validationErrors).some(error => error !== '') ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_4px_12px_rgba(102,126,234,0.3)] hover:opacity-95'} px-6 py-3 rounded-xl text-white font-semibold text-[0.95rem] flex items-center gap-2`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Đăng ảnh ({selectedFiles.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      
      {showResultModal && (
        <div className="fixed inset-0 bg-slate-800/25 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className={`${resultMessage.startsWith('✅') ? 'bg-gradient-to-br from-green-50 to-green-200' : 'bg-gradient-to-br from-red-50 to-red-200'} rounded-3xl px-10 pt-10 pb-8 min-w-[340px] shadow-xl text-center relative`}>
            {resultMessage.startsWith('✅') ? (
              <div className="mb-4 flex justify-center items-center">
                <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">✓</div>
               </div>
              </div>
            ) : (
              <div className="mb-4 flex justify-center items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xl">✕</div>
                </div>
            </div>
             )}
            <h2 className={`text-[26px] font-extrabold mb-2 ${resultMessage.startsWith('✅') ? 'text-green-800' : 'text-red-600'}`}>
               {resultMessage.startsWith('✅') ? 'Tải lên thành công! 🎉' : 'Có lỗi xảy ra! ❌'}
             </h2>
            <div className={`text-lg mb-7 font-medium ${resultMessage.startsWith('✅') ? 'text-green-800' : 'text-red-600'}`}>
              {resultMessage.replace(/^✅|^❌/, '')}
             </div>
            <div className="flex gap-4 justify-center flex-wrap">
              {resultMessage.startsWith('✅') && (
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    router.push('/staff/photos/gallery');
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full px-8 py-2.5 font-bold shadow hover:from-green-600 hover:to-green-700 flex items-center gap-2"
                >
                  <PhotoIcon className="w-5 h-5" />
                  Xem thư viện ảnh
                </button>
              )}
              <button
                onClick={() => {
                  setShowResultModal(false);
                  if (resultMessage.startsWith('✅')) {
                    resetForm();
                  }
                }}
                className={`${resultMessage.startsWith('✅') ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white rounded-full px-8 py-2.5 font-bold shadow hover:opacity-95`}
              >
                {resultMessage.startsWith('✅') ? 'Tiếp tục tải lên' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 