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
const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;
  return userAPI.getAvatarUrl(avatarPath);
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

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


  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Chỉ hỗ trợ file ảnh định dạng JPG, PNG, WEBP';
    }

    if (file.size > maxSize) {
      return 'Kích thước file không được vượt quá 5MB';
    }

    return null;
  };

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

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadAvatar = async () => {
    setIsUploading(true);
    setUploadProgress(0);


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

  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    resetUploadState();
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
  };

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

          setError(getUserFriendlyError(error));
          setResidents([]);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const selectedResident = residents.find(r => r._id === selectedResidentId);

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
          if (typeof assignment.bed_id.room_id === 'object' && assignment.bed_id.room_id.room_number) {
            setRoomNumber(assignment.bed_id.room_id.room_number);
          } else {
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

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center gap-6 mb-8 flex-wrap">
            <div className="relative flex-shrink-0">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 overflow-hidden relative ${!avatarImage ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' : 'border-gray-200'
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

              <button
                onClick={openUploadModal}
                disabled={isUploading}
                className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-indigo-500 border-3 border-white flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 ${isUploading ? 'opacity-60 cursor-not-allowed' : ''
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
                          <div className={`w-2 h-2 rounded-full ${userData?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
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

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-20">
            <div className="bg-white rounded-3xl p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Thay đổi ảnh đại diện
                      </h3>
                      <p className="text-indigo-100 text-sm mt-1">
                        Cập nhật ảnh đại diện mới cho tài khoản
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeUploadModal}
                    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {!previewUrl && (
                  <div
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer mb-6 group ${dragActive
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-indigo-300 hover:shadow-lg hover:scale-[1.02]'
                      }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${dragActive
                        ? 'bg-indigo-100 shadow-lg'
                        : 'bg-white shadow-md group-hover:shadow-lg'
                      }`}>
                      <ArrowUpTrayIcon className={`w-10 h-10 transition-all duration-300 ${dragActive ? 'text-indigo-600 scale-110' : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'
                        }`} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-3">
                      {dragActive ? 'Thả ảnh vào đây' : 'Tải lên ảnh đại diện'}
                    </h4>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {dragActive ? 'Thả file ảnh để tải lên ngay lập tức' : 'Kéo thả ảnh vào đây hoặc click để chọn file từ máy tính'}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}
                {previewUrl && (
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <CheckIcon className="w-5 h-5 text-green-500" />
                      Xem trước ảnh đại diện
                    </h4>
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div
                            className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-cover bg-center bg-no-repeat overflow-hidden"
                            style={{ backgroundImage: `url(${previewUrl})` }}
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-base font-bold text-gray-800">
                              {selectedFile?.name}
                            </h5>
                            <button
                              onClick={resetUploadState}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
                              title="Chọn ảnh khác"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                              </svg>
                              Kích thước: {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Định dạng hợp lệ
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {uploadError && (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-red-800 mb-1">Lỗi tải lên</h5>
                      <p className="text-sm text-red-700">
                        {uploadError}
                      </p>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div>
                          <h5 className="text-base font-bold text-blue-800">Đang tải lên ảnh</h5>
                          <p className="text-sm text-blue-600">Vui lòng chờ trong giây lát...</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700 font-medium">Tiến độ</span>
                          <span className="text-blue-700 font-bold">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                  <button
                    onClick={closeUploadModal}
                    disabled={isUploading}
                    className={`px-8 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${isUploading
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={uploadAvatar}
                    disabled={!selectedFile || isUploading}
                    className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow-lg ${!selectedFile || isUploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl hover:scale-105'
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
                        Cập nhật ảnh đại diện
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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

