"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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

export default function EditStaffPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

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
        
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          qualification: data.qualification || '',
          status: data.status || 'active',
          notes: data.notes || '',
          join_date: data.join_date ? new Date(data.join_date).toISOString().split('T')[0] : '',
          avatar: null
        });
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin nhân viên');
      } finally {
        setLoadingData(false);
      }
    };

    fetchStaff();
  }, [user, staffId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file hình ảnh hợp lệ');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      setError(''); // Clear any previous errors
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null
    }));
  };

  // Date formatting utilities
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const year = parseInt(parts[2]);
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value) {
      const isoDate = parseDateFromDisplay(value);
      setFormData(prev => ({
        ...prev,
        join_date: isoDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        join_date: ''
      }));
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      join_date: value
    }));
    setShowDatePicker(false);
  };

  // Handle date picker click
  useEffect(() => {
    if (showDatePicker && dateInputRef.current) {
      // Focus on the date input when picker opens
      setTimeout(() => {
        dateInputRef.current?.focus();
      }, 100);
    }
  }, [showDatePicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await staffAPI.update(staffId, formData);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-blue-50/50"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/admin/staff-management"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
            <div className="flex items-center gap-4 mb-6">
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}



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
                                console.log('Avatar load error, showing fallback');
                                // Fallback to default avatar if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                              onLoad={() => {
                                console.log('Avatar loaded successfully');
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-medium">Thay đổi</span>
                            </div>
                            {/* Fallback avatar */}
                            <div className="w-20 h-20 rounded-full border-2 border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg hidden">
                              {staff.full_name?.charAt(0) || 'N'}
                            </div>
                          </div>
                        );
                      } else {
                        console.log('Showing placeholder');
                        return (
                          // Hiển thị placeholder khi không có avatar
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                            <PhotoIcon className="w-8 h-8 text-slate-400" />
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

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày vào làm
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="join_date_display"
                      value={formatDateForDisplay(formData.join_date)}
                      onChange={handleDateChange}
                      placeholder="dd/mm/yyyy"
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <CalendarIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Custom date picker */}
                  {showDatePicker && (
                    <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-3 min-w-[280px]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-900">Chọn ngày</h4>
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      </div>
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={formatDateForInput(formData.join_date)}
                        onChange={handleDatePickerChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onBlur={() => setTimeout(() => setShowDatePicker(false), 200)}
                      />
                      <div className="mt-3 text-xs text-slate-500">
                        Hoặc nhập trực tiếp theo định dạng dd/mm/yyyy
                      </div>
                    </div>
                  )}
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
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Cập nhật thông tin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Cập nhật thành công!</h3>
              <p className="text-green-100 text-sm">
                Thông tin nhân viên đã được cập nhật thành công
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Updated Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                  Thông tin đã cập nhật
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-sm">Tên:</span>
                    <span className="font-medium text-slate-900">{formData.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-sm">Email:</span>
                    <span className="font-medium text-slate-900">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-sm">Vị trí:</span>
                    <span className="font-medium text-slate-900">{formData.position || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 text-sm">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formData.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {formData.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                    </span>
                  </div>
                  {formData.avatar && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Ảnh đại diện:</span>
                      <span className="font-medium text-green-600">✅ Đã cập nhật</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar Preview if updated */}
              {formData.avatar && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-indigo-600" />
                    Ảnh đại diện mới
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src={formData.avatar ? URL.createObjectURL(formData.avatar) : ''}
                      alt="New avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-green-200 shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/admin/staff-management');
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Quay lại danh sách
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset form to show updated data
                    window.location.reload();
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/admin/staff-management');
              }}
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