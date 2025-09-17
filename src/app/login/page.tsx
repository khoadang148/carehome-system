"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { clientStorage } from '@/lib/utils/clientStorage';
import { usePageTransition } from '@/lib/utils/pageTransition';
import LoginSpinner from '@/components/shared/LoginSpinner';
import {
  LockClosedIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  HeartIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import ErrorModal from '@/components/ErrorModal';
import NetworkStatus from '@/components/NetworkStatus';
import { authAPI } from '@/lib/api';
 

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const hasRedirected = useRef(false);
  const [, setSessionDebug] = useState({});
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { login, user, loading } = useAuth();
  const { startTransition: startPageTransition } = usePageTransition();

  useEffect(() => {
    router.prefetch('/family');
    router.prefetch('/admin');
    router.prefetch('/staff');
    router.prefetch('/register');
    if (returnUrl && returnUrl !== '/login') {
      router.prefetch(returnUrl);
    }
  }, [router, returnUrl]);

  useEffect(() => {
    if (!user || loading) {
      hasRedirected.current = false;
      return;
    }

    if (!hasRedirected.current) {
      hasRedirected.current = true;

      const redirectTo = (url: string) => {
        const role = typeof (user as any)?.role === 'string' ? ((user as any).role as string) : '';
        startPageTransition(url, role);
        router.push(url);
      };

      if (user.role === 'family') {
        redirectTo('/family');
      } else if (user.role === 'admin') {
        redirectTo('/admin');
      } else if (user.role === 'staff') {
        redirectTo('/staff');
      } else if (returnUrl && returnUrl !== '/login') {
        redirectTo(returnUrl);
      } else {
        redirectTo('/');
      }
    }
  }, [user, loading, returnUrl, startPageTransition]);

  useEffect(() => {
    const savedError = clientStorage.getItem('login_error');
    const savedSuccess = clientStorage.getItem('login_success');
    const savedAttempts = clientStorage.getItem('login_attempts');

    hasRedirected.current = false;

    if (!user && !loading && !messageDisplayed) {
      if (savedError) {
        setErrorMessage(savedError);
        setShowErrorModal(true);
        setMessageDisplayed(true);
      }
      if (savedSuccess) {
        setSuccess(savedSuccess);
        setMessageDisplayed(true);
      }
      if (savedAttempts) {
        setLoginAttempts(parseInt(savedAttempts));
      }
    } else if (user) {
      clientStorage.removeItem('login_error');
      setErrorMessage('');
      setShowErrorModal(false);
      setLoginAttempts(0);
    }
  }, [user, loading]);

  // Redux error handling removed; rely on login() throw/catch

  useEffect(() => {
    if (user && !loading) {
      setIsLoading(false);
      // Show success message when login is successful
      const savedSuccess = clientStorage.getItem('login_success');
      if (savedSuccess && !messageDisplayed) {
        setSuccess(savedSuccess);
        setMessageDisplayed(true);
        // Clear the success message after a short delay
        setTimeout(() => {
          setSuccess('');
          clientStorage.removeItem('login_success');
        }, 3000);
      }
    }
  }, [user, loading, messageDisplayed]);

  const setErrorWithModal = (errorMessage: string) => {
    setErrorMessage(errorMessage);
    setShowErrorModal(true);
    setMessageDisplayed(true);
    if (errorMessage) {
      clientStorage.setItem('login_error', errorMessage);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      clientStorage.setItem('login_attempts', newAttempts.toString());
    } else {
      clientStorage.removeItem('login_error');
      setLoginAttempts(0);
      clientStorage.removeItem('login_attempts');
    }
  };

  // Removed unused setSuccessWithStorage helper

  // Removed secondary redirect effect using shouldRedirect (now redundant)

  useEffect(() => {
    setSessionDebug({
      access_token: clientStorage.getItem('access_token'),
      user: clientStorage.getItem('user'),
      session_start: clientStorage.getItem('session_start'),
    });
  }, [user, loading]);

  useEffect(() => {
    if (!user && !loading) {
      const hasLoggedOut = clientStorage.getItem('has_logged_out');
      if (hasLoggedOut) {
        clientStorage.removeItem('login_success');
        setSuccess('');
        setMessageDisplayed(false);
        clientStorage.removeItem('has_logged_out');
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (messageDisplayed && !errorMessage && !success) {
      const savedError = clientStorage.getItem('login_error');
      const savedSuccess = clientStorage.getItem('login_success');

      if (savedError) {
        setErrorMessage(savedError);
        setShowErrorModal(true);
      }
      if (savedSuccess) {
        setSuccess(savedSuccess);
      }
    }
  }, [messageDisplayed, errorMessage, success]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    clientStorage.removeItem('login_error');

    if (!email.trim() || !password.trim()) {
      setErrorWithModal('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setShowErrorModal(false);
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Yêu cầu hết thời gian chờ. Vui lòng thử lại.')), 2000);
      });

      const result = await Promise.race([login(email, password), timeoutPromise]);
      const typedUser = result as any;

      if (!typedUser) {
        setIsLoading(false);
        setSuccess('');
        clientStorage.removeItem('login_success');
        setErrorWithModal('Email hoặc mật khẩu không đúng');
        setEmail('');
        setPassword('');
        return;
      }

      clientStorage.removeItem('login_error');
      setSuccess(typedUser.name || '');
      clientStorage.setItem('login_success', `${typedUser.name || 'bạn'}!`);
    } catch (err: any) {
      setIsLoading(false);
      setSuccess('');
      clientStorage.removeItem('login_success');

      if (err?.message?.includes('Yêu cầu hết thời gian chờ')) {
        setErrorWithModal('Kết nối chậm, vui lòng thử lại');
      } else if (err?.message) {
        setErrorWithModal(err.message);
      } else {
        setErrorWithModal('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      }
      setEmail('');
      setPassword('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail.trim()) {
      setErrorWithModal('Vui lòng nhập email của bạn');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setErrorWithModal('Email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    setIsForgotPasswordLoading(true);

    try {
      const result = await authAPI.forgotPassword(forgotPasswordEmail);

      if (result.success) {
        setSuccess('Mật khẩu mới đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.');
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
        setErrorMessage('');
        setShowErrorModal(false);
      } else {
        setErrorWithModal(result.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
      }
    } catch (err: any) {
      setErrorWithModal(err.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotPasswordEmail(e.target.value);
  };

  useEffect(() => {
    const handleUnload = () => {
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  useEffect(() => {
    console.log('📱 LoginPage mounted');
    return () => {
      console.log('📱 LoginPage unmounted');
    };
  }, []);

  return (
    <>
      <NetworkStatus />
      <ErrorModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Đăng nhập thất bại"
        message={errorMessage}
        type="error"
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-pink-200 to-purple-200 relative overflow-hidden">
        <div className="flex min-h-screen relative z-10">
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-amber-50 to-pink-200 border border-white/80 shadow-2xl">
            <div className="text-center relative z-10 max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/30 relative">
                <BuildingOffice2Icon className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg border border-white/40">
                  <HeartIcon className="w-4 h-4 text-white" />
                </div>
              </div>

              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-blue-500 to-amber-500 bg-clip-text text-transparent mb-4 tracking-tight">
                CareHome
              </h1>

              <p className="text-lg text-gray-600 mb-10 font-medium leading-relaxed">
                Hệ thống quản lý viện dưỡng lão<br />
                <span className="text-emerald-600 font-semibold">Chuyên nghiệp • An toàn • Tận tâm</span>
              </p>

              <div className="my-8 p-10 bg-white/55 rounded-3xl border-2 border-white/70 shadow-xl relative overflow-hidden">
                <div className="flex justify-center items-center w-full h-72 overflow-hidden rounded-3xl relative z-10 shadow-lg">
                  <img
                    src="https://th.bing.com/th/id/OIP.nJ4wfcDXbII6LeT_CkbhOAHaHa?r=0&w=740&h=740&rs=1&pid=ImgDetMain"
                    alt="Elderly Care Services - Caregiver Support Illustration"
                    className="w-full h-full object-cover rounded-2xl filter drop-shadow-lg brightness-110 contrast-110 saturate-115"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-15 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: HeartIcon,
                    title: 'Chăm sóc tận tâm',
                    description: 'Theo dõi sức khỏe 24/7 với đội ngũ y bác sĩ chuyên nghiệp',
                    color: 'text-red-500'
                  },
                  {
                    icon: UserGroupIcon,
                    title: 'Kết nối gia đình',
                    description: 'Cập nhật thông tin thời gian thật cho người thân',
                    color: 'text-purple-500'
                  },
                  {
                    icon: ShieldCheckIcon,
                    title: 'Bảo mật cao',
                    description: 'Dữ liệu được bảo vệ theo tiêu chuẩn y tế quốc tế',
                    color: 'text-blue-500'
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-4 p-5 bg-white/70 rounded-xl border border-white/50 backdrop-blur-md">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${feature.color.split('-')[1]}-500/20 to-${feature.color.split('-')[1]}-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-${feature.color.split('-')[1]}-500/30`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        {feature.title}
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 bg-white/95 backdrop-blur-xl">
            <div className="w-full max-w-lg max-h-screen bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-10 pb-6 bg-gradient-to-br from-green-200 to-blue-200 border-b border-gray-100 relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative">
                    <LockClosedIcon className="w-7 h-7 text-white" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <HeartIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Đăng nhập
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Vui lòng nhập thông tin đăng nhập của bạn
                  </p>
                </div>
              </div>

              <div className="p-10">
                {loginAttempts >= 3 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg mb-4 text-sm border border-amber-200 font-medium">
                    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Quá nhiều lần đăng nhập sai. Vui lòng kiểm tra lại thông tin.</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm border border-green-200 font-medium animate-in slide-in-from-top-2 duration-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                    <span className="font-medium">Chào mừng {success}</span>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6" noValidate>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Địa chỉ email
                    </label>
                    <div className="relative">
                      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-none z-10">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={handleEmailChange}
                        className="w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-none z-10">
                        <LockClosedIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập mật khẩu của bạn"
                        value={password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3.5 pl-11 pr-11 text-sm text-gray-800 bg-white rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-1 rounded hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {showPassword ?
                          <EyeSlashIcon className="w-5 h-5" /> :
                          <EyeIcon className="w-5 h-5" />
                        }
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(true)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-emerald-800 font-semibold mb-1">
                        Bảo mật thông tin
                      </div>
                      <div className="text-xs text-emerald-700 leading-relaxed">
                        Dữ liệu được mã hóa và bảo mật theo tiêu chuẩn y tế quốc tế
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:opacity-70 rounded-xl border-none cursor-pointer mt-2 shadow-lg disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang kết nối...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <LockClosedIcon className="w-5 h-5" />
                        <span>Đăng nhập</span>
                      </div>
                    )}
                  </button>
                </form>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Chưa có tài khoản?
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300/70 hover:decoration-emerald-400"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoginSpinner isLoading={isLoading} />

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <QuestionMarkCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Quên mật khẩu</h3>
                  <p className="text-sm text-gray-500">Nhập email để đặt lại mật khẩu</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordEmail('');
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Địa chỉ email
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-none z-10">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="forgot-email"
                    name="forgot-email"
                    type="email"
                    placeholder="example@email.com"
                    value={forgotPasswordEmail}
                    onChange={handleForgotPasswordEmailChange}
                    className="w-full px-4 py-3 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-amber-800 font-semibold mb-1">
                      Lưu ý quan trọng
                    </div>
                    <div className="text-xs text-amber-700 leading-relaxed">
                      Mật khẩu mới sẽ được gửi về email của bạn. Vui lòng kiểm tra hộp thư và thư mục spam.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotPasswordEmail('');
                  }}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl border-none cursor-pointer transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isForgotPasswordLoading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 rounded-xl border-none cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isForgotPasswordLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </div>
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}