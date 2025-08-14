"use client";

import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
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

export default function AddStaffPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      join_date: value
    }));
  };



  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        return;
      }
      
      // Fallback for older browsers or non-secure contexts
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
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        toast.error('❌ Không thể copy tự động. Vui lòng copy thủ công:\n\n' + text);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('❌ Không thể copy tự động. Vui lòng copy thủ công:\n\n' + text);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate phone number if provided
    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Số điện thoại phải có 10-15 chữ số');
        return;
      }
    }

    // Validate password if not auto-generating
    if (!formData.autoGeneratePassword) {
      if (!formData.password.trim()) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }
      
      if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
    }

    // Validate join_date - không cho phép ngày trong tương lai
    if (formData.join_date) {
      // Parse date from dd/mm/yyyy format
      const parsedDate = parseDateFromDisplay(formData.join_date);
      if (!parsedDate) {
        setError('Ngày vào làm không đúng định dạng dd/mm/yyyy');
        return;
      }
      
      const joinDate = new Date(parsedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (joinDate > today) {
        setError('Ngày vào làm không thể là ngày trong tương lai');
        return;
      }
    }

    try {
      setSaving(true);
      setError('');
      
      // Generate username from email
      const emailPrefix = formData.email.split('@')[0];
      let username = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      // Add random number to avoid conflicts
      const randomSuffix = Math.floor(Math.random() * 1000);
      username = `${username}_${randomSuffix}`;
      
      // Generate password if auto-generating
      let password = formData.password;
      if (formData.autoGeneratePassword) {
        // Generate a random password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        password = '';
        for (let i = 0; i < 8; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      
      // Prepare data for API
      const staffData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '0000000000', // Default phone if empty
        username: username,
        password: password,
        role: 'staff',
        status: formData.status,
        position: formData.position.trim() || undefined,
        qualification: formData.qualification.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        // Ensure join_date is in correct format and not in future
        join_date: formData.join_date ? (() => {
          const parsedDate = parseDateFromDisplay(formData.join_date);
          if (!parsedDate) return undefined;
          
          const date = new Date(parsedDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // If date is in future, use today's date
          if (date > today) {
            return today.toISOString().split('T')[0];
          }
          
          return date.toISOString().split('T')[0];
        })() : undefined,
        // Add avatar if exists
        ...(formData.avatar && { avatar: formData.avatar })
      };
      
      console.log('Sending staff data:', staffData);
      
      const result = await staffAPI.create(staffData);
      
      // Add password to result for display (both auto-generated and manual)
      if (formData.autoGeneratePassword) {
        result.tempPassword = password;
      } else {
        result.password = password; // Lưu mật khẩu thủ công
      }
      
      setCreatedAccount(result);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error creating staff:', err);
      
      const errorResult = UserFriendlyErrorHandler.handleError(err);
      setError(errorResult.message);
      
      // Set field-specific errors if any
      if (errorResult.fieldErrors && Object.keys(errorResult.fieldErrors).length > 0) {
        // setValidationErrors(errorResult.fieldErrors); // This state is not defined in the original file
      }
    } finally {
      setSaving(false);
    }
  };

  // Loading state
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
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Thêm nhân viên mới
                </h1>
                <p className="text-slate-600 mt-1">
                  Tạo nhân viên và tài khoản đăng nhập trong hệ thống
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
            {/* Account Information */}
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
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                      placeholder="example@email.com"
                    />
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
                            required={!formData.autoGeneratePassword}
                            minLength={6}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                          />
                        </div>
                        
                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required={!formData.autoGeneratePassword}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                            placeholder="Xác nhận mật khẩu"
                          />
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

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cá nhân
              </h3>
              
              {/* Avatar Upload */}
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
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    placeholder="Nhập họ và tên"
                  />
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
                      value={formData.join_date}
                      onChange={handleDateChange}
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                  >
                    <option value="active">Đang làm việc</option>
                    <option value="inactive">Nghỉ việc</option>
                  </select>
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

      {/* Success Modal */}
      {showSuccessModal && createdAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 drop-shadow-lg" />
              <h3 className="text-xl font-bold mb-2">Hoàn thành!</h3>
              <p className="text-green-100 text-sm">
                Nhân viên <strong>{createdAccount.full_name}</strong> đã được thêm vào hệ thống
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Staff Info */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  Thông tin nhân viên
                </h4>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Tên:</span>
                    <span className="font-semibold text-slate-900">{createdAccount.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Vị trí:</span>
                    <span className="font-semibold text-slate-900">{createdAccount.position || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Trạng thái:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      createdAccount.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {createdAccount.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Info */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <LockClosedIcon className="w-4 h-4 text-indigo-600" />
                  Thông tin đăng nhập
                </h4>
                <div className="space-y-2">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="flex-1 font-mono text-slate-900 font-medium text-xs">
                        {createdAccount.email}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdAccount.email)}
                        className="px-1.5 py-0.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <ClipboardDocumentIcon className="w-3 h-3" />
                        Sao chép
                      </button>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tên đăng nhập
                    </label>
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="flex-1 font-mono text-slate-900 font-medium text-xs">
                        {createdAccount.username}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdAccount.username)}
                        className="px-1.5 py-0.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <ClipboardDocumentIcon className="w-3 h-3" />
                        Sao chép
                      </button>
                    </div>
                  </div>

                  {/* Password - Hiển thị cả khi random và không random */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mật khẩu
                    </label>
                    <div className="flex items-center gap-2 p-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="flex-1 font-mono text-slate-900 font-medium tracking-wider text-xs">
                        {createdAccount.tempPassword || createdAccount.password || 'Không có mật khẩu'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdAccount.tempPassword || createdAccount.password || '')}
                        className="px-1.5 py-0.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <ClipboardDocumentIcon className="w-3 h-3" />
                        Sao chép
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-yellow-800 mb-1">
                      Lưu ý quan trọng
                    </h4>
                    <ul className="text-yellow-700 space-y-0.5 text-xs">
                      <li>• Vui lòng lưu lại thông tin đăng nhập này một cách an toàn</li>
                      <li>• Mật khẩu sẽ không thể xem lại sau khi đóng modal này</li>
                      <li>• Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                      <li>• Nếu quên mật khẩu, liên hệ quản trị viên để được hỗ trợ</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Copy Success Message */}
              {copySuccess && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span className="font-medium text-xs">✅ Đã sao chép thông tin vào clipboard!</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const loginInfo = `Thông tin đăng nhập:\nEmail: ${createdAccount.email}\nUsername: ${createdAccount.username}\nMật khẩu: ${createdAccount.tempPassword || createdAccount.password || 'Không có mật khẩu'}`;
                    copyToClipboard(loginInfo);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 text-xs"
                >
                  <ClipboardDocumentIcon className="w-3 h-3" />
                  Sao chép tất cả
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/admin/staff-management');
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-xs"
                >
                  Hoàn tất
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
              className="absolute top-3 right-3 text-white hover:text-slate-200 transition-colors p-1"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 