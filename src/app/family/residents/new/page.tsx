"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/lib/contexts/auth-context';
import { useNotifications } from '@/lib/contexts/notification-context';
import { residentAPI, userAPI, carePlansAPI, roomsAPI, bedsAPI, roomTypesAPI, carePlanAssignmentsAPI, bedAssignmentsAPI } from '@/lib/api';
import { clientStorage } from '@/lib/utils/clientStorage';
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
    setValue,
    trigger
  } = useForm<ResidentFormData>({
    defaultValues: {
      current_medications: [],
      allergies: [],
      medical_history: '',
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

  // Additional info state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationPeriod, setRegistrationPeriod] = useState('3');
  const [customMonths, setCustomMonths] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Success state
  const [createdResidentId, setCreatedResidentId] = useState<string>('');
  const [createdResidentName, setCreatedResidentName] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Room type selection states
  const [roomType, setRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  // Steps configuration
  const steps = [
    'Thông tin người cao tuổi',
    'Liên hệ khẩn cấp',
    'Chọn gói dịch vụ',
    'Chọn loại phòng',
    'Chọn phòng',
    'Chọn giường',
    'Thông tin bổ sung',
    'Xem lại & xác nhận',
    'Hoàn tất'
  ];

  // Pre-index beds by room for O(1) lookup
  const bedsByRoomId = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of beds) {
      if (!b) continue;
      const key = b.room_id || b.roomId || '';
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [beds]);

  const bedsByRoomNumber = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of beds) {
      if (!b) continue;
      const key = b.room_number || b.roomNumber || '';
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [beds]);

  // Helper function to get beds for a room
  const getBedsForRoom = (roomId: string, residentGender?: string) => {
    const selectedRoom = rooms.find(r => r._id === roomId);

    // Fast path: direct map lookup
    let apiBeds = bedsByRoomId[roomId] ? [...bedsByRoomId[roomId]] : [];

    if (apiBeds.length === 0 && selectedRoom?.room_number) {
      apiBeds = bedsByRoomNumber[selectedRoom.room_number] ? [...bedsByRoomNumber[selectedRoom.room_number]] : [];
    }

    if (apiBeds.length === 0 && selectedRoom?.bed_info) {
      const totalBeds = selectedRoom.bed_info.total_beds || selectedRoom.bed_count || 0;
      const availableBeds = selectedRoom.bed_info.available_beds || totalBeds;

      const generatedBeds: any[] = [];
      for (let i = 1; i <= totalBeds; i++) {
        generatedBeds.push({
          _id: `${roomId}_bed_${i}`,
          bed_number: i,
          room_id: roomId,
          room_number: selectedRoom.room_number,
          status: i <= availableBeds ? 'available' : 'occupied'
        });
      }

      return generatedBeds.filter((b: any) => b.status === 'available');
    }

    let filteredBeds = apiBeds.filter(b => b.status === 'available');

    if (residentGender && selectedRoom?.gender) {
      if (residentGender.toLowerCase() !== selectedRoom.gender.toLowerCase()) {
        return [];
      }
    }

    return filteredBeds;
  };

  // Helper function to format bed name
  const formatBedName = (bed: any, roomNumber?: string) => {
    if (bed.bed_number && typeof bed.bed_number === 'string' && bed.bed_number.includes('-')) {
      return bed.bed_number;
    }

    if (bed.bed_name) {
      return bed.bed_name;
    }

    if (roomNumber && bed.bed_number) {
      const roomNum = roomNumber.replace(/\D/g, '');
      const bedLetter = String.fromCharCode(64 + parseInt(bed.bed_number));
      return `${roomNum}-${bedLetter}`;
    }

    return bed.bed_number || `Giường ${bed._id}`;
  };

  // Helper function to format bed type
  const formatBedType = (bedType: string) => {
    if (!bedType || bedType.trim() === '') return 'Tiêu chuẩn';

    const typeMap: { [key: string]: string } = {
      'standard': 'Tiêu chuẩn',
      'electric': 'Điều khiển điện',
      'hospital': 'Bệnh viện',
      'reclining': 'Nằm ngả',
      'adjustable': 'Điều chỉnh được',
      'single': 'Đơn',
      'double': 'Đôi',
      'twin': 'Đôi nhỏ',
      'queen': 'Queen',
      'king': 'King'
    };

    const vietnameseType = typeMap[bedType.toLowerCase()] || bedType || 'Tiêu chuẩn';

    // Viết hoa chữ cái đầu
    return vietnameseType.charAt(0).toUpperCase() + vietnameseType.slice(1);
  };

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

  // Fetch all rooms
  const { data: swrRooms, isLoading: isRoomsLoading, error: roomsError } = useSWR(
    'rooms',
    () => roomsAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Fetch all beds (not just for selected room)
  const { data: swrBeds, isLoading: isBedsLoading, error: bedsError } = useSWR(
    'beds',
    () => bedsAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );


  // Data fetching effects
  useEffect(() => {
    setLoading(isCarePlansLoading);
    if (Array.isArray(swrCarePlans)) setCarePlans(swrCarePlans);
  }, [swrCarePlans, isCarePlansLoading]);

  useEffect(() => {
    if (Array.isArray(swrRoomTypes)) setRoomTypes(swrRoomTypes);
  }, [swrRoomTypes]);

  // Load rooms from cache immediately if available
  useEffect(() => {
    try {
      const raw = clientStorage.getItem('roomsCache');
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0 && rooms.length === 0) {
          setRooms(cached);
          setLoadingRooms(false);
        }
      }
    } catch { }
  }, []);

  useEffect(() => {
    setLoadingRooms(isRoomsLoading);
    if (Array.isArray(swrRooms)) {
      setRooms(swrRooms);
      try { clientStorage.setItem('roomsCache', JSON.stringify(swrRooms)); } catch { }
    }
  }, [swrRooms, isRoomsLoading]);

  useEffect(() => {
    setLoadingBeds(isBedsLoading);
    setBeds(Array.isArray(swrBeds) ? swrBeds : []);
  }, [isBedsLoading, swrBeds]);

  // Auto set startDate from admission_date
  useEffect(() => {
    const admissionDate = watch('admission_date');
    if (admissionDate) {
      const formattedDate = formatDateToDisplay(admissionDate);
      const isoDate = convertDDMMYYYYToISO(formattedDate);
      console.log('Setting startDate:', {
        admissionDate,
        formattedDate,
        isoDate
      });
      setStartDate(isoDate);
    }
  }, [watch('admission_date')]);

  // Calculate end date when start date or registration period changes
  // Auto compute endDate from startDate + duration, then clamp to end of month (local)
  useEffect(() => {
    console.log('End date calculation triggered:', {
      startDate,
      registrationPeriod,
      customMonths
    });

    if (!startDate || !registrationPeriod) {
      setEndDate("");
      return;
    }
    try {
      // Parse start date as local date to avoid timezone issues
      const startDateParts = startDate.split('-');
      if (startDateParts.length !== 3) {
        setEndDate("");
        return;
      }

      const year = parseInt(startDateParts[0]);
      const month = parseInt(startDateParts[1]) - 1; // JavaScript months are 0-based
      const day = parseInt(startDateParts[2]);

      // Create date in local timezone to avoid timezone conversion issues
      const start = new Date(year, month, day);
      if (isNaN(start.getTime())) {
        setEndDate("");
        return;
      }

      // Get duration in months
      let months = 0;
      if (registrationPeriod === 'custom') {
        months = parseInt(customMonths) || 0;
      } else {
        months = parseInt(registrationPeriod);
      }

      if (months <= 0) {
        setEndDate("");
        return;
      }

      // Calculate the target month (start month + duration)
      const getEndOfMonthAfterAddingMonths = (baseDate: Date, addMonths: number) => {
        // Create a new date to avoid mutating the original
        const targetDate = new Date(baseDate);
        // Tính đúng: cộng thêm addMonths - 1 tháng, sau đó lấy ngày cuối tháng
        // Ví dụ: 01/11/2025 + 3 tháng = 01/01/2026, lấy ngày cuối tháng 1 = 31/01/2026
        targetDate.setMonth(targetDate.getMonth() + addMonths );

        // Get the last day of the target month using local timezone
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Return the last day of the target month in local timezone
        return new Date(year, month, lastDay);
      };

      const endOfMonth = getEndOfMonthAfterAddingMonths(start, months);

      // Format as YYYY-MM-DD in local timezone to avoid timezone conversion
      const yearStr = endOfMonth.getFullYear();
      const monthStr = String(endOfMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(endOfMonth.getDate()).padStart(2, '0');

      const calculatedEndDate = `${yearStr}-${monthStr}-${dayStr}`;
      console.log('Calculating end date:', {
        startDate,
        months,
        endOfMonth: endOfMonth.toISOString(),
        calculatedEndDate
      });

      setEndDate(calculatedEndDate);
    } catch (error) {
      console.error('Error calculating end date:', error);
      setEndDate("");
    }
  }, [startDate, registrationPeriod, customMonths]);

  // Debug: Track startDate changes
  useEffect(() => {
    console.log('startDate changed:', startDate);
  }, [startDate]);

  // Debug: Track currentStep changes
  useEffect(() => {
    console.log('currentStep changed:', currentStep);
  }, [currentStep]);

  // Debug: Track endDate changes
  useEffect(() => {
    console.log('endDate changed:', endDate);
  }, [endDate]);

  // Debug: Track registrationPeriod changes
  useEffect(() => {
    console.log('registrationPeriod changed:', registrationPeriod);
  }, [registrationPeriod]);

  // Debug: Track customMonths changes
  useEffect(() => {
    console.log('customMonths changed:', customMonths);
  }, [customMonths]);

  // UI state for review step
  const [showSupplementaryDetails, setShowSupplementaryDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);

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
  const mainPlans = useMemo(() =>
    carePlans
      .filter((p) => p?.category === 'main' && p?.is_active !== false)
      .sort((a, b) => (a.monthly_price || 0) - (b.monthly_price || 0)),
    [carePlans]
  );

  const supplementaryPlans = useMemo(() =>
    carePlans
      .filter((p) => p?.category !== 'main' && p?.is_active !== false)
      .sort((a, b) => (a.monthly_price || 0) - (b.monthly_price || 0)),
    [carePlans]
  );

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
    // Reset attempted submit state when user uploads a file
    if (f) setHasAttemptedSubmit(false);
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
    // Reset attempted submit state when user uploads a file
    if (f) setHasAttemptedSubmit(false);
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
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/20 min-h-[600px]">
          {/* Step 0: Resident Information */}
          {currentStep === 0 && (
            <form>
              <div className="p-8 pb-12">
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
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.admission_date ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
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
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.admission_date.message}</p>
                    )}
                  </div>
                </div>

                {/* CCCD Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">CCCD người cao tuổi <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.cccd_id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      placeholder="Nhập 12 chữ số"
                      {...register('cccd_id', { required: 'CCCD là bắt buộc', pattern: { value: /^\d{12}$/, message: 'Phải gồm đúng 12 chữ số' } })}
                    />
                    {errors.cccd_id && (<p className="mt-2 text-sm text-red-500 font-medium">{errors.cccd_id.message}</p>)}
                  </div>
                </div>

                {/* CCCD Image Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD người thân - Mặt trước <span className="text-red-500">*</span></label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleResidentCccdFrontChange(e.target.files?.[0] || null)}
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${!cccdFrontFile && hasAttemptedSubmit ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    />
                    {cccdFrontPreview && (
                      <div className="mt-3">
                        <img src={cccdFrontPreview} alt="CCCD trước" className="h-28 rounded-lg border border-gray-200 object-cover" />
                      </div>
                    )}
                    {!cccdFrontFile && hasAttemptedSubmit && (
                      <p className="mt-1 text-sm text-red-500 font-medium">Vui lòng tải ảnh CCCD mặt trước</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Đảm bảo ảnh rõ nét, không lóa</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh CCCD người thân - Mặt sau <span className="text-red-500">*</span></label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleResidentCccdBackChange(e.target.files?.[0] || null)}
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${!cccdBackFile && hasAttemptedSubmit ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    />
                    {cccdBackPreview && (
                      <div className="mt-3">
                        <img src={cccdBackPreview} alt="CCCD sau" className="h-28 rounded-lg border border-gray-200 object-cover" />
                      </div>
                    )}
                    {!cccdBackFile && hasAttemptedSubmit && (
                      <p className="mt-1 text-sm text-red-500 font-medium">Vui lòng tải ảnh CCCD mặt sau</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Đảm bảo ảnh rõ nét, không lóa</p>
                  </div>
                </div>

                {/* Thông tin y tế */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-6 mb-8 shadow-md">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="m-0 text-base font-semibold">Thông tin y tế</h3>
                  </div>

                  {/* Tiền sử bệnh lý */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tiền sử bệnh lý
                    </label>
                    <textarea
                      {...register('medical_history')}
                      placeholder="Nhập các bệnh lý đã mắc phải, phẫu thuật, điều trị trước đây..."
                      className={`w-full p-3 border-2 rounded-xl text-sm transition-all duration-200 resize-vertical min-h-[100px] ${errors.medical_history
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                        }`}
                    />
                    {errors.medical_history && (
                      <p className="mt-1 text-sm text-red-500 font-medium">{errors.medical_history.message}</p>
                    )}
                  </div>

                  {/* Thuốc đang sử dụng */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thuốc đang sử dụng
                    </label>
                    <div className="space-y-3">
                      {watch('current_medications')?.map((medication: Medication, index: number) => (
                        <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex-1">
                            <input
                              {...register(`current_medications.${index}.medication_name`)}
                              placeholder="Tên thuốc"
                              className={`w-full p-2 border rounded-lg text-sm ${errors.current_medications?.[index]?.medication_name
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300 bg-white'
                                }`}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              {...register(`current_medications.${index}.dosage`)}
                              placeholder="Liều lượng (VD: 1 viên)"
                              className={`w-full p-2 border rounded-lg text-sm ${errors.current_medications?.[index]?.dosage
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300 bg-white'
                                }`}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              {...register(`current_medications.${index}.frequency`)}
                              placeholder="Tần suất (VD: 2 lần/ngày)"
                              className={`w-full p-2 border rounded-lg text-sm ${errors.current_medications?.[index]?.frequency
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300 bg-white'
                                }`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = watch('current_medications') || [];
                              setValue('current_medications', current.filter((_, i) => i !== index));
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const current = watch('current_medications') || [];
                          setValue('current_medications', [...current, { medication_name: '', dosage: '', frequency: '' }]);
                        }}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Thêm thuốc
                      </button>
                    </div>
                  </div>

                  {/* Dị ứng */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dị ứng
                    </label>
                    <div className="space-y-3">
                      {watch('allergies')?.map((allergy: string, index: number) => (
                        <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <input
                            {...register(`allergies.${index}`)}
                            placeholder="Nhập loại dị ứng (VD: Dị ứng penicillin, Dị ứng hải sản...)"
                            className={`flex-1 p-2 border rounded-lg text-sm ${errors.allergies?.[index]
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300 bg-white'
                              }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = watch('allergies') || [];
                              setValue('allergies', current.filter((_, i) => i !== index));
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const current = watch('allergies') || [];
                          setValue('allergies', [...current, '']);
                        }}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Thêm dị ứng
                      </button>
                    </div>
                  </div>
                </div>

                {/* CCCD và các thông tin khác */}
                <div className="flex justify-end mt-8 gap-4">
                  <Link href="/family" className="px-6 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 no-underline bg-white transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300 inline-flex items-center gap-2">
                    Hủy bỏ
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setHasAttemptedSubmit(true);

                      // Trigger validation for all fields
                      const isValid = await trigger([
                        'full_name',
                        'date_of_birth',
                        'gender',
                        'admission_date',
                        'cccd_id'
                      ]);

                      // Check file uploads
                      if (!cccdFrontFile || !cccdBackFile) {
                        return; // Don't proceed if files are missing - UI will show error
                      }

                      if (isValid) {
                        setCurrentStep(1);
                      }
                    }}
                    className="px-6 py-3 border-0 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: Care Plans Selection */}
          {currentStep === 2 && (
            <div className="p-8 pb-12">
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
                          className={`group relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm block w-full ${mainPackageId === plan._id
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
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mainPackageId === plan._id
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
                          className={`group relative border rounded-lg p-3 transition-all duration-200 hover:shadow-sm block w-full ${mainPackageId ? 'cursor-pointer' : 'cursor-not-allowed'
                            } ${supplementaryIds.includes(plan._id)
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
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${supplementaryIds.includes(plan._id)
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
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${supplementaryIds.includes(plan._id)
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
              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  disabled={!mainPackageId}
                  onClick={() => setCurrentStep(3)}
                  className={`px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md ${!mainPackageId
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
          {/* Step 1: Emergency Contact Information */}
          {currentStep === 1 && (
            <div className="p-8 pb-12">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                <PhoneIcon className="w-5 h-5" />
                <h3 className="m-0 text-base font-semibold">Thông tin liên hệ khẩn cấp</h3>
              </div>

              {/* Use existing account toggle */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-6 mb-8 shadow-md">
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-sm">
                    <div className="font-semibold text-amber-900">Sử dụng thông tin tài khoản đăng nhập hiện tại</div>
                    <div className="text-amber-700 text-xs mt-1">Tự động điền thông tin từ tài khoản của bạn</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useExistingAccount}
                      onChange={(e) => setUseExistingAccount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-amber-300 peer-checked:bg-amber-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>

              {/* Emergency Contact Form */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-6 mb-8 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên người liên hệ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.emergency_contact_name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      placeholder="VD: Nguyễn Văn A"
                      {...register('emergency_contact_name', {
                        required: 'Họ tên người liên hệ là bắt buộc',
                        minLength: { value: 2, message: 'Ít nhất 2 ký tự' }
                      })}
                    />
                    {errors.emergency_contact_name && (
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.emergency_contact_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      placeholder="090xxxxxxx"
                      {...register('emergency_contact_phone')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.emergency_contact_email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      placeholder="email@gmail.com"
                      {...register('emergency_contact_email', {
                        required: 'Email người liên hệ là bắt buộc',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
                      })}
                    />
                    {errors.emergency_contact_email && (
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.emergency_contact_email.message}</p>
                    )}
                  </div>

                  {/* Relationship */}
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
                    {errors.relationship && (
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.relationship.message}</p>
                    )}
                    {errors.relationship_other && (
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.relationship_other.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.emergency_contact_address ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                      placeholder="Nhập địa chỉ của người liên hệ khẩn cấp"
                      {...register('emergency_contact_address', {
                        required: 'Địa chỉ liên hệ là bắt buộc',
                        minLength: { value: 5, message: 'Địa chỉ quá ngắn' }
                      })}
                    />
                    {errors.emergency_contact_address && (
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.emergency_contact_address.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  onClick={async () => {
                    setHasAttemptedSubmit(true);

                    // Trigger validation for all fields
                    const isValid = await trigger([
                      'emergency_contact_name',
                      'emergency_contact_email',
                      'relationship',
                      'emergency_contact_address'
                    ]);

                    if (isValid) {
                      setCurrentStep(2);
                    }
                  }}
                  className="px-6 py-3 border-0 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Room Type Selection */}
          {currentStep === 3 && (
            <div className="p-8 pb-12">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="m-0 text-base font-semibold">Chọn loại phòng</h3>
              </div>

              {/* Room type selection */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại phòng
                  </label>
                  <select
                    value={roomType}
                    onChange={e => { setRoomType(e.target.value); setSelectedRoomId(''); setSelectedBedId(''); }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  >
                    <option value=''>-- Chọn loại phòng --</option>
                    {roomTypes.map(rt => (
                      <option key={rt._id} value={rt.room_type}>
                        {(rt.type_name || rt.room_type)} - {formatDisplayCurrency(rt.monthly_price || 0)}/tháng
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room-type list view */}
                {roomTypes && roomTypes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {roomTypes.map((rt: any, idx: number) => {
                      const active = roomType === rt.room_type;
                      return (
                        <label
                          key={rt._id}
                          className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${active
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : `border-gray-200 hover:border-indigo-300 border-l-4 ${['bg-white', 'bg-slate-50', 'bg-purple-50/40'][idx % 3]
                            } ${['border-l-indigo-200', 'border-l-rose-200', 'border-l-emerald-200'][idx % 3]
                            }`
                            }`}
                        >
                          <input
                            type="radio"
                            name="roomTypeList"
                            checked={active}
                            onChange={() => { setRoomType(rt.room_type); setSelectedRoomId(''); setSelectedBedId(''); }}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 w-full">
                            {/* Info (left) */}
                            <div className="min-w-0 flex-1">
                              <div className="text-base font-semibold text-gray-900 truncate">{rt.type_name || rt.room_type}</div>
                              {rt.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rt.description}</p>
                              )}
                            </div>
                            {/* Price (fixed width, right aligned) */}
                            <div className="text-right flex-shrink-0 w-44">
                              <div className="text-xs text-gray-500">Giá/tháng</div>
                              <div className="font-bold text-indigo-600 whitespace-nowrap">{formatDisplayCurrency(rt.monthly_price || 0)}</div>
                            </div>
                            {/* Radio indicator */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                              {active && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {roomType && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                    {(() => {
                      const residentGender = watch('gender');

                      if (isRoomsLoading) {
                        return (
                          <div className="text-sm text-indigo-600 m-0 font-medium">Đang tải danh sách phòng...</div>
                        );
                      }

                      if (roomsError) {
                        return (
                          <div className="text-sm text-red-600 m-0 font-medium">
                            Lỗi tải danh sách phòng: {roomsError.message || 'Không thể kết nối đến server'}
                          </div>
                        );
                      }

                      if (bedsError) {
                        return (
                          <div className="text-sm text-red-600 m-0 font-medium">
                            Lỗi tải danh sách giường: {bedsError.message || 'Không thể kết nối đến server'}
                          </div>
                        );
                      }

                      const availableRooms = rooms.filter(r => {
                        if (r.room_type !== roomType || r.status !== 'available') {
                          return false;
                        }

                        if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                          return false;
                        }

                        const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                        return availableBedsInRoom.length > 0;
                      });

                      const totalAvailableBeds = availableRooms.reduce((total, room) => {
                        return total + getBedsForRoom(room._id, residentGender).length;
                      }, 0);

                      const genderText = residentGender === 'male' ? 'nam' : residentGender === 'female' ? 'nữ' : 'tất cả';

                      return (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-indigo-600 m-0 font-medium">
                            Có <span className="font-semibold">{availableRooms.length}</span> phòng trống cho {genderText} với <span className="font-semibold">{totalAvailableBeds}</span> giường trống.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  disabled={!roomType}
                  onClick={() => setCurrentStep(4)}
                  className={`px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md ${!roomType
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
          {/* Step 4: Room Selection */}
          {currentStep === 4 && (
            <div className="p-8 pb-12">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                        Chọn phòng
                      </h1>
                      <p className="text-base text-slate-600 mt-1 font-medium">
                        Lựa chọn phòng phù hợp
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phòng
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={e => setSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  >
                    <option value=''>-- Chọn phòng --</option>
                    {(() => {
                      const residentGender = watch('gender');
                      return rooms.filter(r => {
                        if (r.room_type !== roomType || r.status !== 'available') {
                          return false;
                        }

                        if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                          return false;
                        }

                        const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                        return availableBedsInRoom.length > 0;
                      }).map(room => {
                        const availableBedsCount = getBedsForRoom(room._id, residentGender).length;
                        const genderText = room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác';
                        return (
                          <option key={room._id} value={room._id}>
                            Phòng {room.room_number} ({genderText}) - {availableBedsCount} giường trống
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>

                {(() => {
                  const residentGender = watch('gender');
                  const availableRooms = rooms.filter(r => {
                    if (r.room_type !== roomType || r.status !== 'available') {
                      return false;
                    }

                    if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                      return false;
                    }

                    const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                    return availableBedsInRoom.length > 0;
                  });

                  if (isRoomsLoading) {
                    return (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                        <p className="text-sm text-indigo-600 m-0 font-medium">Đang tải danh sách phòng...</p>
                      </div>
                    );
                  }

                  if (roomsError) {
                    return (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <p className="text-sm text-red-600 m-0 font-medium">
                          Lỗi tải danh sách phòng: {roomsError.message || 'Không thể kết nối đến server'}
                        </p>
                      </div>
                    );
                  }

                  if (availableRooms.length === 0) {
                    const genderText = residentGender === 'male' ? 'nam' : residentGender === 'female' ? 'nữ' : '';
                    return (
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <p className="text-sm text-yellow-700 m-0 font-medium">
                          Không có phòng nào có giường trống cho {genderText} trong loại phòng này
                        </p>
                      </div>
                    );
                  }

                  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                  const availableBedsCountSelected = selectedRoom ? getBedsForRoom(selectedRoomId, residentGender).length : 0;
                  const genderTextSelected = selectedRoom?.gender === 'male' ? 'Nam' : selectedRoom?.gender === 'female' ? 'Nữ' : 'Khác';

                  return (
                    <div>
                      {selectedRoom && (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                          <p className="text-sm text-indigo-600 m-0 font-medium">
                            Đã chọn: <span className="font-semibold">Phòng {selectedRoom?.room_number} ({genderTextSelected})</span>
                            <span className="text-indigo-500 ml-2">({availableBedsCountSelected} giường trống)</span>
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {availableRooms.map((room, idx: number) => {
                          const availableBedsCount = getBedsForRoom(room._id, residentGender).length;
                          const roomTypeObj = roomTypes.find(rt => rt.room_type === room.room_type);
                          const monthlyPrice = roomTypeObj?.monthly_price || 0;
                          const genderBadge = room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác';
                          const active = selectedRoomId === room._id;
                          return (
                            <label
                              key={room._id}
                              className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${active
                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                : `border-gray-200 hover:border-indigo-300 border-l-4 ${['bg-white', 'bg-slate-50', 'bg-purple-50/40'][idx % 3]
                                } ${['border-l-indigo-200', 'border-l-rose-200', 'border-l-emerald-200'][idx % 3]
                                }`
                                }`}
                            >
                              <input
                                type="radio"
                                name="roomList"
                                checked={active}
                                onChange={() => { setSelectedRoomId(room._id); setSelectedBedId(''); }}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3 w-full">
                                {/* Info (left) */}
                                <div className="min-w-0 flex-1">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    <div className="text-xs">
                                      <div className="text-gray-500">Phòng</div>
                                      <div className="font-semibold text-gray-900 text-sm">{room.room_number}</div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="text-gray-500">Phòng dành cho</div>
                                      <div className="font-medium text-gray-900">{genderBadge}</div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="text-gray-500">Tầng</div>
                                      <div className="font-medium text-gray-900">{room.floor}</div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="text-gray-500">Loại phòng</div>
                                      <div className="font-medium text-gray-900 truncate">{roomTypeObj?.type_name || room.room_type}</div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="text-gray-500">Giường trống</div>
                                      <div className="font-semibold text-emerald-700">{availableBedsCount} giường</div>
                                    </div>
                                  </div>
                                </div>
                                {/* Price (fixed width, right aligned) */}
                                <div className="text-right flex-shrink-0 w-44">
                                  <div className="text-xs text-gray-500">Giá/tháng</div>
                                  <div className="font-bold text-indigo-600 whitespace-nowrap">{formatDisplayCurrency(monthlyPrice)}</div>
                                </div>
                                {/* Radio indicator */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                                  {active && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {selectedRoomId && (() => {
                const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                if (!selectedRoom) return null;
                const typeObj = roomTypes.find(rt => rt.room_type === selectedRoom.room_type);
                const infoItems = [
                  {
                    label: "Số phòng",
                    value: selectedRoom.room_number,
                    icon: (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M9 9h6v6H9z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Loại phòng",
                    value: typeObj?.type_name || selectedRoom.room_type,
                    icon: (
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M3 7h18M3 12h18M3 17h18" />
                      </svg>
                    ),
                  },
                  {
                    label: "Phòng dành cho",
                    value: selectedRoom.gender === 'male' ? 'Nam' : selectedRoom.gender === 'female' ? 'Nữ' : 'Khác',
                    icon: (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20v-2a4 4 0 018 0v2" />
                      </svg>
                    ),
                  },
                  {
                    label: "Tầng",
                    value: selectedRoom.floor,
                    icon: (
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="4" y="10" width="16" height="10" rx="2" />
                        <path d="M12 2v8" />
                      </svg>
                    ),
                  },
                  {
                    label: "Số giường trống",
                    value: `${selectedRoom.bed_count} giường`,
                    icon: (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="3" y="10" width="18" height="7" rx="2" />
                        <path d="M21 17v2M3 17v2" />
                      </svg>
                    ),
                  },
                  {
                    label: "Giá phòng",
                    value: (
                      <span className="font-bold text-indigo-600">
                        {formatDisplayCurrency(typeObj?.monthly_price || 0)} <span className="font-normal text-gray-500 text-sm">/tháng</span>
                      </span>
                    ),
                    icon: (
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
                      </svg>
                    ),
                  },
                ];
                return (
                  <div className="mt-8 bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg border border-indigo-100">
                    <h2 className="text-xl font-bold text-indigo-700 mb-6">Chi tiết thông tin phòng</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {infoItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                          <div className="flex-shrink-0">{item.icon}</div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                            <div className={`text-base font-semibold text-gray-900 ${item.label === "Giá phòng" ? "font-bold" : ""}`}>
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {typeObj?.description && (
                      <div className="mt-8 bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M13 16h-1v-4h-1m1-4h.01" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          <span className="text-sm text-indigo-700 font-semibold">Mô tả phòng</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm">{typeObj.description}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  disabled={!selectedRoomId}
                  onClick={() => setCurrentStep(5)}
                  className={`px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md ${!selectedRoomId
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
          {/* Step 5: Bed Selection */}
          {currentStep === 5 && (
            <div className="p-8 pb-12">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                        Chọn giường
                      </h1>
                      <p className="text-base text-slate-600 mt-1 font-medium">
                        Lựa chọn giường cụ thể trong phòng đã chọn
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giường
                  </label>
                  <select
                    value={selectedBedId}
                    onChange={e => setSelectedBedId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  >
                    <option value=''>-- Chọn giường --</option>
                    {(() => {
                      const residentGender = watch('gender');
                      return getBedsForRoom(selectedRoomId, residentGender).map(bed => {
                        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                        const roomNumber = selectedRoom?.room_number;
                        return (
                          <option key={bed._id} value={bed._id}>
                            {formatBedName(bed, roomNumber)}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>

                {(() => {
                  const residentGender = watch('gender');
                  const beds = getBedsForRoom(selectedRoomId, residentGender);
                  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                  const roomNumber = selectedRoom?.room_number;

                  return (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Danh sách giường trống</div>
                      <div className="space-y-2">
                        {beds.map((b, idx: number) => {
                          const isSelected = selectedBedId === b._id;
                          const statusBadge = b.status === 'available'
                            ? 'bg-emerald-100 text-emerald-700'
                            : b.status === 'occupied'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700';
                          return (
                            <label
                              key={b._id}
                              className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 block w-full ${isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                : `border-gray-200 hover:border-emerald-300 border-l-4 ${['bg-white', 'bg-slate-50', 'bg-green-50/40'][idx % 3]} ${['border-l-emerald-200', 'border-l-indigo-200', 'border-l-amber-200'][idx % 3]}`
                                }`}
                            >
                              <input
                                type="radio"
                                name="bedList"
                                checked={isSelected}
                                onChange={() => setSelectedBedId(b._id)}
                                className="sr-only"
                              />

                              <div className="flex items-center gap-3 w-full">
                                <div className="min-w-0 flex-1">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
                                    <div className="text-xs">
                                      <div className="text-gray-500">Giường</div>
                                      <div className="font-semibold text-gray-900 text-sm">{formatBedName(b, roomNumber)}</div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="text-gray-500">Loại giường</div>
                                      <div className="font-medium text-gray-900">{formatBedType(b.bed_type) || 'Tiêu chuẩn'}</div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="text-gray-500">Trạng thái</div>
                                      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                                        {b.status === 'available'
                                          ? 'Còn trống'
                                          : b.status === 'occupied'
                                            ? 'Đã có người'
                                            : b.status === 'maintenance'
                                              ? 'Bảo trì'
                                              : 'Không rõ'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 group-hover:border-emerald-300'}`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Navigation */}
              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  disabled={!selectedBedId}
                  onClick={() => setCurrentStep(6)}
                  className={`px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md ${!selectedBedId
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
          {/* Step 6: Additional Info */}
          {currentStep === 6 && (
            <div className="p-8 pb-12">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white mb-6 flex items-center gap-2 shadow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="m-0 text-base font-semibold">Thông tin bổ sung</h3>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Thời gian sử dụng dịch vụ
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời hạn sử dụng dịch vụ</label>
                    <div className="flex items-center gap-2 flex-nowrap w-full">
                      {['3', '6', '12', 'custom'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRegistrationPeriod(opt)}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors border-2 whitespace-nowrap ${registrationPeriod === opt
                            ? opt === 'custom'
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                          aria-pressed={registrationPeriod === opt}
                        >
                          {opt === '3' && '3 tháng'}
                          {opt === '6' && '6 tháng'}
                          {opt === '12' && '12 tháng'}
                          {opt === 'custom' && 'Tùy chọn'}
                        </button>
                      ))}
                      {registrationPeriod === 'custom' && (
                        <div className="relative flex-shrink-0">
                          <input
                            type="number"
                            min={3}
                            step={1}
                            value={customMonths}
                            onChange={(e) => setCustomMonths(e.target.value)}
                            placeholder="Số tháng"
                            className="w-36 pr-12 rounded-xl border-2 border-amber-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                            aria-label="Số tháng sử dụng dịch vụ tùy chọn"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">tháng</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Thời hạn sử dụng dịch vụ tối thiểu là 3 tháng.
                    </p>

                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={startDate ? new Date(startDate).toLocaleDateString('vi-VN') : ''}
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                        placeholder="Sẽ tự động lấy từ ngày nhập viện"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ngày bắt đầu sử dụng là ngày nhập viện của người cao tuổi: {watch('admission_date') ? formatDateToDisplay(watch('admission_date') || '') : 'Chưa chọn'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc:</label>
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          value={endDate ? (() => {
                            // Parse endDate as local date to avoid timezone issues
                            const parts = endDate.split('-');
                            if (parts.length === 3) {
                              const year = parseInt(parts[0]);
                              const month = parseInt(parts[1]) - 1;
                              const day = parseInt(parts[2]);
                              const date = new Date(year, month, day);
                              return date.toLocaleDateString('vi-VN');
                            }
                            return endDate;
                          })() : ''}
                          readOnly
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                          placeholder="Sẽ tự động tính dựa trên thời hạn"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú:</label>
                    <textarea
                      value={medicalNotes}
                      onChange={e => setMedicalNotes(e.target.value)}
                      placeholder="Nhập thông tin y tế, yêu cầu đặc biệt hoặc ghi chú khác..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-vertical"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  disabled={!watch('admission_date') || (registrationPeriod === 'custom' && (!customMonths || parseInt(customMonths) < 3))}
                  onClick={() => setCurrentStep(7)}
                  className={`px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md ${!watch('admission_date') || (registrationPeriod === 'custom' && (!customMonths || parseInt(customMonths) < 3))
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tiếp tục
                </button>
              </div>
            </div>
          )}
          {/* Step 7: Review & Confirmation */}
          {currentStep === 7 && (
            <div className="p-8 pb-12">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                        Xem lại & xác nhận
                      </h1>
                      <p className="text-base text-slate-600 mt-1 font-medium">
                        Kiểm tra thông tin trước khi hoàn tất đăng ký
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Thông tin đăng ký
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Người thụ hưởng</div>
                        <div className="font-semibold text-gray-900">{watch('full_name') || 'Chưa chọn'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <GiftIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Gói chính</div>
                        <div className="font-semibold text-gray-900">{carePlans.find(p => p._id === mainPackageId)?.plan_name || 'Chưa chọn'}</div>
                      </div>
                    </div>

                    {supplementaryIds.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PlusIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 font-medium">Gói bổ sung ({supplementaryIds.length})</div>
                            <div className="font-semibold text-gray-900">
                              {carePlans.filter(p => supplementaryIds.includes(p._id)).length > 2
                                ? `${carePlans.filter(p => supplementaryIds.includes(p._id))[0]?.plan_name} +${carePlans.filter(p => supplementaryIds.includes(p._id)).length - 1} gói khác`
                                : carePlans.filter(p => supplementaryIds.includes(p._id)).map(p => p.plan_name).join(', ')
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Phòng</div>
                        <div className="font-semibold text-gray-900">
                          {rooms.find(r => r._id === selectedRoomId)?.room_number || 'Chưa chọn'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Giường</div>
                        <div className="font-semibold text-gray-900">
                          {(() => {
                            let selectedBed = beds.find(b => b._id === selectedBedId);

                            if (!selectedBed && selectedRoomId) {
                              const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                              if (selectedRoom?.bed_info) {
                                const bedNumber = selectedBedId.split('_bed_')[1];
                                if (bedNumber) {
                                  selectedBed = {
                                    _id: selectedBedId,
                                    bed_number: parseInt(bedNumber),
                                    room_id: selectedRoomId,
                                    room_number: selectedRoom.room_number,
                                    status: 'available'
                                  };
                                }
                              }
                            }

                            const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                            return selectedBed ? formatBedName(selectedBed, selectedRoom?.room_number) : 'Chưa chọn';
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 font-medium">Thời gian đăng ký</div>
                          <div className="font-semibold text-gray-900">
                            {`${registrationPeriod} tháng (${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'} - ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chưa chọn'})`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Ước tính chi phí hàng tháng
                  </h4>

                  {(() => {
                    const mainPlan = carePlans.find(p => p._id === mainPackageId);
                    const supplementaryPlansList = carePlans.filter(p => supplementaryIds.includes(p._id));

                    const mainPlanPrice = mainPlan?.monthly_price || 0;
                    const supplementaryPlansPrice = supplementaryPlansList.reduce((total, plan) => total + (plan.monthly_price || 0), 0);
                    const totalServicePrice = mainPlanPrice + supplementaryPlansPrice;

                    // Calculate room price
                    const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                    const roomTypeObj = roomTypes.find(rt => rt.room_type === selectedRoom?.room_type);
                    const roomPrice = roomTypeObj?.monthly_price || 0;

                    const totalPrice = totalServicePrice + roomPrice;

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                          <span className="text-gray-700">Giá gói chính</span>
                          <span className="font-semibold text-gray-900">{formatDisplayCurrency(mainPlanPrice)} /tháng</span>
                        </div>

                        {supplementaryPlansList.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                              <span className="text-gray-700">Giá gói bổ sung ({supplementaryPlansList.length})</span>
                              <span className="font-semibold text-gray-900">{formatDisplayCurrency(supplementaryPlansPrice)} /tháng</span>
                            </div>

                            {supplementaryPlansList.map((plan, index) => (
                              <div key={plan._id} className="flex justify-between items-center py-1 px-3 bg-indigo-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm text-gray-600">{plan.plan_name}</span>
                                </div>
                                <span className="text-sm font-medium text-indigo-700">{formatDisplayCurrency(plan.monthly_price || 0)} /tháng</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                          <span className="text-gray-700">Giá phòng</span>
                          <span className="font-semibold text-gray-900">{formatDisplayCurrency(roomPrice)} /tháng</span>
                        </div>

                        <div className="flex justify-between items-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4">
                          <span className="text-white font-bold text-lg">Tổng cộng</span>
                          <span className="text-white font-bold text-lg">{formatDisplayCurrency(totalPrice)} /tháng</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end mt-8 gap-4">
                <button
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
                >
                  Quay lại
                </button>
                <button
                  onClick={async () => {
                    if (!user?.id) {
                      toast.error('Bạn cần đăng nhập để đăng ký');
                      return;
                    }

                    if (!mainPackageId) {
                      toast.error('Vui lòng chọn ít nhất một gói dịch vụ chính');
                      return;
                    }

                    if (!roomType) {
                      toast.error('Vui lòng chọn loại phòng');
                      return;
                    }

                    if (!selectedRoomId) {
                      toast.error('Vui lòng chọn phòng');
                      return;
                    }

                    if (!selectedBedId) {
                      toast.error('Vui lòng chọn giường');
                      return;
                    }

                    setIsSubmitting(true);
                    try {
                      // Prepare resident data
                      const formData = new FormData();

                      // Add resident information
                      if (avatarFile) formData.append('avatar', avatarFile);
                      if (cccdFrontFile) formData.append('cccd_front', cccdFrontFile);
                      if (cccdBackFile) formData.append('cccd_back', cccdBackFile);

                      formData.append('full_name', watch('full_name'));
                      formData.append('gender', watch('gender'));
                      formData.append('date_of_birth', convertDDMMYYYYToISO(formatDateToDisplay(watch('date_of_birth'))));
                      formData.append('cccd_id', watch('cccd_id'));
                      formData.append('family_member_id', user.id);
                      formData.append('relationship', watch('relationship') || 'con trai');
                      formData.append('medical_history', watch('medical_history') || '');
                      formData.append('current_medications', JSON.stringify((watch('current_medications') || []).filter(m => m.medication_name && m.dosage && m.frequency)));
                      formData.append('allergies', JSON.stringify((watch('allergies') || []).filter(a => a && a.trim())));

                      // Emergency contact
                      const userDisplayName = (user as any)?.full_name || (user as any)?.fullName || user.name || user.email || 'Gia đình';
                      const userPhone = (user as any)?.phone || '';
                      formData.append('emergency_contact', JSON.stringify({
                        name: watch('emergency_contact_name') || userDisplayName,
                        phone: watch('emergency_contact_phone') || userPhone,
                        email: watch('emergency_contact_email') || user.email || '',
                        relationship: watch('relationship') || 'con trai',
                        address: watch('emergency_contact_address') || ''
                      }));

                      const admissionDate = watch('admission_date');
                      if (admissionDate) {
                        formData.append('admission_date', convertDDMMYYYYToISO(formatDateToDisplay(admissionDate)));
                      }

                      // Create resident
                      const createdResident = await residentAPI.createMy(formData);

                      if (createdResident && (createdResident._id || createdResident.id)) {
                        const residentId = createdResident._id || createdResident.id;

                        // Create care plan assignment với tất cả care plans
                        const allPlanIds = [mainPackageId, ...supplementaryIds];
                        
                        try {
                          // Lấy thông tin phòng và loại phòng đã chọn
                          const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                          const selectedRoomType = roomTypes.find(rt => rt.room_type === roomType);
                          
                          // Tính tổng chi phí của tất cả care plans
                          const totalCarePlansCost = allPlanIds.reduce((total, planId) => {
                            const plan = carePlans.find(p => p._id === planId);
                            return total + (plan?.monthly_price || 0);
                          }, 0);
                          
                          const roomCost = selectedRoomType?.monthly_price || 0;
                          const totalCost = roomCost + totalCarePlansCost;
                          
                          // Resolve assigned bed id (map placeholder -> real bed id if needed)
                          let assignedBedId: string | undefined = undefined;
                          if (selectedBedId) {
                            if (!selectedBedId.includes('_bed_')) {
                              assignedBedId = selectedBedId;
                            } else {
                              const residentGender = watch('gender');
                              const availableBedsInSelectedRoom = getBedsForRoom(selectedRoomId, residentGender);
                              const generatedNumber = selectedBedId.split('_bed_')[1];
                              // 1) Try match from computed available beds (must not be placeholder id)
                              let actualBed = availableBedsInSelectedRoom.find((b: any) => String(b.bed_number) === String(generatedNumber) && !(typeof b._id === 'string' && b._id.includes('_bed_')));
                              if (actualBed && (actualBed._id || actualBed.id)) {
                                assignedBedId = actualBed._id || actualBed.id;
                              }
                              // Fallback: fetch from API by room if not found locally
                              if (!assignedBedId) {
                                try {
                                  const realBeds = await bedsAPI.getByRoom?.(selectedRoomId, 'available');
                                  if (Array.isArray(realBeds)) {
                                    const match = realBeds.find((b: any) => String(b.bed_number) === String(generatedNumber));
                                    if (match && (match._id || match.id)) {
                                      assignedBedId = match._id || match.id;
                                    }
                                  }
                                } catch {}
                              }
                              // Extra fallback: use first available real bed from local cache by room id
                              if (!assignedBedId) {
                                try {
                                  let realBedsInRoom = (beds || []).filter((b: any) => {
                                    const roomId = (b.room_id && (b.room_id._id || b.room_id)) || b.roomId;
                                    return (roomId === selectedRoomId) && (b.status === 'available' || !b.status);
                                  });
                                  if (realBedsInRoom.length > 0) {
                                    const first = realBedsInRoom.find((b: any) => String(b.bed_number) === String(generatedNumber)) || realBedsInRoom[0];
                                    if (first && (first._id || first.id)) {
                                      assignedBedId = first._id || first.id;
                                    }
                                  }
                                } catch {}
                              }
                            }
                          }

                          // Chuẩn bị payload cho care plan assignment
                          const carePlanPayload: any = {
                            resident_id: residentId,
                            care_plan_ids: allPlanIds, // Gửi tất cả care plan IDs trong một assignment
                            start_date: startDate || new Date().toISOString().split('T')[0],
                            end_date: endDate || (() => {
                              // Fallback: calculate end date if not set
                              const fallbackStart = new Date();
                              const fallbackEnd = new Date(fallbackStart);
                              fallbackEnd.setMonth(fallbackEnd.getMonth() + 6);
                              const year = fallbackEnd.getFullYear();
                              const month = fallbackEnd.getMonth();
                              const lastDay = new Date(year, month + 1, 0).getDate();
                              return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                            })(),
                            // Thêm thông tin phòng/giường
                            selected_room_type: roomType,
                            assigned_room_id: selectedRoomId,
                            room_monthly_cost: roomCost,
                            care_plans_monthly_cost: totalCarePlansCost,
                            total_monthly_cost: totalCost,
                            // Đồng bộ với flow services/purchase
                            staff_id: (user && (user as any).id) ? (user as any).id : '',
                            status: 'pending'
                          };

                          // Thêm assigned_bed_id nếu đã resolve được
                          if (assignedBedId) {
                            carePlanPayload.assigned_bed_id = assignedBedId;
                          }

                          const createdAssignment = await carePlanAssignmentsAPI.create(carePlanPayload);
                          if (!createdAssignment || !(createdAssignment._id || createdAssignment.id)) {
                            throw new Error('Không thể tạo care plan assignment');
                          }
                        } catch (error) {
                          console.error('Error creating care plan assignment:', error);
                          throw error; // Re-throw để hiển thị lỗi cho user
                        }

                        // Tạo bed assignment sau khi tạo care plan assignment
                        try {
                          let bedIdToAssign = selectedBedId;
                          // Nếu là ID phát sinh tạm (_bed_), cố gắng map sang bed thật trong phòng đã chọn
                          if (bedIdToAssign.includes('_bed_')) {
                            const generatedNumber = bedIdToAssign.split('_bed_')[1];
                            let realBedsInRoom = (beds || []).filter((b: any) => {
                              const roomMatch = (b.room_id === selectedRoomId) || (b.room_id?._id === selectedRoomId);
                              return roomMatch && (b.status === 'available' || !b.status);
                            });

                            // Nếu cache local trống, gọi API lấy giường theo phòng
                            if (!realBedsInRoom.length) {
                              try {
                                const byRoom = await bedsAPI.getByRoom?.(selectedRoomId, 'available');
                                realBedsInRoom = Array.isArray(byRoom) ? byRoom : [];
                              } catch {}
                            }

                            // Ưu tiên match theo bed_number nếu có
                            let matched = realBedsInRoom.find((b: any) => String(b.bed_number) === String(generatedNumber));
                            if (!matched) matched = realBedsInRoom[0];

                            if (matched && (matched._id || matched.id)) {
                              bedIdToAssign = matched._id || matched.id;
                              console.warn('Mapped placeholder bed to real bed:', bedIdToAssign);
                            } else {
                              throw new Error('Phòng đã chọn chưa có dữ liệu giường thực');
                            }
                          }

                          const createdBedAssignment = await bedAssignmentsAPI.create({
                            resident_id: residentId,
                            bed_id: bedIdToAssign,
                            assigned_by: (user && (user as any).id) ? (user as any).id : '',
                            status: 'pending',
                            unassigned_date: endDate || (() => {
                              // Fallback: calculate end date if not set
                              const fallbackStart = new Date();
                              const fallbackEnd = new Date(fallbackStart);
                              fallbackEnd.setMonth(fallbackEnd.getMonth() + 6);
                              const year = fallbackEnd.getFullYear();
                              const month = fallbackEnd.getMonth();
                              const lastDay = new Date(year, month + 1, 0).getDate();
                              return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                            })()
                          });
                          if (!createdBedAssignment || !(createdBedAssignment._id || createdBedAssignment.id)) {
                            throw new Error('Không thể tạo bed assignment');
                          }
                          console.log('Bed assignment created successfully');
                        } catch (error) {
                          console.error('Error creating bed assignment:', error);
                          throw error;
                        }

                        // Add notification
                        addNotification({
                          type: 'success',
                          title: 'Đăng ký thành công',
                          message: `Người cao tuổi ${watch('full_name')} đã được đăng ký thành công với dịch vụ và phòng giường.`,
                          category: 'system',
                          actionUrl: '/family'
                        });

                        setCreatedResidentId(residentId);
                        setCreatedResidentName(watch('full_name'));
                        setShowSuccessModal(true);
                        
                        // Tự động chuyển qua trang thanh toán sau 2 giây
                        setTimeout(() => {
                          setShowSuccessModal(false);
                          router.push(`/family/finance/bills/new?residentId=${residentId}`);
                        }, 2000);
                      } else {
                        toast.error('Không thể tạo hồ sơ người cao tuổi. Vui lòng thử lại.');
                      }
                    } catch (error: any) {
                      console.error('Registration error:', error);
                      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`
                    px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                    ${isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                    }
                  `}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất đăng ký và chuyển đến thanh toán'}
                </button>
              </div>
            </div>
          )}

          {/* Step 8: Success - Now handled by modal */}
          {currentStep === 8 && (
            <div className="p-8 pb-12 text-center">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8 shadow-md">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Đang xử lý...</h3>
                <p className="text-gray-600 mb-6">
                  Vui lòng chờ trong giây lát...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
              <div className="p-8 text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircleIcon className="w-10 h-10 text-white" />
                </div>
                
                {/* Success Message */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Đăng ký thành công!</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Người cao tuổi <strong className="text-emerald-600">{createdResidentName}</strong> đã được đăng ký thành công với phòng giường và các dịch vụ đã chọn.
                </p>
                
                {/* Auto Redirect Info */}
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-emerald-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-semibold text-emerald-800">Đang chuyển hướng...</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    Tự động chuyển đến trang thanh toán trong vài giây...
                  </p>
                </div>
                
              
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
