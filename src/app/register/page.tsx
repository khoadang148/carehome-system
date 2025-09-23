"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, userAPI } from '@/lib/api';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { clientStorage } from '@/lib/utils/clientStorage';
import { useNotifications } from '@/lib/contexts/notification-context';
import { EnvelopeIcon, LockClosedIcon, UserIcon, ArrowLeftIcon, ShieldCheckIcon, HeartIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon, PhoneIcon, PhotoIcon, CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
    const router = useRouter();
    const { addNotification } = useNotifications();

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
    const [phoneTouched, setPhoneTouched] = useState(false);
    const [cccdTouched, setCccdTouched] = useState(false);
    const [addressTouched, setAddressTouched] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);

    // CCCD fields
    const [cccdId, setCccdId] = useState('');
    const [cccdFront, setCccdFront] = useState<File | null>(null);
    const [cccdBack, setCccdBack] = useState<File | null>(null);
    const [cccdFrontPreview, setCccdFrontPreview] = useState<string | null>(null);
    const [cccdBackPreview, setCccdBackPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!cccdFront) {
            if (cccdFrontPreview) URL.revokeObjectURL(cccdFrontPreview);
            setCccdFrontPreview(null);
            return;
        }
        const url = URL.createObjectURL(cccdFront);
        setCccdFrontPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [cccdFront]);

    useEffect(() => {
        if (!cccdBack) {
            if (cccdBackPreview) URL.revokeObjectURL(cccdBackPreview);
            setCccdBackPreview(null);
            return;
        }
        const url = URL.createObjectURL(cccdBack);
        setCccdBackPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [cccdBack]);

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
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !phone.trim() || !cccdId.trim() || !address.trim() || !cccdFront || !cccdBack) {
            setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }
        const emailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!emailRegex.test(email)) {
            setError('Email phải thuộc miền @gmail.com');
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
        // Validate CCCD if provided; cccdId is required per request
        if (!/^\d{12}$/.test(cccdId)) {
            setError('Số CCCD phải gồm đúng 12 chữ số');
            return;
        }
        if (address.trim().length < 5) {
            setError('Địa chỉ cần tối thiểu 5 ký tự');
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
            const cccdData = {
                cccd_id: cccdId,
                cccd_front: cccdFront,
                cccd_back: cccdBack
            };
            const res = await authAPI.registerWithCccd(dto, cccdData);
            if (res?.success) {
                // Add notification about pending approval
                addNotification({
                    type: 'warning',
                    title: 'Tài khoản đang chờ phê duyệt',
                    message: 'Tài khoản của bạn đã được tạo thành công và đang chờ quản trị viên phê duyệt. Vui lòng kiên nhẫn chờ đợi.',
                    category: 'system'
                });
                
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
            const cccdData = {
                cccd_id: cccdId,
                cccd_front: cccdFront,
                cccd_back: cccdBack
            };
            const res = await authAPI.registerWithCccd(dto, cccdData);
            if (res?.success) {
                // Add notification about pending approval
                addNotification({
                    type: 'warning',
                    title: 'Tài khoản đang chờ phê duyệt',
                    message: 'Tài khoản của bạn đã được tạo thành công và đang chờ quản trị viên phê duyệt. Vui lòng kiên nhẫn chờ đợi.',
                    category: 'system'
                });
                
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
            <SuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} title="Tạo tài khoản thành công! 🎉&#10;Vui lòng đợi hệ thống phê duyệt." />

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
            <div className="max-w-[1300px] mx-auto px-4 py-8 relative z-[1]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Brand/Benefits */}
                    <div className="hidden lg:flex flex-col justify-between rounded-2xl p-8 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-xl border border-white/10">
                        <div>
                            <button
                                onClick={() => router.push('/login')}
                                className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors"
                                title="Quay lại"
                                type="button"
                            >
                                <ArrowLeftIcon className="w-5 h-5" /> Quay lại đăng nhập
                            </button>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <LockClosedIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold leading-tight">Tạo tài khoản CareHome</h1>
                                    <p className="text-white/80 mt-1">Nhanh chóng, an toàn và bảo mật.</p>
                                </div>
                            </div>
                            <div className="mt-8 space-y-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheckIcon className="w-6 h-6 mt-0.5 text-white" />
                                    <div>
                                        <p className="font-semibold">Bảo mật chuẩn ngành</p>
                                        <p className="text-white/80 text-sm">Dữ liệu được mã hóa và bảo vệ nhiều lớp.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <HeartIcon className="w-6 h-6 mt-0.5 text-white" />
                                    <div>
                                        <p className="font-semibold">Trải nghiệm thân thiện</p>
                                        <p className="text-white/80 text-sm">Giao diện trực quan, dễ sử dụng trên mọi thiết bị.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-6 h-6 mt-0.5 text-white" />
                            <div>
                                        <p className="font-semibold">Phê duyệt nhanh chóng</p>
                                        <p className="text-white/80 text-sm">Xác minh CCCD và kích hoạt tài khoản sớm.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="rounded-xl bg-white/10 p-4">
                                <p className="text-white/90 text-sm">“CareHome giúp chúng tôi quản lý thông tin hiệu quả và an toàn.”</p>
                                <p className="text-white/70 text-xs mt-1">— Khách hàng doanh nghiệp</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form card */}
                    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-md border border-white/30">
                        <div className="flex items-center gap-3 lg:hidden mb-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="group p-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:text-emerald-700 transition-colors"
                                title="Quay lại"
                                type="button"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Tạo tài khoản</h2>
                                <p className="text-xs text-slate-500">Đăng ký tài khoản hệ thống CareHome</p>
                    </div>
                </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên <span className="text-rose-500">*</span></label>
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
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {name.trim().length === 0 ? 'Vui lòng nhập họ và tên' : 'Họ và tên cần tối thiểu 2 ký tự'}
                                </div>
                            )}
                        </div>

                        {/* CCCD */}
                        <div>
                            <label htmlFor="cccd_id" className="block text-sm font-semibold text-gray-700 mb-2">Số CCCD <span className="text-rose-500">*</span></label>
                            <input
                                id="cccd_id"
                                name="cccd_id"
                                type="text"
                                inputMode="numeric"
                                placeholder="12 chữ số"
                                value={cccdId}
                                onChange={(e) => setCccdId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                onBlur={() => setCccdTouched(true)}
                                required
                                className={`w-full px-4 py-3.5 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((cccdTouched || formSubmitted) && !/^\d{12}$/.test(cccdId)) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                            {((cccdTouched || formSubmitted) && !/^\d{12}$/.test(cccdId)) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {cccdId.length === 0 ? 'Vui lòng nhập số CCCD' : 'Số CCCD phải gồm đúng 12 chữ số'}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh mặt trước CCCD <span className="text-rose-500">*</span></label>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && file.type.startsWith('image/')) setCccdFront(file);
                                    }}
                                    className={`relative flex items-center justify-center border-2 border-dashed rounded-xl p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer ${((formSubmitted) && !cccdFront) ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setCccdFront(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        aria-label="Tải ảnh mặt trước"
                                        required
                                    />
                                    {cccdFrontPreview ? (
                                        <div className="relative w-full">
                                            <img src={cccdFrontPreview} alt="CCCD front preview" className="w-full h-36 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => setCccdFront(null)}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-slate-600" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center text-slate-500">
                                            <PhotoIcon className="w-6 h-6" />
                                            <p className="text-xs mt-1">Kéo thả hoặc bấm để tải ảnh</p>
                                        </div>
                                    )}
                                </div>
                                {formSubmitted && !cccdFront && (
                                    <div className="mt-1 flex items-center text-xs text-rose-600">
                                        <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Vui lòng tải ảnh mặt trước CCCD
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh mặt sau CCCD <span className="text-rose-500">*</span></label>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && file.type.startsWith('image/')) setCccdBack(file);
                                    }}
                                    className={`relative flex items-center justify-center border-2 border-dashed rounded-xl p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer ${((formSubmitted) && !cccdBack) ? 'border-rose-400 bg-rose-50' : 'border-gray-300'}`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setCccdBack(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        aria-label="Tải ảnh mặt sau"
                                        required
                                    />
                                    {cccdBackPreview ? (
                                        <div className="relative w-full">
                                            <img src={cccdBackPreview} alt="CCCD back preview" className="w-full h-36 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => setCccdBack(null)}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-slate-600" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center text-slate-500">
                                            <CloudArrowUpIcon className="w-6 h-6" />
                                            <p className="text-xs mt-1">Kéo thả hoặc bấm để tải ảnh</p>
                                        </div>
                                    )}
                                </div>
                                {formSubmitted && !cccdBack && (
                                    <div className="mt-1 flex items-center text-xs text-rose-600">
                                        <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Vui lòng tải ảnh mặt sau CCCD
                                    </div>
                                )}
                            </div>
                        </div>



                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ email <span className="text-rose-500">*</span></label>
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
                                    required
                                    className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((emailTouched || formSubmitted) && (email.length === 0 || !/^[^\s@]+@gmail\.com$/i.test(email))) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                                />
                            </div>
                            {((emailTouched || formSubmitted) && (email.length === 0 || !/^[^\s@]+@gmail\.com$/i.test(email))) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {email.length === 0 ? 'Vui lòng nhập địa chỉ email' : 'Email phải thuộc miền @gmail.com'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại <span className="text-rose-500">*</span></label>
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
                                    onBlur={() => setPhoneTouched(true)}
                                    required
                                    className={`w-full px-4 py-3.5 pl-11 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((phoneTouched || formSubmitted) && !/^\d{10,11}$/.test(phone)) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                                />
                            </div>
                            {((phoneTouched || formSubmitted) && !/^\d{10,11}$/.test(phone)) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {phone.length === 0 ? 'Vui lòng nhập số điện thoại' : 'Số điện thoại phải gồm 10-11 chữ số'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu <span className="text-rose-500">*</span></label>
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
                            {((passwordTouched || formSubmitted) && password.length < 6) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {password.length === 0 ? 'Vui lòng nhập mật khẩu' : 'Mật khẩu phải có ít nhất 6 ký tự'}
                                </div>
                            )}
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
                            <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu <span className="text-rose-500">*</span></label>
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
                            {((confirmTouched || formSubmitted) && confirmPassword.trim() !== password.trim()) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {confirmPassword.length === 0 ? 'Vui lòng xác nhận mật khẩu' : 'Mật khẩu xác nhận không khớp'}
                                </div>
                            )}
                            {(confirmPassword.length > 0 && confirmPassword.trim() === password.trim()) && (
                                <div className="mt-1 flex items-center text-xs text-emerald-600">
                                    <CheckCircleIcon className="w-4 h-4 mr-1" /> Mật khẩu khớp
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ <span className="text-rose-500">*</span></label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onBlur={() => setAddressTouched(true)}
                                required
                                className={`w-full px-4 py-3.5 text-sm text-gray-800 bg-white rounded-xl border-2 focus:ring-4 transition-all duration-200 ${((addressTouched || formSubmitted) && address.trim().length < 5) ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/10'}`}
                            />
                            {((addressTouched || formSubmitted) && address.trim().length < 5) && (
                                <div className="mt-1 flex items-center text-xs text-rose-600">
                                    <ExclamationCircleIcon className="w-4 h-4 mr-1" /> {address.trim().length === 0 ? 'Vui lòng nhập địa chỉ' : 'Địa chỉ cần tối thiểu 5 ký tự'}
                                </div>
                            )}
                        </div>

                        <div className="-mt-1 flex items-start gap-2">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                onBlur={() => setTermsTouched(true)}
                                required
                                className="mt-[3px] h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="terms" className="text-xs text-gray-600">
                                Tôi đồng ý với các <span className="text-emerald-700 font-medium">Điều khoản sử dụng</span> và <span className="text-emerald-700 font-medium">Chính sách bảo mật</span> <span className="text-rose-500">*</span>
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
                            className="w-full py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 rounded-xl border-none cursor-pointer mt-1 shadow-lg disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                        >
                            {isLoading || isRetrying ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isRetrying ? `Đang thử lại... (${retryCount}/3)` : 'Đang tạo tài khoản...'}
                                </div>
                            ) : (
                                'Tạo tài khoản'
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
        </div>
    );
}


