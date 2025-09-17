"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { clientStorage } from '@/lib/utils/clientStorage';
import { EnvelopeIcon, LockClosedIcon, UserIcon, ArrowLeftIcon, ShieldCheckIcon, HeartIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
    const router = useRouter();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    // Username removed; backend will generate one if needed
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmTouched, setConfirmTouched] = useState(false);
    const [termsTouched, setTermsTouched] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);

    const passwordScore = useMemo(() => {
        let score = 0;
        if (password.length >= 6) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    }, [password]);

    useEffect(() => {
        router.prefetch('/login');
    }, [router]);

    const setError = (msg: string) => {
        setErrorMessage(msg);
        setShowErrorModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitted(true);
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !phone.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ. Vui lòng nhập đúng định dạng.');
            return;
        }
        if (!/^\d{10,11}$/.test(phone)) {
            setError('Số điện thoại phải gồm 10-11 chữ số');
            return;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (password.trim() !== confirmPassword.trim()) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (!acceptedTerms) {
            setError('Bạn cần đồng ý với điều khoản sử dụng');
            return;
        }
        setIsLoading(true);
        setRetryCount(0);
        try {
            const dto: any = {
                full_name: name,
            email, 
            password, 
            confirmPassword, 
            phone, 
                address: address.trim() || undefined,
            };
            const res = await authAPI.register(dto);
            if (res?.success) {
                setShowSuccess(true);
                clientStorage.setItem('login_success', 'Đăng ký thành công! Vui lòng đăng nhập.');
                setTimeout(() => router.push('/login'), 1600);
                return;
            }
            setError(res?.message || 'Đăng ký thất bại');
        } catch (err: any) {
            setError(err?.message || 'Đăng ký thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = async () => {
        if (retryCount >= 3) {
            setError('Đã thử lại quá nhiều lần. Vui lòng liên hệ quản trị viên hoặc thử lại sau.');
            return;
        }
        
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        try {
            const dto: any = {
                full_name: name,
            email, 
            password, 
            confirmPassword, 
            phone, 
                address: address.trim() || undefined,
            };
            const res = await authAPI.register(dto);
            if (res?.success) {
                setShowSuccess(true);
                clientStorage.setItem('login_success', 'Đăng ký thành công! Vui lòng đăng nhập.');
                setTimeout(() => router.push('/login'), 1600);
                return;
            }
            setError(res?.message || 'Đăng ký thất bại');
        } catch (err: any) {
            setError(err?.message || 'Đăng ký thất bại');
        } finally {
            setIsRetrying(false);
        }
    };

    // Redux flow removed; success/error handled inline

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-slate-200 overflow-y-auto">
            <ErrorModal
                open={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Đăng ký thất bại"
                message={errorMessage}
                type="error"
            />
            <SuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} title="Tạo tài khoản thành công! 🎉, Vui lòng đợi lòng chờ hệ thống phê duyệt để được đăng nhập" />
            
            {/* Custom retry modal for database errors */}
            {showErrorModal && errorMessage.includes('cơ sở dữ liệu') && retryCount < 3 && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi cơ sở dữ liệu</h3>
                            <p className="text-gray-600 mb-6">
                                Máy chủ đang gặp sự cố. Bạn có muốn thử lại không?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRetry}
                                    disabled={isRetrying}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isRetrying ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang thử lại...
                                        </div>
                                    ) : (
                                        `Thử lại (${retryCount}/3)`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-[1300px] mx-auto px-4 py-6 relative z-[1]">
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 mb-6 shadow-md border border-white/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <button
                                onClick={() => router.push('/login')}
                                className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                                title="Quay lại"
                            >
                                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                            <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(22,163,74,0.25)]">
                                <LockClosedIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold m-0 bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent tracking-tight leading-tight">Tạo tài khoản</h1>
                                <p className="text-sm text-slate-500 mt-0.5 font-medium">Đăng ký tài khoản hệ thống CareHome</p>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-md border border-white/30">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] pr-1" noValidate>
                    <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                        <div className="relative">
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                                <UserIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                    id="name"
                                    name="name"
                                type="text"
                                placeholder="Nguyễn Văn A"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => setNameTouched(true)}
                                minLength={2}
                                required
                                    className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((nameTouched || formSubmitted) && name.trim().length < 2) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                        </div>
                            {((nameTouched || formSubmitted) && name.trim().length < 2) && (
                            <div className="mt-1 flex items-center text-xs text-rose-600">
                                <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Họ và tên cần tối thiểu 2 ký tự
                            </div>
                        )}
                    </div>



                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ email</label>
                        <div className="relative">
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setEmailTouched(true)}
                                    className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                        </div>
                            {(email.length > 0 || formSubmitted) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                            <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Vui lòng nhập email hợp lệ
                            </div>
                        )}
                    </div>

                    <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                        <div className="relative">
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="0987654321"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${(formSubmitted && !/^\d{10,11}$/.test(phone)) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                        </div>
                            {formSubmitted && !/^\d{10,11}$/.test(phone) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Số điện thoại phải gồm 10-11 chữ số
                                </div>
                            )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                        <div className="relative">
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                                <LockClosedIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => setPasswordTouched(true)}
                                minLength={6}
                                required
                                className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((passwordTouched || formSubmitted) && password.length < 6) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        {(password.length > 0 || formSubmitted) && (
                            <div className="mt-2">
                                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className={`${passwordScore <= 1 ? 'bg-rose-500 w-1/4' : passwordScore === 2 ? 'bg-amber-500 w-2/4' : passwordScore === 3 ? 'bg-lime-500 w-3/4' : 'bg-emerald-500 w-full'} h-full transition-all duration-300`}
                                    />
                                </div>
                                <div className="mt-1 text-[11px] text-gray-600">
                                    Độ mạnh mật khẩu: {passwordScore <= 1 ? 'Yếu' : passwordScore === 2 ? 'Trung bình' : passwordScore === 3 ? 'Mạnh' : 'Rất mạnh'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                        <div className="relative">
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                                <LockClosedIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                id="confirm"
                                name="confirm"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() => setConfirmTouched(true)}
                                required
                                className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((confirmTouched || formSubmitted) && confirmPassword.trim() !== password.trim()) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        {(confirmPassword.length > 0 || formSubmitted) && (
                            <div className={`mt-1 text-[11px] ${confirmPassword.trim() === password.trim() ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {confirmPassword.trim() === password.trim() ? 'Mật khẩu khớp' : 'Mật khẩu chưa khớp'}
                            </div>
                        )}
                    </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-3.5 text-sm text-gray-800 bg-white rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10 focus:ring-4 transition-all duration-200"
                            />
                    </div>

                    <div className="-mt-1 flex items-start gap-2">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            onBlur={() => setTermsTouched(true)}
                            className="mt-[3px] h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="terms" className="text-xs text-gray-600">
                            Tôi đồng ý với các <span className="text-emerald-700 font-medium">Điều khoản sử dụng</span> và <span className="text-emerald-700 font-medium">Chính sách bảo mật</span>
                        </label>
                    </div>


                    {((termsTouched || formSubmitted) && !acceptedTerms) && (
                        <div className="-mt-1 text-[11px] text-rose-600 flex items-center">
                            <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Bạn cần đồng ý với điều khoản sử dụng
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || isRetrying}
                        className="w-full py-4 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 rounded-xl border-none cursor-pointer mt-2 shadow-lg disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                    >
                        {isLoading || isRetrying ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {isRetrying ? `Đang thử lại... (${retryCount}/3)` : 'Đang tạo tài khoản...'}
                            </div>
                        ) : (
                            'Đăng ký'
                        )}
                    </button>

                    <div className="text-center text-sm text-gray-600">
                        Đã có tài khoản?
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300/70 hover:decoration-emerald-400"
                        >
                            Đăng nhập
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
}


