"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import SuccessModal from '@/components/SuccessModal';
import { residentAPI, userAPI, API_BASE_URL } from '@/lib/api';
import { convertDDMMYYYYToISO } from '@/lib/utils/validation';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type Medication = {
  medication_name: string;
  dosage: string;
  frequency: string;
};

type ResidentFormData = {
  full_name: string;
  date_of_birth: string; 
  gender: string;
  avatar?: string;
  admission_date?: string;
  medical_history?: string;
  current_medications: Medication[];
  allergies: string[];
  relationship: string;
  relationship_other?: string;
  emergency_contact_address?: string;
  // CCCD fields required by BE
  cccd_id: string;
  user_cccd_id: string;
  // Emergency contact inputs (optional, fallback to user if missing)
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
};

const validateAge = (isoDate: string) => {
  if (!isoDate) return "Ngày sinh là bắt buộc";
  const birthDate = new Date(isoDate);
  if (isNaN(birthDate.getTime())) return "Ngày sinh không hợp lệ";
  const today = new Date();
  if (birthDate > today) return "Ngày sinh không thể trong tương lai";
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  if (age < 60) return "Người cao tuổi phải từ 60 tuổi trở lên";
  if (age >= 130) return "Tuổi không hợp lệ (phải nhỏ hơn 130)";
  return true;
};

function formatDateToDisplay(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return [d, m, y].join('/');
}

function formatDateToISO(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr;
  const [d, m, y] = dateStr.split('/');
  if (!d || !m || !y) return dateStr;
  return [y, m, d].join('-');
}

function validateDate(dateStr: string, fieldName: string = 'Ngày') {
  if (!dateStr) return `${fieldName} là bắt buộc`;
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (!dateRegex.test(dateStr)) return `${fieldName} phải có định dạng dd/mm/yyyy`;
  const [d, m, y] = dateStr.split('/');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  if (date.getDate() !== parseInt(d) || date.getMonth() !== parseInt(m) - 1 || date.getFullYear() !== parseInt(y)) {
    return `${fieldName} không hợp lệ`;
  }
  if (fieldName === 'Ngày sinh' && date > new Date()) return `${fieldName} không thể trong tương lai`;
  return true;
}

export default function FamilyNewResidentPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const buildFileUrl = (file_path?: string) => {
    if (!file_path) return '';
    const clean = String(file_path).replace(/\\/g, '/').replace(/"/g, '');
    if (!clean) return '';
    // Absolute URL provided
    if (clean.startsWith('http')) return clean;
    // Use deployed backend URL for static files
    const staticBaseUrl = process.env.NEXT_PUBLIC_STATIC_BASE_URL || 'https://sep490-be-xniz.onrender.com';
    if (clean.startsWith('/uploads/')) return `${staticBaseUrl}${clean}`;
    if (clean.startsWith('uploads/')) return `${staticBaseUrl}/${clean}`;
    if (clean.startsWith('/')) return `${staticBaseUrl}${clean}`;
    return `${staticBaseUrl}/${clean}`;
  };

  // Build both proxy and remote absolute url for graceful fallback when deployed BE doesn't have the local file
  const buildFileUrls = (file_path?: string) => {
    const proxyUrl = buildFileUrl(file_path);
    const clean = String(file_path || '').replace(/\\/g, '/').replace(/"/g, '').replace(/^\/+/, '');
    const remoteUrl = clean ? `https://sep490-be-xniz.onrender.com/${clean}` : '';
    return { proxyUrl, remoteUrl };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<ResidentFormData>({
    defaultValues: {
      current_medications: [],
      allergies: [],
      gender: '',
      relationship: ''
    },
    mode: 'onChange'
  });

  // Ảnh đại diện (nén nhẹ trước khi gửi)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [cccdFrontFile, setCccdFrontFile] = useState<File | null>(null);
  const [cccdBackFile, setCccdBackFile] = useState<File | null>(null);
  const [cccdFrontPreview, setCccdFrontPreview] = useState<string>('');
  const [cccdBackPreview, setCccdBackPreview] = useState<string>('');
  const [userCccdFrontFile, setUserCccdFrontFile] = useState<File | null>(null);
  const [userCccdBackFile, setUserCccdBackFile] = useState<File | null>(null);

  // Sử dụng thông tin tài khoản hiện tại hay nhập mới
  const [useExistingAccount, setUseExistingAccount] = useState<boolean>(false);
  const [accountProfile, setAccountProfile] = useState<any | null>(null);
  const [accountCccdIdInput, setAccountCccdIdInput] = useState<string>('');
  const [accountCccdFrontFile, setAccountCccdFrontFile] = useState<File | null>(null);
  const [accountCccdBackFile, setAccountCccdBackFile] = useState<File | null>(null);
  const [accountCccdFrontPreview, setAccountCccdFrontPreview] = useState<string>('');
  const [accountCccdBackPreview, setAccountCccdBackPreview] = useState<string>('');
  const [userCccdFrontPreview, setUserCccdFrontPreview] = useState<string>('');
  const [userCccdBackPreview, setUserCccdBackPreview] = useState<string>('');

  // Success modal state
  const [successOpen, setSuccessOpen] = useState<boolean>(false);
  const [createdResidentId, setCreatedResidentId] = useState<string>('');
  const [createdResidentName, setCreatedResidentName] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) return;
        const profile = await userAPI.getById(user.id);
        setAccountProfile(profile);
        if (profile?.cccd_id) setAccountCccdIdInput(profile.cccd_id);
      } catch (e) {
        // ignore
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Prefill emergency contact fields when using existing account
  useEffect(() => {
    if (useExistingAccount && accountProfile) {
      const name = accountProfile.full_name || accountProfile.fullName || accountProfile.username || accountProfile.email || '';
      if (name) setValue('emergency_contact_name', name, { shouldValidate: true });
      if (accountProfile.phone) setValue('emergency_contact_phone', accountProfile.phone, { shouldValidate: false });
      if (accountProfile.email) setValue('emergency_contact_email', accountProfile.email, { shouldValidate: true });
      if (accountProfile.address) setValue('emergency_contact_address', accountProfile.address, { shouldValidate: false });
    } else if (!useExistingAccount) {
      // Clear auto-filled values to enforce manual input
      setValue('emergency_contact_name', '', { shouldValidate: true });
      setValue('emergency_contact_phone', '', { shouldValidate: false });
      setValue('emergency_contact_email', '', { shouldValidate: true });
      setValue('emergency_contact_address', '', { shouldValidate: true });
    }
  }, [useExistingAccount, accountProfile, setValue]);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error('File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 1MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 300;
        let { width, height } = img as HTMLImageElement;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
          setAvatarPreview(resizedImage);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleLimitedImage = (file: File | null, label: string): File | null => {
    if (!file) return null;
    if (!file.type.startsWith('image/')) {
      toast.error(`Vui lòng chọn file ảnh hợp lệ cho ${label}`);
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} vượt quá 5MB`);
      return null;
    }
    return file;
  };

  const handleResidentCccdFrontChange = (file: File | null) => {
    const f = handleLimitedImage(file, 'CCCD trước (resident)');
    setCccdFrontFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setCccdFrontPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setCccdFrontPreview('');
    }
  };

  const handleResidentCccdBackChange = (file: File | null) => {
    const f = handleLimitedImage(file, 'CCCD sau (resident)');
    setCccdBackFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setCccdBackPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setCccdBackPreview('');
    }
  };

  const handleAccountCccdFrontChange = (file: File | null) => {
    const f = handleLimitedImage(file, 'CCCD trước (tài khoản)');
    setAccountCccdFrontFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setAccountCccdFrontPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setAccountCccdFrontPreview('');
    }
  };

  const handleAccountCccdBackChange = (file: File | null) => {
    const f = handleLimitedImage(file, 'CCCD sau (tài khoản)');
    setAccountCccdBackFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setAccountCccdBackPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setAccountCccdBackPreview('');
    }
  };

  const handleUserCccdFrontChange = (file: File | null) => {
    const f = handleLimitedImage(file, 'CCCD trước (bạn)');
    setUserCccdFrontFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setUserCccdFrontPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setUserCccdFrontPreview('');
    }
  };

  const handleUserCccdBackChange = (file: File | null) => {
    const f = handleLimitedImage(file, 'CCCD sau (bạn)');
    setUserCccdBackFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setUserCccdBackPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setUserCccdBackPreview('');
    }
  };

  const fileToDataUrl = (file: File | null): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const addMedication = () => {
    const meds = watch('current_medications') || [];
    setValue('current_medications', [...meds, { medication_name: '', dosage: '', frequency: '' }]);
  };

  const removeMedication = (index: number) => {
    const meds = (watch('current_medications') || []).filter((_, i) => i !== index);
    setValue('current_medications', meds);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const meds = [...(watch('current_medications') || [])];
    meds[index][field] = value;
    setValue('current_medications', meds);
  };

  const addAllergy = () => {
    const arr = watch('allergies') || [];
    setValue('allergies', [...arr, '']);
  };

  const removeAllergy = (index: number) => {
    const arr = (watch('allergies') || []).filter((_, i) => i !== index);
    setValue('allergies', arr);
  };

  const updateAllergy = (index: number, value: string) => {
    const arr = [...(watch('allergies') || [])];
    arr[index] = value;
    setValue('allergies', arr);
  };

  const onSubmit = async (data: ResidentFormData) => {
    try {
      if (!user?.id) {
        toast.error('Bạn cần đăng nhập để đăng ký người thân');
        return;
      }

      if (!data.full_name?.trim()) {
        toast.error('Họ và tên là bắt buộc');
        return;
      }

      if (!data.date_of_birth) {
        toast.error('Ngày sinh là bắt buộc');
        return;
      }

      const displayDob = formatDateToDisplay(data.date_of_birth);
      const dateValidation = validateDate(displayDob, 'Ngày sinh');
      if (dateValidation !== true) {
        toast.error(String(dateValidation));
        return;
      }

      const isoDob = data.date_of_birth.includes('/') ? formatDateToISO(data.date_of_birth) : data.date_of_birth;
      const ageValidation = validateAge(isoDob);
      if (ageValidation !== true) {
        toast.error(String(ageValidation));
        return;
      }

      if (!data.gender) {
        toast.error('Giới tính là bắt buộc');
        return;
      }

      if (!data.relationship?.trim()) {
        toast.error('Mối quan hệ là bắt buộc');
        return;
      }

      // Required by BE: CCCD for resident
      if (!data.cccd_id || !/^\d{12}$/.test(data.cccd_id)) {
        toast.error('CCCD của người thân phải gồm đúng 12 chữ số');
        return;
      }

      // Xử lý 2 trường hợp thông tin người liên hệ (family)
      let finalUserCccdId = data.user_cccd_id;
      if (useExistingAccount) {
        const hasCccdId = !!accountProfile?.cccd_id || !!accountCccdIdInput;
        const hasFrontImg = !!accountProfile?.cccd_front;
        const hasBackImg = !!accountProfile?.cccd_back;

        // Bắt buộc có CCCD ID (từ hồ sơ hoặc nhập mới)
        if (!hasCccdId || !(accountProfile?.cccd_id || /^\d{12}$/.test(accountCccdIdInput))) {
          toast.error('Vui lòng nhập CCCD của bạn (12 số) để tiếp tục');
          return;
        }

        // Nếu hồ sơ thiếu ảnh -> yêu cầu tải ảnh, nhưng KHÔNG cập nhật tài khoản
        const needFront = !hasFrontImg && !accountCccdFrontFile;
        const needBack = !hasBackImg && !accountCccdBackFile;
        if (needFront || needBack) {
          toast.error('Vui lòng tải đủ ảnh CCCD (trước/sau) của bạn');
          return;
        }

        finalUserCccdId = accountProfile?.cccd_id || accountCccdIdInput;
      } else {
        // Nhập mới đầy đủ: yêu cầu CCCD cho người liên hệ + ảnh
      if (!data.user_cccd_id || !/^\d{12}$/.test(data.user_cccd_id)) {
        toast.error('CCCD của bạn phải gồm đúng 12 chữ số');
        return;
      }
        if (!userCccdFrontFile || !userCccdBackFile) {
          toast.error('Vui lòng tải đủ ảnh CCCD (trước/sau) của bạn');
          return;
        }
      }

      // Ảnh CCCD resident bắt buộc
      if (!cccdFrontFile || !cccdBackFile) {
        toast.error('Vui lòng tải đủ ảnh CCCD (trước/sau) cho người thân');
        return;
      }

      let relationshipValue = data.relationship;
      if (data.relationship === 'khác' && data.relationship_other?.trim()) {
        relationshipValue = data.relationship_other.trim();
      }

      // Build multipart form per BE controller
      const formData = new FormData();
      if (avatarFile) formData.append('avatar', avatarFile);
      if (cccdFrontFile) formData.append('cccd_front', cccdFrontFile);
      if (cccdBackFile) formData.append('cccd_back', cccdBackFile);
      // Endpoint my-resident KHÔNG nhận ảnh CCCD của người liên hệ, chỉ nhận ảnh CCCD của resident.
      formData.append('full_name', data.full_name);
      formData.append('gender', data.gender);
      formData.append('date_of_birth', convertDDMMYYYYToISO(displayDob));
      formData.append('cccd_id', data.cccd_id);
      // user_cccd_id không cần cho endpoint my-resident
      formData.append('family_member_id', user.id);
      formData.append('relationship', relationshipValue);
      formData.append('medical_history', data.medical_history || 'Không có');
      formData.append('current_medications', JSON.stringify((data.current_medications || []).filter(m => m.medication_name && m.dosage && m.frequency)));
      formData.append('allergies', JSON.stringify((data.allergies || []).filter(a => a && a.trim())));
      const userDisplayName = (user as any)?.full_name || (user as any)?.fullName || user.name || user.email || 'Gia đình';
      const userPhone = (user as any)?.phone || '';
      formData.append('emergency_contact', JSON.stringify({
        name: (data as any).emergency_contact_name || userDisplayName,
        phone: (data as any).emergency_contact_phone || userPhone,
        email: (data as any).emergency_contact_email || user.email || '',
        relationship: relationshipValue,
        address: data.emergency_contact_address || ''
      }));
      if (data.admission_date) {
        formData.append('admission_date', convertDDMMYYYYToISO(formatDateToDisplay(data.admission_date)));
      }

      // Nếu dùng thông tin tài khoản hiện có: cập nhật thông tin CCCD của user (nếu có thay đổi/thiếu)
      if (useExistingAccount) {
        const shouldUpdateUser = (
          (!!accountCccdIdInput && /^\d{12}$/.test(accountCccdIdInput) && accountProfile?.cccd_id !== accountCccdIdInput) ||
          !accountProfile?.cccd_front ||
          !accountProfile?.cccd_back ||
          !!accountCccdFrontFile ||
          !!accountCccdBackFile
        );
        if (shouldUpdateUser) {
          try {
            await userAPI.uploadMyCccd({
              cccd_id: accountCccdIdInput || accountProfile?.cccd_id,
              cccd_front: accountCccdFrontFile || undefined,
              cccd_back: accountCccdBackFile || undefined,
            });
          } catch (e) {
            toast.error('Cập nhật CCCD cho tài khoản thất bại');
            return;
          }
        }
      }

      // Gửi đăng ký resident ngay
      try {
        // Family role phải gọi /residents/my-resident, admin/staff mới dùng /residents
        const created = await residentAPI.createMy(formData);
        if (created && (created._id || created.id)) {
          setCreatedResidentId(created._id || created.id);
          setCreatedResidentName(data.full_name);
          setSuccessOpen(true);
          return;
        }
        toast.error('Không thể đăng ký người thân. Vui lòng thử lại.');
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Không thể đăng ký người thân. Vui lòng thử lại.');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(102,126,234,0.08)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.08)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 p-8 max-w-5xl mx-auto">
        <div className="flex items-center mb-8 bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
          <Link href="/family" className="mr-4 text-indigo-500 flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 transition-all duration-200 hover:bg-indigo-100">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 flex items-center justify-center shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Đăng ký người thân mới
              </h1>
            </div>
            <p className="text-slate-600 m-0 text-sm font-medium">
              Điền thông tin để tạo hồ sơ người thân. Tài khoản gia đình đã có sẵn.
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/60">
          {/* Progress Stepper */}
          <div className="px-8 pt-8 pb-4 bg-gradient-to-b from-white/80 to-white/30">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow">1</div>
                <div className="text-sm font-semibold text-slate-800">Thông tin người cao tuổi</div>
              </div>
              <div className="flex-1 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-4" />
              <div className="flex-1 flex items-center gap-3 opacity-70">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold">2</div>
                <div className="text-sm font-semibold text-slate-600">Liên hệ khẩn cấp</div>
              </div>
              <div className="flex-1 h-1 bg-slate-200 rounded-full mx-4" />
              <div className="flex-1 flex items-center gap-3 opacity-70">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold">3</div>
                <div className="text-sm font-semibold text-slate-600">Đăng ký dịch vụ</div>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-700 p-6 text-white">
              
            </div>

            <div className="p-8">
              {/* Section: Thông tin người cao tuổi (match staff style) */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                <UserIcon className="w-5 h-5" />
                <h3 className="m-0 text-base font-semibold">Thông tin người cao tuổi</h3>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Ảnh đại diện</label>
                <div className="flex items-center justify-center gap-8 p-8 bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-3 border-gray-200 bg-gray-50 flex items-center justify-center shadow-lg">
                    {(avatarFile && avatarPreview) ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/default-avatar.svg" alt="Default avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn ảnh từ máy tính</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-base outline-none transition-colors duration-200 bg-white cursor-pointer focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <p className="mt-2 text-sm text-gray-500 text-center">Hỗ trợ: JPG, PNG, GIF (tối đa 1MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                    placeholder="Nhập họ và tên đầy đủ"
                    {...register('full_name', { required: 'Họ và tên là bắt buộc', minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }, maxLength: { value: 100, message: 'Tên không được quá 100 ký tự' } })}
                  />
                  {errors.full_name && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.full_name.message}</p>)}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày sinh <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                    placeholder="dd/mm/yyyy"
                    {...register('date_of_birth', {
                      required: 'Ngày sinh là bắt buộc',
                      validate: (value) => {
                        if (!value) return 'Ngày sinh là bắt buộc';
                        const displayVal = formatDateToDisplay(value);
                        const base = validateDate(displayVal, 'Ngày sinh');
                        if (base !== true) return base as string;
                        const isoVal = value.includes('/') ? formatDateToISO(value) : value;
                        return validateAge(isoVal) as any;
                      },
                      onChange: (e) => {
                        const formattedDate = formatDateToISO(e.target.value);
                        setValue('date_of_birth', formattedDate, { shouldValidate: true });
                      }
                    })}
                    value={watch('date_of_birth') ? formatDateToDisplay(watch('date_of_birth')) : ''}
                  />
                  {errors.date_of_birth && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.date_of_birth.message}</p>)}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giới tính <span className="text-red-500">*</span></label>
                  <select
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                    {...register('gender', { required: 'Giới tính là bắt buộc' })}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                  {errors.gender && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.gender.message}</p>)}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày nhập viện <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                    placeholder="dd/mm/yyyy"
                    {...register('admission_date', {
                      required: 'Ngày nhập viện là bắt buộc',
                      validate: (value) => {
                        if (!value) return 'Ngày nhập viện là bắt buộc';
                        const displayVal = formatDateToDisplay(value);
                        const base = validateDate(displayVal, 'Ngày nhập viện');
                        if (base !== true) return base as string;
                        const iso = value.includes('/') ? formatDateToISO(value) : value;
                        const inputDate = new Date(iso + 'T00:00:00');
                        const today = new Date();
                        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        if (inputDate < todayOnly) return 'Ngày nhập viện không thể là ngày trong quá khứ';
                        return true;
                      }
                    })}
                  />
                  {errors.admission_date && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{(errors as any).admission_date?.message as any}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CCCD người thân (12 số) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.cccd_id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                    placeholder="Nhập 12 chữ số"
                    {...register('cccd_id', { required: 'CCCD là bắt buộc', pattern: { value: /^\d{12}$/, message: 'Phải gồm đúng 12 chữ số' } })}
                  />
                  {errors.cccd_id && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.cccd_id.message}</p>)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD người thân - Mặt trước <span className="text-red-500">*</span></label>
                  <input type="file" accept="image/*" onChange={(e) => handleResidentCccdFrontChange(e.target.files?.[0] || null)} className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                  {cccdFrontPreview && (
                    <div className="mt-3">
                      <img src={cccdFrontPreview} alt="CCCD trước" className="h-28 rounded-lg border border-gray-200 object-cover" />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Ảnh rõ nét, không lóa</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD người thân - Mặt sau <span className="text-red-500">*</span></label>
                  <input type="file" accept="image/*" onChange={(e) => handleResidentCccdBackChange(e.target.files?.[0] || null)} className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                  {cccdBackPreview && (
                    <div className="mt-3">
                      <img src={cccdBackPreview} alt="CCCD sau" className="h-28 rounded-lg border border-gray-200 object-cover" />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Ảnh rõ nét, không lóa</p>
                </div>

                <div className="mb-8 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiền sử bệnh lý</label>
                  <textarea
                    rows={4}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm outline-none transition-colors duration-200 resize-vertical focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Mô tả tiền sử bệnh lý, tình trạng sức khỏe hiện tại..."
                    {...register('medical_history')}
                  />
                </div>

                <div className="mb-8 md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Thuốc đang sử dụng</label>
                    <button type="button" onClick={addMedication} className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-emerald-600">
                      <PlusIcon className="w-4 h-4" />
                      Thêm thuốc
                    </button>
                  </div>
                  {(watch('current_medications') || []).length === 0 && (
                    <div className="text-sm text-gray-500 italic mb-3">Chưa có thuốc nào, bấm “Thêm thuốc” để bổ sung.</div>
                  )}
                  {(watch('current_medications') || []).map((medication, index) => (
                    <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="text"
                        placeholder="Tên thuốc"
                        value={medication.medication_name}
                        onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                        className="col-span-2 md:col-span-1 p-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                      <input
                        type="text"
                        placeholder="Liều lượng"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="col-span-2 md:col-span-1 p-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                      <input
                        type="text"
                        placeholder="Tần suất"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="col-span-2 md:col-span-1 p-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                      {(watch('current_medications') || []).length > 0 && (
                        <button type="button" onClick={() => removeMedication(index)} className="p-2 bg-red-500 text-white rounded-lg transition-colors duration-200 hover:bg-red-600">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-8 md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Dị ứng</label>
                    <button type="button" onClick={addAllergy} className="inline-flex items-center gap-2 py-2 px-4 bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-amber-600">
                      <PlusIcon className="w-4 h-4" />
                      Thêm dị ứng
                    </button>
                  </div>
                  {(watch('allergies') || []).length === 0 && (
                    <div className="text-sm text-gray-500 italic mb-3">Chưa có dị ứng nào được thêm, bấm “Thêm dị ứng” để bổ sung.</div>
                  )}
                  {(watch('allergies') || []).map((allergy, index) => (
                    <div key={index} className="flex items-center gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Dị ứng thức ăn, thuốc, hoặc các chất khác..."
                        value={allergy}
                        onChange={(e) => updateAllergy(index, e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                      {(watch('allergies') || []).length > 0 && (
                        <button type="button" onClick={() => removeAllergy(index)} className="p-2 bg-red-500 text-white rounded-lg transition-colors duration-200 hover:bg-red-600">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Liên hệ khẩn cấp (match staff style) */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                <PhoneIcon className="w-5 h-5" />
                <h3 className="m-0 text-base font-semibold">Thông tin liên hệ khẩn cấp</h3>
              </div>
              <div className="bg-white rounded-xl border border-amber-200 p-6 mb-8 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2 flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-sm">
                    <div className="font-semibold text-amber-900">Sử dụng thông tin tài khoản hiện tại</div>
                    <div className="text-amber-800">Nếu thiếu CCCD, hệ thống sẽ yêu cầu bổ sung</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={useExistingAccount} onChange={(e) => setUseExistingAccount(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-amber-300 peer-checked:bg-amber-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

               
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên người liên hệ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="VD: Nguyễn Văn A"
                    {...register('emergency_contact_name', { required: 'Họ tên người liên hệ là bắt buộc', minLength: { value: 2, message: 'Ít nhất 2 ký tự' } }) as any}
                  />
                  {(errors as any).emergency_contact_name && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{(errors as any).emergency_contact_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    className="w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="090xxxxxxx"
                    {...register('emergency_contact_phone') as any}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    className="w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="email@gmail.com"
                    {...register('emergency_contact_email', { required: 'Email người liên hệ là bắt buộc', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' } }) as any}
                  />
                  {(errors as any).emergency_contact_email && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{(errors as any).emergency_contact_email.message}</p>
                  )}
                </div>
                 {/* Mối quan hệ: nếu chọn "khác" thì chuyển thành 1 ô input duy nhất */}
                 <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mối quan hệ với người cao tuổi <span className="text-red-500">*</span></label>
                  {watch('relationship') === 'khác' ? (
                    <input
                      type="text"
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.relationship_other ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      placeholder="Nhập mối quan hệ cụ thể (VD: chú, bác, cô, dì, bạn thân...)"
                      {...register('relationship_other', { required: 'Vui lòng nhập mối quan hệ cụ thể' })}
                    />
                  ) : (
                    <select
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.relationship ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      {...register('relationship', { required: 'Mối quan hệ là bắt buộc' })}
                    >
                      <option value="">Chọn mối quan hệ</option>
                      <option value="con trai">Con trai</option>
                      <option value="con gái">Con gái</option>
                      <option value="cháu trai">Cháu trai</option>
                      <option value="cháu gái">Cháu gái</option>
                      <option value="anh em">Anh em</option>
                      <option value="vợ/chồng">Vợ/Chồng</option>
                      <option value="khác">Khác</option>
                    </select>
                  )}
                  {errors.relationship && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.relationship.message}</p>)}
                  {errors.relationship_other && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.relationship_other.message}</p>)}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Nhập địa chỉ của người liên hệ khẩn cấp"
                    {...register('emergency_contact_address', { required: 'Địa chỉ liên hệ là bắt buộc', minLength: { value: 5, message: 'Địa chỉ quá ngắn' } })}
                  />
                  {(errors as any).emergency_contact_address && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{(errors as any).emergency_contact_address.message}</p>
                  )}
                </div>

                {useExistingAccount ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">CCCD của bạn (12 số) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        key="account-cccd-input"
                        value={accountCccdIdInput}
                        onChange={(e) => setAccountCccdIdInput(e.target.value)}
                        className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${(!accountCccdIdInput || !/^\d{12}$/.test(accountCccdIdInput)) ? 'border-red-200' : 'border-gray-200'} bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100`}
                        placeholder="Nhập 12 chữ số"
                      />
                      {accountProfile?.cccd_id && (
                        <p className="mt-1 text-xs text-emerald-600">Đã có CCCD trong hồ sơ</p>
                      )}
                    </div>
                    {!accountProfile?.cccd_front && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tải ảnh CCCD của bạn - Mặt trước</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAccountCccdFrontChange(e.target.files?.[0] || null)} className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                        {accountCccdFrontPreview && (
                          <div className="mt-3">
                            <img src={accountCccdFrontPreview} alt="CCCD trước (tài khoản)" className="h-28 rounded-lg border border-gray-200 object-cover" />
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Ảnh rõ nét, không lóa</p>
                      </div>
                    )}
                    {!accountProfile?.cccd_back && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tải ảnh CCCD của bạn - Mặt sau</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAccountCccdBackChange(e.target.files?.[0] || null)} className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                        {accountCccdBackPreview && (
                          <div className="mt-3">
                            <img src={accountCccdBackPreview} alt="CCCD sau (tài khoản)" className="h-28 rounded-lg border border-gray-200 object-cover" />
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Ảnh rõ nét, không lóa</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CCCD của người liên hệ khẩn cấp (12 số) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                        key="manual-cccd-input"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.user_cccd_id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                    placeholder="Nhập 12 chữ số"
                        {...register('user_cccd_id', { required: !useExistingAccount ? 'CCCD của bạn là bắt buộc' : false as any, pattern: { value: /^\d{12}$/, message: 'Phải gồm đúng 12 chữ số' } })}
                  />
                  {errors.user_cccd_id && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.user_cccd_id.message}</p>)}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD của người liên hệ khẩn cấp - Mặt trước <span className="text-red-500">*</span></label>
                  <input type="file" accept="image/*" onChange={(e) => handleUserCccdFrontChange(e.target.files?.[0] || null)} className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                  {userCccdFrontPreview && (
                    <div className="mt-3">
                      <img src={userCccdFrontPreview} alt="CCCD trước (bạn)" className="h-28 rounded-lg border border-gray-200 object-cover" />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Ảnh rõ nét, không lóa</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD của người liên hệ khẩn cấp - Mặt sau <span className="text-red-500">*</span></label>
                  <input type="file" accept="image/*" onChange={(e) => handleUserCccdBackChange(e.target.files?.[0] || null)} className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                  {userCccdBackPreview && (
                    <div className="mt-3">
                      <img src={userCccdBackPreview} alt="CCCD sau (bạn)" className="h-28 rounded-lg border border-gray-200 object-cover" />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Ảnh rõ nét, không lóa</p>
                </div>
                  </>
                )}
                {useExistingAccount && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD của bạn</label>
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Mặt trước</div>
                        <div className="w-40 h-28 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                          {(() => {
                            const { proxyUrl, remoteUrl } = buildFileUrls(accountProfile?.cccd_front);
                            const src = proxyUrl || remoteUrl;
                            if (src) {
                              return (
                                <a href={remoteUrl || src} target="_blank" rel="noreferrer">
                                  <img
                                    src={src}
                                    onError={(e) => { if (remoteUrl) (e.currentTarget as HTMLImageElement).src = remoteUrl; }}
                                    alt="CCCD trước (tài khoản)"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              );
                            }
                            if (accountCccdFrontPreview) {
                              return <img src={accountCccdFrontPreview} alt="CCCD trước (tải lên)" className="w-full h-full object-cover" />;
                            }
                            return <div className="text-xs text-gray-400">Chưa có ảnh</div>;
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Mặt sau</div>
                        <div className="w-40 h-28 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                          {(() => {
                            const { proxyUrl, remoteUrl } = buildFileUrls(accountProfile?.cccd_back);
                            const src = proxyUrl || remoteUrl;
                            if (src) {
                              return (
                                <a href={remoteUrl || src} target="_blank" rel="noreferrer">
                                  <img
                                    src={src}
                                    onError={(e) => { if (remoteUrl) (e.currentTarget as HTMLImageElement).src = remoteUrl; }}
                                    alt="CCCD sau (tài khoản)"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              );
                            }
                            if (accountCccdBackPreview) {
                              return <img src={accountCccdBackPreview} alt="CCCD sau (tải lên)" className="w-full h-full object-cover" />;
                            }
                            return <div className="text-xs text-gray-400">Chưa có ảnh</div>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

             
              {/* Sticky Action Bar */}
              <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-8 bg-gradient-to-t from-white via-white/95 to-transparent pt-6">
                <div className="flex justify-end gap-4 p-4 border-t border-gray-200 bg-white/80 backdrop-blur rounded-b-2xl">
                  <Link href="/family" className="px-6 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 no-underline bg-white transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300 inline-flex items-center gap-2">
                  Hủy bỏ
                </Link>
                  <button type="submit" className="px-6 py-3 border-0 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg">
                    Tiếp tục đăng ký dịch vụ
                </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <SuccessModal
          open={successOpen}
          name={createdResidentName}
          title="Đã thêm hồ sơ người cao tuổi, tiếp tục đăng ký dịch vụ!"
          onClose={() => {
            setSuccessOpen(false);
            if (createdResidentId) {
              router.replace(`/services/purchase?residentId=${createdResidentId}`);
            }
          }}
        />
      </div>
    </div>
  );
}


