"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/lib/contexts/auth-context';
import { useNotifications } from '@/lib/contexts/notification-context';
import SuccessModal from '@/components/SuccessModal';
import { residentAPI, userAPI, carePlansAPI, roomsAPI, bedsAPI, roomTypesAPI, carePlanAssignmentsAPI, bedAssignmentsAPI } from '@/lib/api';
import { convertDDMMYYYYToISO } from '@/lib/utils/validation';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Types
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
  cccd_id: string;
  user_cccd_id: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
};

export default function NewResidentRegistrationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { addNotification } = useNotifications();

  // Steps: 0=Resident Info, 1=Care Plans, 2=Room Type, 3=Room, 4=Bed, 5=Additional Info, 6=Review, 7=Success
  const [currentStep, setCurrentStep] = useState(0);

  // Resident form state
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

  // Image upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [cccdFrontFile, setCccdFrontFile] = useState<File | null>(null);
  const [cccdBackFile, setCccdBackFile] = useState<File | null>(null);
  const [cccdFrontPreview, setCccdFrontPreview] = useState<string>('');
  const [cccdBackPreview, setCccdBackPreview] = useState<string>('');

  // Account selection
  const [useExistingAccount, setUseExistingAccount] = useState<boolean>(false);
  const [accountProfile, setAccountProfile] = useState<any | null>(null);

  // Care plans state
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [mainPackageId, setMainPackageId] = useState<string>('');
  const [supplementaryIds, setSupplementaryIds] = useState<string[]>([]);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  // Room/bed selection state
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [roomType, setRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');

  // Additional info state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationPeriod, setRegistrationPeriod] = useState('6');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Success modal state
  const [successOpen, setSuccessOpen] = useState<boolean>(false);
  const [createdResidentId, setCreatedResidentId] = useState<string>('');
  const [createdResidentName, setCreatedResidentName] = useState<string>('');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Steps configuration
  const steps = [
    'Thông tin người cao tuổi',
    'Chọn gói dịch vụ', 
    'Chọn loại phòng',
    'Chọn phòng',
    'Chọn giường',
    'Thông tin bổ sung',
    'Xem lại & xác nhận',
    'Hoàn tất'
  ];

  // Validation functions
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

  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return [d, m, y].join('/');
  };

  const formatDateToISO = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) return dateStr;
    const [d, m, y] = dateStr.split('/');
    if (!d || !m || !y) return dateStr;
    return [y, m, d].join('-');
  };

  const validateDate = (dateStr: string, fieldName: string = 'Ngày') => {
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
  };

  // Image handling functions
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

  // Data fetching with SWR
  const { data: swrCarePlans, isLoading: isCarePlansLoading } = useSWR(
    'care-plans',
    () => carePlansAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const { data: swrRoomTypes, isLoading: isRoomTypesLoading } = useSWR(
    'room-types',
    () => roomTypesAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const { data: swrRooms, isLoading: isRoomsLoading } = useSWR(
    'rooms',
    () => roomsAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Data fetching effects
  useEffect(() => {
    setLoading(isCarePlansLoading);
    if (Array.isArray(swrCarePlans)) setCarePlans(swrCarePlans);
  }, [swrCarePlans, isCarePlansLoading]);

  useEffect(() => {
    if (Array.isArray(swrRoomTypes)) setRoomTypes(swrRoomTypes);
  }, [swrRoomTypes, isRoomTypesLoading]);

  useEffect(() => {
    if (Array.isArray(swrRooms)) setRooms(swrRooms);
  }, [swrRooms, isRoomsLoading]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) return;
        const profile = await userAPI.getById(user.id);
        setAccountProfile(profile);
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
      setValue('emergency_contact_name', '', { shouldValidate: true });
      setValue('emergency_contact_phone', '', { shouldValidate: false });
      setValue('emergency_contact_email', '', { shouldValidate: true });
      setValue('emergency_contact_address', '', { shouldValidate: true });
    }
  }, [useExistingAccount, accountProfile, setValue]);

  // Calculate end date when period changes
  useEffect(() => {
    if (startDate && registrationPeriod) {
      const start = new Date(startDate);
      const end = new Date(start);
      // Tính đúng: cộng thêm months - 1 tháng, sau đó lấy ngày cuối tháng
      end.setMonth(end.getMonth() + parseInt(registrationPeriod) - 1);
      // Lấy ngày cuối tháng
      const year = end.getFullYear();
      const month = end.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      end.setDate(lastDay);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, registrationPeriod]);

  // Medication management
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

  // Allergy management
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

  // Care plans helper functions
  const mainPlans = useMemo(() => carePlans.filter((p) => p?.category === 'main' && p?.is_active !== false), [carePlans]);
  const supplementaryPlans = useMemo(() => carePlans.filter((p) => p?.category !== 'main' && p?.is_active !== false), [carePlans]);

  const filteredMainPlans = useMemo(() => {
    return mainPlans.filter(plan =>
      plan.plan_name?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );
  }, [mainPlans, packageSearchTerm]);

  const filteredSupplementaryPlans = useMemo(() => {
    return supplementaryPlans.filter(plan =>
      plan.plan_name?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );
  }, [supplementaryPlans, packageSearchTerm]);

  const toggleSupplementary = (id: string) => {
    setSupplementaryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link 
              href="/family" 
              className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Đăng ký người cao tuổi mới
                </h1>
                <p className="text-slate-600 m-0 text-sm font-medium">
                  Hoàn tất đăng ký từ thông tin cá nhân đến chọn dịch vụ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-center max-w-5xl mx-auto">
            {steps.map((label, idx) => (
              <div key={label} className="text-center flex-1 relative">
                <div className={`
                  w-14 h-14 rounded-full inline-flex items-center justify-center font-bold text-lg mb-4 transition-all duration-300 shadow-md
                  ${idx === currentStep
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : idx < currentStep
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }
                `}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                <div className={`
                  text-sm font-semibold leading-tight min-h-[2.5rem] flex items-center justify-center px-1
                  ${idx === currentStep
                    ? 'text-indigo-600'
                    : idx < currentStep
                      ? 'text-emerald-600'
                      : 'text-gray-500'
                  }
                `}>
                  {label}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`
                    absolute top-7 left-full w-full h-0.5 transform -translate-y-1/2 z-0
                    ${idx < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/20">
          {/* Step 0: Resident Information */}
          {currentStep === 0 && (
            <form>
              <div className="p-8">
                {/* Section: Thông tin người cao tuổi */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                  <UserIcon className="w-5 h-5" />
                  <h3 className="m-0 text-base font-semibold">Thông tin người cao tuổi</h3>
                </div>

                {/* Avatar Upload */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-6 mb-8 shadow-md">
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

                {/* Basic Information */}
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
                      className="w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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

                {/* CCCD và các thông tin khác */}
                <div className="flex justify-end mt-8 gap-4">
                  <Link href="/family" className="px-6 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 no-underline bg-white transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300 inline-flex items-center gap-2">
                    Hủy bỏ
                  </Link>
                  <button 
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border-0 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 1: Care Plans Selection */}
          {currentStep === 1 && (
            <div className="p-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                <GiftIcon className="w-5 h-5" />
                <h3 className="m-0 text-base font-semibold">Chọn gói dịch vụ</h3>
              </div>

              {/* Search */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm gói dịch vụ theo tên, mô tả hoặc từ khóa..."
                    value={packageSearchTerm}
                    onChange={(e) => setPackageSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Main Plans */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20 mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white m-0">Gói chính</h2>
                  <p className="text-indigo-100 text-sm mt-1 m-0">Chọn 1 gói dịch vụ chính</p>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                      <p className="text-gray-500 text-sm m-0">Đang tải gói dịch vụ...</p>
                    </div>
                  ) : filteredMainPlans.length === 0 ? (
                    <div className="text-center py-8">
                      <GiftIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có gói chính khả dụng</h3>
                      <p className="text-sm text-gray-500 m-0">Vui lòng liên hệ quản trị viên để thêm gói dịch vụ.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMainPlans.map((plan) => (
                        <label
                          key={plan._id}
                          className={`group relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm block w-full ${
                            mainPackageId === plan._id
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-indigo-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="mainPlan"
                            checked={mainPackageId === plan._id}
                            onChange={() => setMainPackageId(plan._id)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <GiftIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                                <div className="text-indigo-600 font-bold text-base">
                                  {formatDisplayCurrency(plan.monthly_price)} /tháng
                                </div>
                              </div>
                              <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              mainPackageId === plan._id
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-gray-300 group-hover:border-indigo-300'
                            }`}>
                              {mainPackageId === plan._id && (
                                <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Supplementary Plans */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20 mb-6">
                <div className={`px-6 py-4 ${mainPackageId ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-100'}`}>
                  <h2 className={`text-xl font-bold m-0 ${mainPackageId ? 'text-white' : 'text-gray-700'}`}>Gói bổ sung (tuỳ chọn)</h2>
                  <p className={`text-sm mt-1 m-0 ${mainPackageId ? 'text-emerald-100' : 'text-gray-500'}`}>
                    {mainPackageId ? 'Chọn các gói dịch vụ bổ sung' : 'Vui lòng chọn gói chính trước'}
                  </p>
                </div>
                <div className={`p-6 ${mainPackageId ? 'opacity-100' : 'opacity-60'}`}>
                  {filteredSupplementaryPlans.length === 0 ? (
                    <div className="text-center py-8">
                      <PlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có gói bổ sung khả dụng</h3>
                      <p className="text-sm text-gray-500 m-0">Tất cả gói dịch vụ đã được bao gồm trong gói chính.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSupplementaryPlans.map((plan) => (
                        <label
                          key={plan._id}
                          className={`group relative border rounded-lg p-3 transition-all duration-200 hover:shadow-sm block w-full ${
                            mainPackageId ? 'cursor-pointer' : 'cursor-not-allowed'
                          } ${
                            supplementaryIds.includes(plan._id)
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={supplementaryIds.includes(plan._id)}
                            onChange={() => mainPackageId && toggleSupplementary(plan._id)}
                            disabled={!mainPackageId}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                              supplementaryIds.includes(plan._id)
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                : 'bg-gray-200'
                            }`}>
                              <PlusIcon className={`w-4 h-4 ${supplementaryIds.includes(plan._id) ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                                <div className="text-emerald-600 font-bold text-base">
                                  {formatDisplayCurrency(plan.monthly_price)} /tháng
                                </div>
                              </div>
                              <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              supplementaryIds.includes(plan._id)
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-gray-300 group-hover:border-emerald-300'
                            }`}>
                              {supplementaryIds.includes(plan._id) && (
                                <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  disabled={!mainPackageId}
                  onClick={() => setCurrentStep(2)}
                  className={`px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md ${
                    !mainPackageId
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Tiếp tục
                </button>
              </div>
            </div>
          )}
          {currentStep === 2 && <div className="p-8">Step 2: Room Type - Will be implemented</div>}
          {currentStep === 3 && <div className="p-8">Step 3: Room Selection - Will be implemented</div>}
          {currentStep === 4 && <div className="p-8">Step 4: Bed Selection - Will be implemented</div>}
          {currentStep === 5 && <div className="p-8">Step 5: Additional Info - Will be implemented</div>}
          {currentStep === 6 && <div className="p-8">Step 6: Review - Will be implemented</div>}
          {currentStep === 7 && <div className="p-8">Step 7: Success - Will be implemented</div>}
        </div>

        {/* Success Modal */}
        <SuccessModal
          open={successOpen}
          name={createdResidentName}
          title="Đã hoàn tất đăng ký người cao tuổi và dịch vụ!"
          onClose={() => {
            setSuccessOpen(false);
            if (createdResidentId) {
              router.replace(`/family/finance/bills/new?residentId=${createdResidentId}`);
            }
          }}
        />
      </div>
    </div>
  );
}
