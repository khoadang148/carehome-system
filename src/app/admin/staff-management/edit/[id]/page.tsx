"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAPI, userAPI } from '@/lib/api';
import { processAvatarUrl } from '@/lib/utils/avatarUtils';
import { handleAPIError } from '@/lib/utils/api-error-handler';
import { convertDDMMYYYYToISO } from '@/lib/utils/validation';
import SuccessModal from '@/components/SuccessModal';

export default function EditStaffPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAvatarConfirmModal, setShowAvatarConfirmModal] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    qualification: '',
    status: 'active',
    notes: '',
    join_date: '',
    avatar: null as File | null
  });

  // Fetch staff data
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const fetchStaff = async () => {
      try {
        setLoadingData(true);
        const data = await staffAPI.getById(staffId);
        setStaff(data);
        console.log('Staff data loaded:', data);
        console.log('Staff avatar:', data.avatar);
        console.log('Staff avatar type:', typeof data.avatar);
        console.log('Staff avatar length:', data.avatar?.length);
        
        console.log('Staff data from API:', data);
        console.log('Original join_date:', data.join_date);
        
        const initialFormData = {
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          qualification: data.qualification || '',
          status: data.status || 'active',
          notes: data.notes || '',
          join_date: data.join_date ? (() => {
            try {
              const date = new Date(data.join_date);
              if (isNaN(date.getTime())) {
                console.log('Invalid join_date from API:', data.join_date);
                return '';
              }
              return date.toISOString().split('T')[0];
            } catch (error) {
              console.log('Error parsing join_date:', data.join_date, error);
              return '';
            }
          })() : '',
          avatar: null
        };
        
        console.log('Initial form data:', initialFormData);
        console.log('Initial join_date:', initialFormData.join_date);
        
        setFormData(initialFormData);
        setOriginalData(initialFormData);
        setHasChanges(false);
      } catch (err: any) {
        handleAPIError(err, 'Không thể tải thông tin nhân viên');
      } finally {
        setLoadingData(false);
      }
    };

    fetchStaff();
  }, [user, staffId]);

  const checkForChanges = (newFormData: any) => {
    if (!originalData) return false;
    
    // Check all text fields
    const textFields = ['full_name', 'email', 'phone', 'position', 'qualification', 'notes'];
    for (const field of textFields) {
      if (newFormData[field] !== originalData[field]) {
        return true;
      }
    }
    
    // Check join_date field - normalize for comparison
    const normalizeDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string' && date.includes('-')) {
        return date; // Already ISO format
      }
      if (typeof date === 'string' && date.includes('/')) {
        return convertDDMMYYYYToISO(date) || date;
      }
      return date;
    };
    
    const originalDate = normalizeDate(originalData.join_date);
    const newDate = normalizeDate(newFormData.join_date);
    
    if (originalDate !== newDate) {
      console.log('Date changed:', { original: originalDate, new: newDate });
      return true;
    }
    
    // Check status field
    if (newFormData.status !== originalData.status) {
      return true;
    }
    
    // Check if avatar has been added
    if (newFormData.avatar && !originalData.avatar) {
      return true;
    }
    
    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for join_date field
    if (name === 'join_date') {
      console.log('Date input name:', name, 'value:', value);
      
      let newFormData;
      
      // Allow empty value or partial input
      if (!value || value.trim() === '') {
        newFormData = {
          ...formData,
          [name]: ''
        };
        console.log('Cleared join date');
      } else {
        // Always allow input, only validate when complete
        newFormData = {
          ...formData,
          [name]: value // Keep as string for all input
        };
        console.log('Date input updated:', value);
        
        // Only validate if the input looks like a complete date (has 2 slashes and 3 parts)
        if (value.includes('/') && value.split('/').length === 3) {
          const isoDate = parseDateFromDisplay(value);
          console.log('Parsed ISO date:', isoDate);
          
          if (isoDate) {
            newFormData = {
              ...formData,
              [name]: isoDate
            };
            console.log('Updated form data with ISO date:', newFormData[name]);
          } else {
            // Invalid date format - keep the input value but don't show error immediately
            // Error will be shown during submit if needed
            console.log('Invalid date format, keeping input value for now');
          }
        }
      }
      
      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
    } else {
      // Normal handling for other fields
      const newFormData = {
        ...formData,
        [name]: value
      };
      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh hợp lệ');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      // Show confirmation modal instead of directly setting the avatar
      setPendingAvatarFile(file);
      setShowAvatarConfirmModal(true);
    }
  };

  const confirmAvatarChange = () => {
    if (pendingAvatarFile) {
      const newFormData = {
        ...formData,
        avatar: pendingAvatarFile
      };
      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
      setShowAvatarConfirmModal(false);
      setPendingAvatarFile(null);
      toast.success('Ảnh đại diện đã được chọn. Vui lòng lưu thông tin để cập nhật.');
    }
  };

  const cancelAvatarChange = () => {
    setShowAvatarConfirmModal(false);
    setPendingAvatarFile(null);
    // Reset the file input
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const removeAvatar = () => {
    const newFormData = {
      ...formData,
      avatar: null
    };
    setFormData(newFormData);
    setHasChanges(checkForChanges(newFormData));
  };

  // Date formatting utilities for dd/mm/yyyy
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') return '';
    
    try {
      console.log('formatDateForDisplay input:', dateString);
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
        return '';
      }
      const formatted = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      console.log('formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.log('Error formatting date:', dateString, error);
      return '';
    }
  };

  const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    console.log('parseDateFromDisplay input:', displayDate);
    const result = convertDDMMYYYYToISO(displayDate);
    console.log('parseDateFromDisplay result:', result);
    return result;
  };




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data for API - ensure join_date is in ISO format
      const apiData = { ...formData };
      
      // Convert join_date to ISO format if it's not already
      if (apiData.join_date && typeof apiData.join_date === 'string') {
        console.log('handleSubmit - join_date before conversion:', apiData.join_date);
        if (apiData.join_date.includes('/')) {
          // Convert dd/mm/yyyy to ISO
          const isoDate = convertDDMMYYYYToISO(apiData.join_date);
          console.log('handleSubmit - convertDDMMYYYYToISO result:', isoDate);
          if (isoDate) {
            apiData.join_date = isoDate;
            console.log('handleSubmit - join_date after conversion:', apiData.join_date);
          } else {
            toast.error('Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
            setSaving(false);
            return;
          }
        }
      }
      
      // Debug: Log form data before sending
      console.log('Form data to be sent:', apiData);
      console.log('Join date value:', apiData.join_date);
      console.log('Join date type:', typeof apiData.join_date);
      
      await staffAPI.update(staffId, apiData);
      
      // Update original data and reset changes flag
      setOriginalData(formData);
      setHasChanges(false);
      
      setSuccessMessage('Thông tin nhân viên đã được cập nhật thành công!');
      setTimeout(() => {
        router.push('/admin/staff-management');
      }, 2000);
    } catch (err: any) {
      handleAPIError(err, 'Có lỗi xảy ra khi cập nhật thông tin nhân viên');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-600 font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user || user.role !== 'admin') {
    router.replace('/');
    return null;
  }

  // Success message
  if (successMessage) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <CheckCircleIcon style={{
            width: '3rem',
            height: '3rem',
            color: '#10b981',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            Cập nhật thành công!
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            {successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-blue-50/50"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
            <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại trang trước"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Chỉnh sửa nhân viên
                </h1>
                <p className="text-slate-600 mt-1">
                  Cập nhật thông tin chi tiết của nhân viên
                </p>
              </div>
            </div>

           
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cá nhân
              </h3>
              
              

              {/* Avatar Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {formData.avatar ? 'Ảnh đại diện mới' : 'Thay đổi ảnh đại diện'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {(() => {
                      console.log('Render avatar section:');
                      console.log('- formData.avatar:', formData.avatar);
                      console.log('- staff?.avatar:', staff?.avatar);
                      console.log('- staff?.full_name:', staff?.full_name);
                      
                      if (formData.avatar) {
                        console.log('Showing new avatar preview');
                        return (
                          // Hiển thị avatar mới được chọn
                          <div className="relative">
                            <img
                              src={formData.avatar ? URL.createObjectURL(formData.avatar) : ''}
                              alt="Avatar preview"
                              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={removeAvatar}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              Mới
                            </div>
                          </div>
                        );
                      } else if (staff?.avatar) {
                        console.log('Showing current avatar');
                        const avatarSrc = processAvatarUrl(staff.avatar);
                        console.log('Avatar src:', avatarSrc);
                        
                        return (
                          // Hiển thị avatar hiện tại
                          <div className="relative">
                            <img
                              src={avatarSrc}
                              alt="Current avatar"
                              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                              onError={(e) => {
                                console.log('Avatar load error, showing default avatar');
                                // Fallback to default avatar if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-avatar.svg';
                              }}
                              onLoad={() => {
                                console.log('Avatar loaded successfully');
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-medium">Thay đổi</span>
                            </div>
                          </div>
                        );
                      } else {
                        console.log('Showing placeholder');
                        return (
                          // Hiển thị avatar mặc định khi không có avatar
                          <div className="w-20 h-20 rounded-full border-2 border-slate-200 flex items-center justify-center">
                            <img
                              src="/default-avatar.svg"
                              alt="Default avatar"
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                        );
                      }
                    })()}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      {formData.avatar ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                      placeholder="0123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày vào làm
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="join_date"
                      value={formData.join_date && formData.join_date.includes('-') 
                        ? formatDateForDisplay(formData.join_date) 
                        : formData.join_date || ''}
                      onChange={handleInputChange}
                      placeholder="dd/mm/yyyy"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-indigo-600" />
                Thông tin chuyên môn
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vị trí công việc
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    placeholder="Ví dụ: Y tá, Bác sĩ, Nhân viên chăm sóc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bằng cấp
                  </label>
                  <div className="relative">
                    <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                      placeholder="Ví dụ: Đại học Y, Cao đẳng Điều dưỡng..."
                    />
                  </div>
                </div>

                
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                Ghi chú
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú bổ sung
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white resize-vertical"
                  placeholder="Nhập ghi chú về nhân viên (nếu có)..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <Link
                href="/admin/staff-management"
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200"
              >
                Hủy bỏ
              </Link>
              
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className={`px-8 py-3 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl ${
                  hasChanges 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    {hasChanges ? 'Cập nhật thông tin' : 'Không có thay đổi'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Avatar Confirmation Modal */}
      {showAvatarConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhotoIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Xác nhận thay đổi ảnh</h3>
              <p className="text-indigo-100 text-sm">
                Bạn có chắc chắn muốn thay đổi ảnh đại diện?
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Avatar Preview */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5 text-indigo-600" />
                  Ảnh đại diện mới
                </h4>
                <div className="flex justify-center">
                  <img
                    src={pendingAvatarFile ? URL.createObjectURL(pendingAvatarFile) : ''}
                    alt="New avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm text-slate-600">
                    Tên file: {pendingAvatarFile?.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Kích thước: {pendingAvatarFile?.size ? (pendingAvatarFile.size / 1024 / 1024).toFixed(2) : '0'} MB
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelAvatarChange}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmAvatarChange}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Xác nhận
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={cancelAvatarChange}
              className="absolute top-4 right-4 text-white hover:text-slate-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 