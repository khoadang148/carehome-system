"use client";

import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
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
import { residentAPI, userAPI, carePlanAssignmentsAPI, roomsAPI, bedAssignmentsAPI } from '@/lib/api';
import ConfirmModal from '@/components/shared/ConfirmModal';

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;
  return userAPI.getAvatarUrl(avatarPath);
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State management
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
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Chỉ hỗ trợ file ảnh định dạng JPG, PNG, WEBP';
    }

    if (file.size > maxSize) {
      return 'Kích thước file không được vượt quá 5MB';
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
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

  // Upload avatar function
  const uploadAvatar = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    for (let i = 0; i <= 90; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
    
    if (selectedFile && user?.id) {
      try {
        const formData = new FormData();
        formData.append('avatar', selectedFile, selectedFile.name);
        
        const response = await userAPI.updateAvatar(user.id, formData);
        
        if (response.avatar) {
          setAvatarImage(response.avatar);
        }
        
        if (userData) {
          setUserData((prev: any) => ({ ...prev, avatar: response.avatar }));
        }
        
        setUploadProgress(100);
        setSuccessMessage('✅ Cập nhật ảnh đại diện thành công!');
        setShowSuccessModal(true);
      } catch (err: any) {
        console.error('Avatar upload error:', err);
        let errorMessage = 'Lỗi khi cập nhật ảnh đại diện.';
        
        if (err.response?.status === 403) {
          errorMessage = 'Tài khoản của bạn không có quyền thay đổi ảnh đại diện. Vui lòng liên hệ quản trị viên.';
        } else if (err.response?.status === 400) {
          errorMessage = 'File không hợp lệ. Vui lòng chọn file ảnh khác.';
        } else if (err.response?.status === 413) {
          errorMessage = 'File quá lớn. Vui lòng chọn file nhỏ hơn.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setUploadError(errorMessage);
        setIsUploading(false);
        return;
      }
    }
    
    setIsUploading(false);
    setShowUploadModal(false);
    resetUploadState();
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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return '-- tuổi';
    
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age + ' tuổi';
  };

  // Fetch user profile data
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

  // Fetch residents for family members
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
          console.error('Profile - Error fetching residents:', err);
          setError(getUserFriendlyError(error));
          setResidents([]);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Get selected resident
  const selectedResident = residents.find(r => r._id === selectedResidentId);

  // Fetch room information for selected resident
  useEffect(() => {
    if (!selectedResidentId) {
      setRoomNumber('Chưa hoàn tất đăng kí');
      return;
    }
    
    setRoomLoading(true);
    const residentId = typeof selectedResidentId === 'object' && (selectedResidentId as any)?._id 
      ? (selectedResidentId as any)._id 
      : selectedResidentId;
    
    bedAssignmentsAPI.getByResidentId(residentId)
      .then((assignments: any[]) => {
        const assignment = Array.isArray(assignments) ? assignments.find(a => a.bed_id?.room_id) : null;
        if (assignment?.bed_id?.room_id) {
          // Nếu room_id đã có thông tin room_number, sử dụng trực tiếp
          if (typeof assignment.bed_id.room_id === 'object' && assignment.bed_id.room_id.room_number) {
            setRoomNumber(assignment.bed_id.room_id.room_number);
          } else {
            // Nếu chỉ có _id, fetch thêm thông tin
            const roomId = assignment.bed_id.room_id._id || assignment.bed_id.room_id;
            if (roomId) {
              return roomsAPI.getById(roomId)
                .then((room: any) => {
                  setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
                })
                .catch(() => {
                  setRoomNumber('Chưa hoàn tất đăng kí');
                });
            } else {
              setRoomNumber('Chưa hoàn tất đăng kí');
            }
          }
        } else {
          // Fallback: lấy từ care plan assignments
          return carePlanAssignmentsAPI.getByResidentId(residentId)
            .then((careAssignments: any[]) => {
              const careAssignment = Array.isArray(careAssignments) ? careAssignments.find(a => a.bed_id?.room_id || a.assigned_room_id) : null;
              const roomId = careAssignment?.bed_id?.room_id || careAssignment?.assigned_room_id;
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              
              if (roomIdString) {
                return roomsAPI.getById(roomIdString)
                  .then((room: any) => {
                    setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
                  })
                  .catch(() => {
                    setRoomNumber('Chưa hoàn tất đăng kí');
                  });
              } else {
                setRoomNumber('Chưa hoàn tất đăng kí');
              }
            })
            .catch(() => {
              setRoomNumber('Chưa hoàn tất đăng kí');
            });
        }
      })
      .catch(() => {
        setRoomNumber('Chưa hoàn tất đăng kí');
      })
      .finally(() => setRoomLoading(false));
  }, [selectedResidentId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        

        {/* Header */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-3">
          <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại trang trước"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-indigo-600 leading-tight">
                Hồ sơ cá nhân
              </h1>
              <p className="text-gray-600 mt-3 font-medium">
                Thông tin tài khoản và cài đặt cá nhân
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-6 mb-8 flex-wrap">
            <div className="relative flex-shrink-0">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 overflow-hidden relative ${
                !avatarImage ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' : 'border-gray-200'
              }`}>
                {avatarImage && getAvatarUrl(avatarImage) ? (
                  <img 
                    src={getAvatarUrl(avatarImage)!}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData?.full_name?.substring(0, 2).toUpperCase() || 'ND'
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl text-white text-xs font-medium z-10">
                    Đang tải...
                  </div>
                )}
              </div>
              
              {/* Upload button */}
              <button
                onClick={openUploadModal}
                disabled={isUploading}
                className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-indigo-500 border-3 border-white flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 ${
                  isUploading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="Thay đổi ảnh đại diện"
              >
                <CameraIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-xl font-semibold text-gray-900">
                {userData?.full_name || ''}
              </h2>
            </div>
          </div>

          {/* Admin Profile */}
          {userData?.role === 'admin' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                  Họ tên
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  {userData.full_name}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                  Email
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                  <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                  {userData.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                  Số điện thoại
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                  <PhoneIcon className="w-3 h-3 text-gray-400" />
                  {userData.phone}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                  Username
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                  <UserCircleIcon className="w-3 h-3 text-gray-400" />
                  {userData.username}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-indigo-500" />
                  Thông tin liên hệ
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                      Email
                    </label>
                                      <div className="flex items-center gap-2 text-sm text-gray-900">
                    <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                    {userData?.email}
                  </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                      Số điện thoại
                    </label>
                                      <div className="flex items-center gap-2 text-sm text-gray-900">
                    <PhoneIcon className="w-3 h-3 text-gray-400" />
                    {userData?.phone}
                  </div>
                  </div>

                  {user?.role === 'family' && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                        Địa chỉ
                      </label>
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {userData?.address || 'Chưa hoàn tất đăng kí'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role-specific Info */}
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  {user?.role === 'family' ? (
                    <>
                      <UserCircleIcon className="w-4 h-4 text-indigo-500" />
                      Thông tin người thân
                    </>
                  ) : (
                    <>
                      <BriefcaseIcon className="w-4 h-4 text-indigo-500" />
                      Thông tin công việc
                    </>
                  )}
                </h3>
                
                <div className="space-y-3">
                  {user?.role === 'family' ? (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                        Người thân được chăm sóc
                      </label>
                      {loading ? (
                        <div className="text-sm text-gray-600">Đang tải thông tin người thân...</div>
                      ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                      ) : residents.length > 1 ? (
                        <div>
                          <select
                            value={selectedResidentId}
                            onChange={e => setSelectedResidentId(e.target.value)}
                            className="w-full p-2 rounded-md border border-gray-300 text-sm bg-white mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            {residents.map(member => (
                              <option key={member._id} value={member._id}>
                                {member.full_name}
                              </option>
                            ))}
                          </select>
                          {selectedResident && (
                            <div className="text-xs text-gray-500">
                              Phòng {roomLoading ? 'Đang tải...' : roomNumber} • {calculateAge(selectedResident.date_of_birth)}
                            </div>
                          )}
                        </div>
                      ) : residents.length === 1 && selectedResident ? (
                        <div>
                          <div className="text-sm text-gray-900 font-medium">
                            {selectedResident.full_name || selectedResident.fullName || 'Chưa được phân công'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Phòng {roomLoading ? 'Đang tải...' : roomNumber} • {calculateAge(selectedResident.date_of_birth)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">Không có dữ liệu người thân.</div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                          Chức vụ
                        </label>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <UserIcon className="w-3 h-3 text-gray-400" />
                          {userData?.position || 'Chưa hoàn tất đăng kí'}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                          Ngày bắt đầu làm việc
                        </label>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <CalendarIcon className="w-3 h-3 text-gray-400" />
                          {userData?.join_date ? new Date(userData.join_date).toLocaleDateString('vi-VN') : 'Chưa hoàn tất đăng kí'}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                          Trạng thái
                        </label>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <div className={`w-2 h-2 rounded-full ${
                            userData?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {userData?.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ việc'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Thay đổi ảnh đại diện
                </h3>
                <button
                  onClick={closeUploadModal}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Upload Area */}
              {!previewUrl && (
                <div
                  onDragEnter={handleDragIn}
                  onDragLeave={handleDragOut}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer mb-4 ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ArrowUpTrayIcon className={`w-12 h-12 mx-auto mb-4 ${
                    dragActive ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className="text-base font-medium text-gray-700 mb-2">
                    {dragActive ? 'Thả file ảnh vào đây' : 'Kéo thả ảnh hoặc click để chọn'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Preview Area */}
              {previewUrl && (
                <div className="mb-6">
                  <h4 className="text-base font-medium text-gray-700 mb-4">
                    Xem trước
                  </h4>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div 
                      className="w-16 h-16 rounded-full border-2 border-gray-200 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${previewUrl})` }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {selectedFile?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={resetUploadState}
                      className="p-2 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">
                    {uploadError}
                  </span>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">
                      Đang tải lên...
                    </span>
                    <span className="text-sm text-gray-700">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeUploadModal}
                  disabled={isUploading}
                  className={`px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium transition-colors ${
                    isUploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  Hủy
                </button>
                <button
                  onClick={uploadAvatar}
                  disabled={!selectedFile || isUploading}
                  className={`px-6 py-3 rounded-lg border-none text-white text-sm font-medium flex items-center gap-2 transition-colors ${
                    !selectedFile || isUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Xác nhận
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        <ConfirmModal
          isOpen={showSuccessModal}
          title="Thành công"
          message={successMessage}
          type="success"
          confirmText="Đóng"
          onConfirm={() => {
            setShowSuccessModal(false);
            setSuccessMessage('');
          }}
          onCancel={() => {
            setShowSuccessModal(false);
            setSuccessMessage('');
          }}
        />
      </div>
    </div>
  );
} 

