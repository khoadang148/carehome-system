"use client";

import { useState } from 'react';
import { 
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../lib/api';
import NotificationModal from '@/components/NotificationModal';
interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

export default function SettingsPage() {
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: '', color: '#d1d5db' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const validateCurrentPassword = (password: string): string => {
    if (!password) {
      return 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (password.length < 6) {
      return 'Mật khẩu hiện tại không hợp lệ';
    }
    return '';
  };

  const validateNewPassword = (password: string): string => {
    if (!password) {
      return 'Vui lòng nhập mật khẩu mới';
    }
    if (password.length < 8) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ cái thường';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ cái hoa';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)';
    }
    if (password === currentPassword) {
      return 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPwd: string): string => {
    if (!confirmPwd) {
      return 'Vui lòng xác nhận mật khẩu mới';
    }
    if (confirmPwd !== newPassword) {
      return 'Xác nhận mật khẩu không khớp';
    }
    return '';
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    let feedback = 'Rất yếu';
    let color = '#ef4444';

    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Rất yếu';
        color = '#ef4444';
        break;
      case 2:
        feedback = 'Yếu';
        color = '#f97316';
        break;
      case 3:
        feedback = 'Trung bình';
        color = '#eab308';
        break;
      case 4:
        feedback = 'Mạnh';
        color = '#22c55e';
        break;
      case 5:
        feedback = 'Rất mạnh';
        color = '#16a34a';
        break;
    }

    return { score, feedback, color };
  };

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    const error = validateCurrentPassword(value);
    setErrors(prev => ({ ...prev, currentPassword: error }));
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    const error = validateNewPassword(value);
    setErrors(prev => ({ ...prev, newPassword: error }));
    setPasswordStrength(calculatePasswordStrength(value));
    
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    const error = validateConfirmPassword(value);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const handleChangePassword = async () => {
    const currentError = validateCurrentPassword(currentPassword);
    const newError = validateNewPassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword);

    const newErrors = {
      currentPassword: currentError,
      newPassword: newError,
      confirmPassword: confirmError
    };

    setErrors(newErrors);

    if (currentError || newError || confirmError) {
      return;
    }

    setIsSubmitting(true);

    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      await userAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      setModalType('success');
      setModalTitle('Thành công');
      setModalMessage('Đổi mật khẩu thành công!');
      setModalOpen(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setPasswordStrength({ score: 0, feedback: '', color: '#d1d5db' });
    } catch (error: any) {
      const errorMessage = error?.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.';
      if (errorMessage.includes('Mật khẩu hiện tại không đúng') || 
          errorMessage.includes('Thông tin không hợp lệ')) {
        setModalType('info');
        setModalTitle('Thông báo');
        setModalMessage(errorMessage);
        setModalOpen(true);
        setErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' });
      } else if (errorMessage.includes('Phiên đăng nhập đã hết hạn')) {
        setModalType('warning');
        setModalTitle('Phiên đăng nhập');
        setModalMessage(errorMessage);
        setModalOpen(true);
        setErrors({ currentPassword: errorMessage });
      } else if (errorMessage.includes('Hệ thống đang gặp sự cố')) {
        setModalType('error');
        setModalTitle('Lỗi hệ thống');
        setModalMessage(errorMessage);
        setModalOpen(true);
        setErrors({ currentPassword: errorMessage });
      } else {
        setModalType('error');
        setModalTitle('Lỗi');
        setModalMessage(errorMessage);
        setModalOpen(true);
        setErrors({ currentPassword: errorMessage });
      }
    } finally {
      console.error = originalConsoleError;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại trang trước"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <CogIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-800 leading-tight">
                  Đổi mật khẩu
                </h1>
                <p className="text-gray-600 mt-3 font-medium">
                  Thay đổi mật khẩu truy cập
                </p>
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Đổi mật khẩu
            </h3>
            
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={`w-full px-3 py-3 pr-10 rounded-md border text-sm outline-none box-border bg-white ${
                      errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer"
                  >
                    {showCurrentPassword ? 
                      <EyeSlashIcon className="w-4 h-4 text-gray-500" /> :
                      <EyeIcon className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                </div>
                {errors.currentPassword && (
                  <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    {errors.currentPassword}
                  </div>
                )}
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className={`w-full px-3 py-3 pr-10 rounded-md border text-sm outline-none box-border bg-white ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer"
                  >
                    {showNewPassword ? 
                      <EyeSlashIcon className="w-4 h-4 text-gray-500" /> :
                      <EyeIcon className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                </div>
                
                
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Độ mạnh mật khẩu:</span>
                      <span 
                        className="text-xs font-medium"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {errors.newPassword && (
                  <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    {errors.newPassword}
                  </div>
                )}
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full px-3 py-3 pr-10 rounded-md border text-sm outline-none box-border bg-white ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer"
                  >
                    {showConfirmPassword ? 
                      <EyeSlashIcon className="w-4 h-4 text-gray-500" /> :
                      <EyeIcon className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              
              <div className="border-t border-gray-100 pt-4 flex justify-end gap-4 items-center">
                {passwordSuccess && (
                  <div className="text-green-700 text-sm flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Đổi mật khẩu thành công!
                  </div>
                )}
                
                <button
                  onClick={handleChangePassword}
                  disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                  className={`px-6 py-3 rounded-lg border-none text-white text-sm font-semibold flex items-center gap-2 transition-colors ${
                    isSubmitting || !currentPassword || !newPassword || !confirmPassword
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-4 h-4" />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <NotificationModal
        open={modalOpen}
        title={modalTitle}
        type={modalType}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
} 
