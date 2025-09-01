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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

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

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchStaff = async () => {
      try {
        setLoadingData(true);
        const data = await staffAPI.getById(staffId);
        setStaff(data);

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
                return '';
              }
              return date.toISOString().split('T')[0];
            } catch (error) {
              return '';
            }
          })() : '',
          avatar: null
        };



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

  const validateField = (field: string, value: any) => {
    let errorMessage = '';
    
    switch (field) {
      case 'full_name':
        if (!value || !value.trim()) {
          errorMessage = 'Họ và tên không được để trống';
        } else if (value.trim().length < 2) {
          errorMessage = 'Họ và tên phải có ít nhất 2 ký tự';
        }
        break;
      case 'email':
        if (!value || !value.trim()) {
          errorMessage = 'Email không được để trống';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errorMessage = 'Email không đúng định dạng';
          }
        }
        break;
      case 'phone':
        if (!value || !value.trim()) {
          errorMessage = 'Số điện thoại không được để trống';
        } else {
          const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
          if (!phoneRegex.test(value)) {
            errorMessage = 'Số điện thoại không đúng định dạng Việt Nam';
          }
        }
        break;
      case 'position':
        if (!value || !value.trim()) {
          errorMessage = 'Vị trí công việc không được để trống';
        }
        break;
      case 'qualification':
        if (!value || !value.trim()) {
          errorMessage = 'Bằng cấp không được để trống';
        }
        break;
      case 'join_date':
        if (!value || !value.trim()) {
          errorMessage = 'Ngày vào làm không được để trống';
        } else {
          // Kiểm tra cả định dạng dd/mm/yyyy và ISO format
          const ddmmRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
          
          const isDDMM = ddmmRegex.test(value);
          const isISO = isoRegex.test(value);
          
          if (!isDDMM && !isISO) {
            errorMessage = 'Ngày vào làm phải theo định dạng dd/mm/yyyy';
          } else {
            // Kiểm tra ngày hợp lệ
            let dateToCheck = value;
            if (isDDMM) {
              const isoDate = convertDDMMYYYYToISO(value);
              if (!isoDate) {
                errorMessage = 'Ngày không hợp lệ';
              } else {
                dateToCheck = isoDate;
              }
            }
            
            if (dateToCheck) {
              const date = new Date(dateToCheck);
              if (isNaN(date.getTime())) {
                errorMessage = 'Ngày không hợp lệ';
              }
            }
          }
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: errorMessage }));
    return errorMessage === '';
  };

  const checkForChanges = (newFormData: any) => {
    if (!originalData) return false;

    const textFields = ['full_name', 'email', 'phone', 'position', 'qualification', 'notes'];
    for (const field of textFields) {
      if (newFormData[field] !== originalData[field]) {
        return true;
      }
    }

    // So sánh ngày tháng
    const normalizeDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string' && date.includes('-')) {
        // ISO format, chuyển về dd/mm/yyyy để so sánh
        try {
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) return '';
          return dateObj.toLocaleDateString('vi-VN');
        } catch {
          return '';
        }
      }
      if (typeof date === 'string' && date.includes('/')) {
        return date; // Giữ nguyên định dạng dd/mm/yyyy
      }
      return date;
    };

    const originalDate = normalizeDate(originalData.join_date);
    const newDate = normalizeDate(newFormData.join_date);

    if (originalDate !== newDate) {
      return true;
    }

    if (newFormData.status !== originalData.status) {
      return true;
    }

    if (newFormData.avatar && !originalData.avatar) {
      return true;
    }

    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'join_date') {
      let newFormData;

      if (!value || value.trim() === '') {
        newFormData = {
          ...formData,
          [name]: ''
        };
      } else {
        newFormData = {
          ...formData,
          [name]: value
        };

        // Không chuyển đổi ngay lập tức, giữ nguyên định dạng dd/mm/yyyy
        // Chỉ chuyển đổi khi submit
      }

      setFormData(newFormData);
      setHasChanges(checkForChanges(newFormData));
    } else {
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
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh hợp lệ');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

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

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      const formatted = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return formatted;
    } catch (error) {
      return '';
    }
  };

  const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    const result = convertDDMMYYYYToISO(displayDate);
    return result;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate tất cả trường bắt buộc
    const requiredFields = ['full_name', 'email', 'phone', 'position', 'qualification', 'join_date'];
    let hasValidationError = false;

    for (const field of requiredFields) {
      const isValid = validateField(field, formData[field as keyof typeof formData]);
      if (!isValid) {
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      return;
    }

    try {
      setSaving(true);

      const apiData = { ...formData };

      if (apiData.join_date && typeof apiData.join_date === 'string') {
        if (apiData.join_date.includes('/')) {
          const isoDate = convertDDMMYYYYToISO(apiData.join_date);
          if (isoDate) {
            apiData.join_date = isoDate;
          } else {
            toast.error('Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
            setSaving(false);
            return;
          }
        }
      }

      await staffAPI.update(staffId, apiData);

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

  if (!user || user.role !== 'admin') {
    router.replace('/');
    return null;
  }

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
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-blue-50/50"></div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
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
                  Chỉnh sửa thông tin
                </h1>
                <p className="text-slate-600 mt-1">
                  Cập nhật thông tin chi tiết của nhân viên
                </p>
              </div>
            </div>


          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cá nhân
              </h3>



              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {formData.avatar ? 'Ảnh đại diện mới' : 'Thay đổi ảnh đại diện'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {(() => {
                      if (formData.avatar) {
                        return (
                          <div className="relative">
                            {formData.avatar && (
                              <img
                                src={URL.createObjectURL(formData.avatar)}
                                alt="Avatar preview"
                                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                              />
                            )}
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
                        const avatarSrc = processAvatarUrl(staff.avatar);

                        return (
                          <div className="relative">
                            <img
                              src={avatarSrc}
                              alt="Current avatar"
                              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-avatar.svg';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-medium">Thay đổi</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
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
                    onBlur={() => validateField('full_name', formData.full_name)}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      fieldErrors.full_name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Nhập họ và tên"
                  />
                  {fieldErrors.full_name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.full_name}
                    </p>
                  )}
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
                      onBlur={() => validateField('email', formData.email)}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="example@email.com"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={() => validateField('phone', formData.phone)}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="0123456789"
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày vào làm <span className="text-red-500">*</span>
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
                      onBlur={() => validateField('join_date', formData.join_date)}
                      required
                      placeholder="dd/mm/yyyy"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.join_date ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.join_date && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.join_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-indigo-600" />
                Thông tin chuyên môn
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vị trí công việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    onBlur={() => validateField('position', formData.position)}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      fieldErrors.position ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Ví dụ: Y tá, Bác sĩ, Nhân viên chăm sóc..."
                  />
                  {fieldErrors.position && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bằng cấp <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      onBlur={() => validateField('qualification', formData.qualification)}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.qualification ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="Ví dụ: Đại học Y, Cao đẳng Điều dưỡng..."
                    />
                  </div>
                  {fieldErrors.qualification && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.qualification}
                    </p>
                  )}
                </div>


              </div>
            </div>

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
                className={`px-8 py-3 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl ${hasChanges
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

      {showAvatarConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhotoIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Xác nhận thay đổi ảnh</h3>
              <p className="text-indigo-100 text-sm">
                Bạn có chắc chắn muốn thay đổi ảnh đại diện?
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5 text-indigo-600" />
                  Ảnh đại diện mới
                </h4>
                <div className="flex justify-center">
                  {pendingAvatarFile && (
                    <img
                      src={URL.createObjectURL(pendingAvatarFile)}
                      alt="New avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                    />
                  )}
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