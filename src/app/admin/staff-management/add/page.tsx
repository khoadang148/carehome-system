"use client";

import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter } from 'next/navigation';
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
  LockClosedIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAPI } from '@/lib/api';
import { UserFriendlyErrorHandler } from '@/lib/utils/user-friendly-errors';
import '@/components/success-modal.css';

export default function AddStaffPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState({
    full_name: '',
    email: '',
    phone: '',
    join_date: '',
    position: '',
    qualification: '',
    password: '',
    confirmPassword: ''
  });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: '',
    qualification: '',
    status: 'active',
    notes: '',
    join_date: '',
    role: 'staff',
    autoGeneratePassword: true,
    avatar: null as File | null
  });

  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          error = 'Họ và tên không được để trống';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Email không đúng định dạng';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Số điện thoại không được để trống';
        } else if (!/^[0-9]{10,15}$/.test(value.trim())) {
          error = 'Số điện thoại phải có 10-15 chữ số';
        }
        break;
      case 'join_date':
        if (!value.trim()) {
          error = 'Ngày vào làm không được để trống';
        } else {
          const parsedDate = parseDateFromDisplay(value);
          if (!parsedDate) {
            error = 'Ngày vào làm không đúng định dạng dd/mm/yyyy';
          } else {
            const joinDate = new Date(parsedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (joinDate > today) {
              error = 'Ngày vào làm không thể là ngày trong tương lai';
            }
          }
        }
        break;
      case 'position':
        if (!value.trim()) {
          error = 'Vị trí công việc không được để trống';
        }
        break;
      case 'qualification':
        if (!value.trim()) {
          error = 'Bằng cấp không được để trống';
        }
        break;
      case 'password':
        if (!formData.autoGeneratePassword && !value.trim()) {
          error = 'Mật khẩu không được để trống';
        } else if (!formData.autoGeneratePassword && value.length < 6) {
          error = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        break;
      case 'confirmPassword':
        if (!formData.autoGeneratePassword && !value.trim()) {
          error = 'Xác nhận mật khẩu không được để trống';
        } else if (!formData.autoGeneratePassword && value !== formData.password) {
          error = 'Mật khẩu xác nhận không khớp';
        }
        break;
    }
    
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file hình ảnh hợp lệ');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      setError('');
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      join_date: value
    }));
  };



  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }

      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        toast.error('❌ Không thể copy tự động. Vui lòng copy thủ công:\n\n' + text);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('❌ Không thể copy tự động. Vui lòng copy thủ công:\n\n' + text);
    }
  };

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


  const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const newFieldErrors: typeof fieldErrors = { ...fieldErrors };

    // Validate all required fields
    const fieldsToValidate = ['full_name', 'email', 'phone', 'join_date', 'position', 'qualification'];
    if (!formData.autoGeneratePassword) {
      fieldsToValidate.push('password', 'confirmPassword');
    }

    for (const key of fieldsToValidate) {
      const value = formData[key as keyof typeof formData];
      const error = validateField(key, typeof value === 'string' ? value : '');
      newFieldErrors[key as keyof typeof fieldErrors] = error;
      if (error) {
        hasError = true;
      }
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    try {
      setSaving(true);
      setError('');

      const emailPrefix = formData.email.split('@')[0];
      let username = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      const randomSuffix = Math.floor(Math.random() * 1000);
      username = `${username}_${randomSuffix}`;

      let password = formData.password;
      if (formData.autoGeneratePassword) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        password = '';
        for (let i = 0; i < 8; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }

      const staffData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '0000000000',
        username: username,
        password: password,
        role: 'staff',
        status: formData.status,
        position: formData.position.trim() || undefined,
        qualification: formData.qualification.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        join_date: formData.join_date ? (() => {
          const parsedDate = parseDateFromDisplay(formData.join_date);
          if (!parsedDate) return undefined;

          const date = new Date(parsedDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (date > today) {
            return today.toISOString().split('T')[0];
          }

          return date.toISOString().split('T')[0];
        })() : undefined,
        ...(formData.avatar && { avatar: formData.avatar })
      };

      const result = await staffAPI.create(staffData);

      if (formData.autoGeneratePassword) {
        result.tempPassword = password;
      } else {
        result.password = password;
      }

      setCreatedAccount(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorResult = UserFriendlyErrorHandler.handleError(err);
      setError(errorResult.message);

      if (errorResult.fieldErrors && Object.keys(errorResult.fieldErrors).length > 0) {
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Thêm nhân viên mới
                </h1>
                <p className="text-slate-600 mt-1">
                  Thêm nhân viên và tài khoản đăng nhập trong hệ thống
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <LockClosedIcon className="w-5 h-5 text-indigo-600" />
                Thông tin tài khoản
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      onBlur={handleBlur}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.email 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-slate-300'
                      }`}
                      placeholder="example@email.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tùy chọn mật khẩu
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoGeneratePassword"
                        checked={formData.autoGeneratePassword}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          autoGeneratePassword: e.target.checked,
                          password: e.target.checked ? '' : prev.password,
                          confirmPassword: e.target.checked ? '' : prev.confirmPassword
                        }))}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Tự động tạo mật khẩu</span>
                    </label>

                    {!formData.autoGeneratePassword && (
                      <div className="space-y-3 pl-7">
                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required={!formData.autoGeneratePassword}
                            minLength={6}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                              fieldErrors.password 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-slate-300'
                            }`}
                            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                          />
                          {fieldErrors.password && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                          )}
                        </div>

                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required={!formData.autoGeneratePassword}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                              fieldErrors.confirmPassword 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                : 'border-slate-300'
                            }`}
                            placeholder="Xác nhận mật khẩu"
                          />
                          {fieldErrors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formData.autoGeneratePassword && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-blue-500 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Mật khẩu sẽ được tạo tự động</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Hệ thống sẽ tạo mật khẩu ngẫu nhiên và gửi thông tin đăng nhập đến email của nhân viên.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cá nhân
              </h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Ảnh đại diện
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {formData.avatar ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(formData.avatar)}
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
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                        <PhotoIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
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
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      fieldErrors.full_name 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-300'
                    }`}
                    placeholder="Nhập họ và tên"
                  />
                  {fieldErrors.full_name && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>
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
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.phone 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-slate-300'
                      }`}
                      placeholder="0123456789"
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
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
                      value={formData.join_date}
                      onChange={handleDateChange}
                      onBlur={handleBlur}
                      placeholder="dd/mm/yyyy"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.join_date 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-slate-300'
                      }`}
                    />
                    {fieldErrors.join_date && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.join_date}</p>
                    )}
                  </div>

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
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                      fieldErrors.position 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-300'
                    }`}
                    placeholder="Ví dụ: Y tá, Bác sĩ, Nhân viên chăm sóc..."
                  />
                  {fieldErrors.position && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.position}</p>
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
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
                        fieldErrors.qualification 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-slate-300'
                      }`}
                      placeholder="Ví dụ: Đại học Y, Cao đẳng Điều dưỡng..."
                    />
                    {fieldErrors.qualification && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.qualification}</p>
                    )}
                  </div>
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
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Tạo nhân viên
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccessModal && createdAccount && (
        <div className="success-modal-overlay" style={{ justifyContent: 'center' }}>
          <div className="success-modal-content" style={{ minWidth: 520, maxWidth: 640, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '0.75rem',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
              }}>
                <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <h2 className="success-title" style={{ margin: 0 }}>Tạo thành công!</h2>
            </div>
            <p className="success-message" style={{ marginTop: 0 }}>
              Nhân viên <b>{createdAccount.full_name}</b> đã được thêm vào hệ thống
            </p>

            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Tên đăng nhập</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    position: 'relative'
                  }}>
                    <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
                      {createdAccount.username}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdAccount.username, 'username')}
                      style={{
                        width: '1.9rem',
                        height: '1.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: copiedField === 'username' ? '#dcfce7' : '#eef2ff',
                        color: copiedField === 'username' ? '#16a34a' : '#2563eb',
                        border: `1px solid ${copiedField === 'username' ? '#86efac' : '#c7d2fe'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      title="Sao chép"
                    >
                      {copiedField === 'username' ? (
                        <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Mật khẩu</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    position: 'relative'
                  }}>
                    <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: '#111827', letterSpacing: '0.08em' }}>
                      {createdAccount.tempPassword || createdAccount.password || 'Không có mật khẩu'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdAccount.tempPassword || createdAccount.password || '', 'password')}
                      style={{
                        width: '1.9rem',
                        height: '1.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: copiedField === 'password' ? '#dcfce7' : '#eef2ff',
                        color: copiedField === 'password' ? '#16a34a' : '#2563eb',
                        border: `1px solid ${copiedField === 'password' ? '#86efac' : '#c7d2fe'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      title="Sao chép"
                    >
                      {copiedField === 'password' ? (
                        <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Email</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    position: 'relative'
                  }}>
                    <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
                      {createdAccount.email}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdAccount.email, 'email')}
                      style={{
                        width: '1.9rem',
                        height: '1.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: copiedField === 'email' ? '#dcfce7' : '#eef2ff',
                        color: copiedField === 'email' ? '#16a34a' : '#2563eb',
                        border: `1px solid ${copiedField === 'email' ? '#86efac' : '#c7d2fe'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                      title="Sao chép"
                    >
                      {copiedField === 'email' ? (
                        <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                      ) : (
                        <ClipboardDocumentIcon style={{ width: '1rem', height: '1rem' }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Vai trò</label>
                  <div style={{ padding: '0.6rem 0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontWeight: 600, color: '#111827' }}>
                    Nhân viên
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/admin/staff-management');
                }}
                className="success-close-btn"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 