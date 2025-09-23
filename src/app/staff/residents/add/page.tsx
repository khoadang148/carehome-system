"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { residentAPI, userAPI } from '@/lib/api';
import { convertDDMMYYYYToISO } from '@/lib/utils/validation';
import { handleAPIError } from '@/lib/utils/api-error-handler';
import { useNotifications } from '@/lib/contexts/notification-context';

type Medication = {
  medication_name: string;
  dosage: string;
  frequency: string;
};

type ResidentFormData = {
  full_name: string;
  date_of_birth: string;
  gender: string;
  avatar: string;
  admission_date: string;
  discharge_date: string;
  family_member_id: string;
  relationship: string;
  relationship_other?: string;
  medical_history: string;
  current_medications: Medication[];
  allergies: string[];
  emergency_contact: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    relationship_other?: string;
    address?: string;
  };
  care_level: string;
  status: string;
  notes: string;
  family_account_type: 'new' | 'existing';
  existing_family_id?: string;
};

const validateAge = (dateOfBirth: string) => {
  if (!dateOfBirth) return "Ngày sinh là bắt buộc";
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    return "Ngày sinh không hợp lệ";
  }
  
  if (birthDate > today) {
    return "Ngày sinh không thể trong tương lai";
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 60) return "Người cao tuổi phải từ 60 tuổi trở lên";
  if (age >= 130) return "Tuổi không hợp lệ (phải nhỏ hơn 130)";
  return true;
};

const validatePhone = (phone: string) => {
  if (!phone) return "Số điện thoại là bắt buộc";
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return "Số điện thoại không đúng định dạng (VD: 0987654321 hoặc +84987654321)";
  }
  
  return true;
};

const validateEmail = (email: string) => {
  if (!email) return "Email là bắt buộc";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return "Email không đúng định dạng (VD: example@email.com)";
  }
  
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
  if (!dateRegex.test(dateStr)) {
    return `${fieldName} phải có định dạng dd/mm/yyyy`;
  }
  
  const [d, m, y] = dateStr.split('/');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  
  if (date.getDate() !== parseInt(d) || date.getMonth() !== parseInt(m) - 1 || date.getFullYear() !== parseInt(y)) {
    return `${fieldName} không hợp lệ`;
  }
  
  if (fieldName === 'Ngày sinh') {
    const today = new Date();
    if (date > today) {
      return `${fieldName} không thể trong tương lai`;
    }
  }
  
  return true;
}


export default function AddResidentPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://example.com/avatar.jpg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([
    { medication_name: '', dosage: '', frequency: '' }
  ]);
  const [allergies, setAllergies] = useState<string[]>(['']);
  const [existingFamilyAccounts, setExistingFamilyAccounts] = useState<any[]>([]);
  const [admissionDateDisplay, setAdmissionDateDisplay] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    watch,
    setValue,
    trigger
  } = useForm<ResidentFormData>({
    defaultValues: {
      status: 'active',
      avatar: '/default-avatar.svg',
      family_member_id: '',
      admission_date: '',
      current_medications: [],
      allergies: [],
      family_account_type: 'new'
    },
    mode: 'onChange'
  });

  const familyAccountType = watch('family_account_type');
  const selectedRelationship = watch('emergency_contact.relationship');

  useEffect(() => {
    setRelationshipType(selectedRelationship || '');
    if (selectedRelationship === 'khác') {
      setValue('emergency_contact.relationship_other', '');
    } else {
      setValue('emergency_contact.relationship_other', undefined);
    }
  }, [selectedRelationship, setValue]);

  useEffect(() => {
    const loadFamilyAccounts = async () => {
      try {
        const allUsers = await userAPI.getAll();
        const familyAccounts = allUsers.filter((user: any) => user.role === 'family');
        setExistingFamilyAccounts(familyAccounts);
      } catch (error) {
      }
    };
    loadFamilyAccounts();
  }, []);

  const addMedication = () => {
    setMedications([...medications, { medication_name: '', dosage: '', frequency: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };

  const addAllergy = () => {
    setAllergies([...allergies, '']);
  };

  const removeAllergy = (index: number) => {
    if (allergies.length > 1) {
      setAllergies(allergies.filter((_, i) => i !== index));
    }
  };

  const updateAllergy = (index: number, value: string) => {
    const updatedAllergies = [...allergies];
    updatedAllergies[index] = value;
    setAllergies(updatedAllergies);
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
          let { width, height } = img;
          
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
    }
  };
  
  const onSubmit = async (data: ResidentFormData) => {
    setIsSubmitting(true);
    try {
      if (!data.full_name?.trim()) {
        toast.error('Họ và tên là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      
      if (!data.date_of_birth) {
        toast.error('Ngày sinh là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      
      const formattedDate = formatDateToDisplay(data.date_of_birth);
      const dateValidation = validateDate(formattedDate, 'Ngày sinh');
      if (dateValidation !== true) {
        toast.error(dateValidation);
        setIsSubmitting(false);
        return;
      }
      
      const ageValidation = validateAge(data.date_of_birth);
      if (ageValidation !== true) {
        toast.error(ageValidation);
        setIsSubmitting(false);
        return;
      }
      
      if (!data.gender) {
        toast.error('Giới tính là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      if (data.family_account_type === 'new') {
        if (!data.emergency_contact?.name?.trim()) {
          toast.error('Tên người liên hệ khẩn cấp là bắt buộc');
          setIsSubmitting(false);
          return;
        }
        
        if (!data.emergency_contact?.phone?.trim()) {
          toast.error('Số điện thoại khẩn cấp là bắt buộc');
          setIsSubmitting(false);
          return;
        }
        
        const phoneValidation = validatePhone(data.emergency_contact.phone);
        if (phoneValidation !== true) {
          toast.error(phoneValidation);
          setIsSubmitting(false);
          return;
        }
        
        if (!data.emergency_contact?.email?.trim()) {
          toast.error('Email là bắt buộc');
          setIsSubmitting(false);
          return;
        }
        
        const emailValidation = validateEmail(data.emergency_contact.email);
        if (emailValidation !== true) {
          toast.error(emailValidation);
          setIsSubmitting(false);
          return;
        }
        
        if (!data.emergency_contact?.relationship?.trim()) {
          toast.error('Mối quan hệ với người liên hệ là bắt buộc');
          setIsSubmitting(false);
          return;
        }
        
        if (data.emergency_contact.relationship === 'khác' && !data.emergency_contact.relationship_other?.trim()) {
          toast.error('Vui lòng nhập mối quan hệ cụ thể với người liên hệ');
          setIsSubmitting(false);
          return;
        }
        
        if (!data.emergency_contact?.address?.trim()) {
          toast.error('Địa chỉ người liên hệ là bắt buộc');
          setIsSubmitting(false);
          return;
        }
      }

      if (data.family_account_type === 'existing' && !data.existing_family_id) {
        toast.error('Vui lòng chọn tài khoản gia đình hiện có');
        setIsSubmitting(false);
        return;
      }
      if (data.family_account_type === 'existing') {
        if (!data.emergency_contact?.relationship?.trim()) {
          toast.error('Mối quan hệ với người liên hệ là bắt buộc');
          setIsSubmitting(false);
          return;
        }
        if (data.emergency_contact.relationship === 'khác' && !data.emergency_contact.relationship_other?.trim()) {
          toast.error('Vui lòng nhập mối quan hệ cụ thể với người liên hệ');
          setIsSubmitting(false);
          return;
        }
      }

      let familyMemberId = '';
      let emergencyContactInfo = {
        name: '',
        phone: '',
        email: '',
        relationship: ''
      };

      if (data.family_account_type === 'existing' && data.existing_family_id) {
        const selectedFamilyAccount = existingFamilyAccounts.find(acc => acc._id === data.existing_family_id);
        if (selectedFamilyAccount) {
          familyMemberId = selectedFamilyAccount._id;
           // Xử lý relationship: nếu chọn "khác" thì lấy giá trị tùy chỉnh
           let relationshipValue = data.emergency_contact.relationship || '';
           if (data.emergency_contact.relationship === 'khác' && data.emergency_contact.relationship_other?.trim()) {
             relationshipValue = data.emergency_contact.relationship_other.trim();
           }
          emergencyContactInfo = {
            name: selectedFamilyAccount.full_name || '',
            phone: selectedFamilyAccount.phone || '',
            email: selectedFamilyAccount.email || '',
             relationship: relationshipValue
          };
        }
      } else if (data.family_account_type === 'new') {
         // Xử lý relationship: nếu chọn "khác" thì lấy giá trị tùy chỉnh
         let relationshipValue = data.emergency_contact.relationship || '';
         if (data.emergency_contact.relationship === 'khác' && data.emergency_contact.relationship_other?.trim()) {
           relationshipValue = data.emergency_contact.relationship_other.trim();
         }
        emergencyContactInfo = {
          name: data.emergency_contact.name || '',
          phone: data.emergency_contact.phone || '',
          email: data.emergency_contact.email || '',
           relationship: relationshipValue
        };
      }
      
      const convertedDateOfBirth = convertDDMMYYYYToISO(data.date_of_birth);
      if (!convertedDateOfBirth) {
        toast.error('Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
        setIsSubmitting(false);
        return;
      }
      
      let username = '';
      let password = '';
      let email = '';
      let createdFamilyAccountId = null;

             // Xử lý medical_history
       let medicalHistoryText = data.medical_history || 'Không có';

      const payload: any = {
        full_name: data.full_name,
        date_of_birth: convertedDateOfBirth,
        gender: data.gender,
        avatar: avatarFile && avatarPreview ? avatarPreview : '/default-avatar.svg',
        relationship: emergencyContactInfo.relationship,
        admission_date: data.admission_date ? convertDDMMYYYYToISO(data.admission_date) : new Date().toISOString().slice(0, 10),
        medical_history: medicalHistoryText,
        current_medications: medications.filter(med => med.medication_name && med.dosage && med.frequency),
        allergies: allergies.filter(allergy => allergy.trim()),
        emergency_contact: emergencyContactInfo,
        status: data.status
      };

      if (data.family_account_type === 'existing' && data.existing_family_id) {
        payload.family_member_id = familyMemberId;
      } else if (data.family_account_type === 'new') {
        try {
          const tempUsername = data.full_name.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15) + Math.floor(Math.random() * 1000);
          
          const tempPassword = Math.random().toString(36).substring(2, 10) + 
                          Math.random().toString(36).substring(2, 10).toUpperCase() + 
                          Math.floor(Math.random() * 10);
          
          const tempEmail = data.emergency_contact.email || `${tempUsername}@example.com`;
          
          const accountData = new FormData();
          accountData.append("username", tempUsername);
          accountData.append("password", tempPassword);
          accountData.append("email", tempEmail);
          accountData.append("role", "family");
          accountData.append("full_name", data.emergency_contact.name);
          accountData.append("phone", data.emergency_contact.phone);
          accountData.append("status", "active");
          accountData.append("created_at", new Date().toISOString());
          accountData.append("updated_at", new Date().toISOString());
          
            accountData.append("address", data.emergency_contact.address || '');
          
          const userResponse = await userAPI.create(accountData);
          
          if (userResponse.status === 201) {
            const user = userResponse.data;
            payload.family_member_id = user._id;
            
            username = tempUsername;
            password = tempPassword;
            email = tempEmail;
            createdFamilyAccountId = user._id;
          } else {
            throw new Error('Failed to create family account');
          }
        } catch (accountError: any) {
          handleAPIError(accountError, 'Có lỗi xảy ra khi tạo tài khoản gia đình. Vui lòng thử lại.');
          setIsSubmitting(false);
          return;
        }
      }

      if (!payload.current_medications.length) {
        payload.current_medications = [];
      }
      if (!payload.allergies.length) {
        payload.allergies = [];
      }

      const residentResponse = await residentAPI.create(payload);
      
      if (residentResponse.status === 201) {
        // Add notification for admin about new resident
        addNotification({
          type: 'success',
          title: 'Người cao tuổi mới được thêm',
          message: `Người cao tuổi ${data.full_name} đã được thêm vào hệ thống bởi nhân viên.`,
          category: 'system',
          actionUrl: '/admin/residents'
        });
      }
      
      if (data.family_account_type === 'new') {
        router.push(`/staff/residents/success?residentName=${encodeURIComponent(data.full_name)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}&role=family`);
      } else if (data.family_account_type === 'existing' && data.existing_family_id) {
        const selectedFamilyAccount = existingFamilyAccounts.find(acc => acc._id === data.existing_family_id);
        router.push(`/staff/residents/success?residentName=${encodeURIComponent(data.full_name)}&existingAccount=true&familyName=${encodeURIComponent(selectedFamilyAccount?.full_name || '')}&familyUsername=${encodeURIComponent(selectedFamilyAccount?.username || '')}`);
      } else {
        router.push(`/staff/residents/success?residentName=${encodeURIComponent(data.full_name)}`);
      }
    } catch (error: any) {
      handleAPIError(error, 'Có lỗi xảy ra khi tạo người cao tuổi. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl max-w-md w-full">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            người cao tuổi mới đã được thêm vào hệ thống
          </p>
          <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(102,126,234,0.1)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        <div className="flex items-center mb-8 bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
          <Link href="/staff/residents" className="mr-4 text-indigo-500 flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 transition-all duration-200 hover:bg-indigo-100">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 flex items-center justify-center shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Thêm người cao tuổi mới
              </h1>
            </div>
            <p className="text-slate-600 m-0 text-sm font-medium">
              Điền thông tin chi tiết để đăng ký người cao tuổi mới vào hệ thống
            </p>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                <h2 className="text-lg font-semibold m-0">
                  Thông tin cá nhân
                </h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Ảnh đại diện
                </label>
                <div className="flex items-center justify-center gap-8 p-8 bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="w-30 h-30 rounded-xl overflow-hidden border-3 border-gray-200 bg-gray-50 flex items-center justify-center shadow-lg">
                    {(avatarFile && avatarPreview) ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <img 
                        src="/default-avatar.svg" 
                        alt="Default avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    )}
                    <div className="hidden items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold">
                      {watch('full_name') ? watch('full_name').charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Chọn ảnh từ máy tính
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-base outline-none transition-colors duration-200 bg-white cursor-pointer focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      Hỗ trợ: JPG, PNG, GIF (tối đa 1MB)
                    </p>
                    {avatarFile && (
                      <p className="mt-2 text-sm text-green-600 text-center font-medium">
                        ✓ Đã chọn: {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${
                      errors.full_name 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                    }`}
                    placeholder="Nhập họ và tên đầy đủ"
                    {...register('full_name', { 
                      required: 'Họ và tên là bắt buộc',
                      minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
                      maxLength: { value: 100, message: 'Tên không được quá 100 ký tự' },
                      pattern: {
                        value: /^[a-zA-ZÀ-ỹ\s]+$/,
                        message: 'Tên chỉ được chứa chữ cái và khoảng trắng'
                      }
                    })}
                  />
                  {errors.full_name && (
                    <p className="mt-2 text-sm text-red-500 font-medium">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${
                      errors.date_of_birth 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                    }`}
                    placeholder="dd/mm/yyyy"
                    {...register('date_of_birth', { 
                      required: 'Ngày sinh là bắt buộc',
                      validate: (value) => {
                        if (!value) return 'Ngày sinh là bắt buộc';
                        const displayVal = formatDateToDisplay(value);
                        const base = validateDate(displayVal, 'Ngày sinh');
                        if (base !== true) return base;
                        const isoVal = value.includes('/') ? formatDateToISO(value) : value;
                        return validateAge(isoVal);
                      },
                      onChange: (e) => {
                        const formattedDate = formatDateToISO(e.target.value);
                        setValue('date_of_birth', formattedDate, { shouldValidate: true });
                      },
                      onBlur: (e) => {
                        const dateValidation = validateDate(e.target.value, 'Ngày sinh');
                        if (dateValidation !== true) {
                          setValue('date_of_birth', '', { shouldValidate: true });
                          return;
                        }
                        const formattedDate = formatDateToISO(e.target.value);
                        if (formattedDate) {
                          setValue('date_of_birth', formattedDate, { shouldValidate: true });
                        }
                      }
                    })}
                    value={watch('date_of_birth') ? formatDateToDisplay(watch('date_of_birth')) : ''}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-2 text-sm text-red-500 font-medium">
                      {errors.date_of_birth.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${
                      errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                    }`}
                    {...register('gender', { required: 'Giới tính là bắt buộc' })}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày nhập viện</label>
                  <input
                    type="text"
                    className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${
                      errors.admission_date ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                    }`}
                    placeholder="dd/mm/yyyy (để trống để lấy ngày hiện tại)"
                    {...register('admission_date', { 
                      validate: (value) => {
                        if (!value) return true; 
                       
                        if (admissionDateDisplay) {
                          const dateValidation = validateDate(admissionDateDisplay, 'Ngày nhập viện');
                          return dateValidation;
                        }
                        return true;
                      },
                      onChange: (e) => {
                        setAdmissionDateDisplay(e.target.value);
                        const formattedDate = formatDateToISO(e.target.value);
                        setValue('admission_date', formattedDate);
                      },
                      onBlur: (e) => {
                        if (e.target.value) {
                          const dateValidation = validateDate(e.target.value, 'Ngày nhập viện');
                          if (dateValidation !== true) {
                            return;
                          }
                          const formattedDate = formatDateToISO(e.target.value);
                          if (formattedDate) {
                            setValue('admission_date', formattedDate, { shouldValidate: true });
                          }
                        }
                      }
                    })}
                    value={admissionDateDisplay || (watch('admission_date') ? formatDateToDisplay(watch('admission_date')) : '')}
                  />
                  {errors.admission_date && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{errors.admission_date.message}</p>
                  )}
                </div>


                <div className="col-span-1 md:col-span-2 border-2 border-gray-200 rounded-xl p-6 bg-gray-50 mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Tài khoản gia đình
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loại tài khoản gia đình <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 flex-wrap">
                      <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-colors duration-200 ${familyAccountType === 'new' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="radio"
                          value="new"
                          {...register('family_account_type', { required: 'Vui lòng chọn loại tài khoản' })}
                          className="m-0"
                        />
                        <span className="font-medium">Tạo tài khoản mới</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-colors duration-200 ${familyAccountType === 'existing' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="radio"
                          value="existing"
                          {...register('family_account_type', { required: 'Vui lòng chọn loại tài khoản' })}
                          className="m-0"
                        />
                        <span className="font-medium">Đã có tài khoản</span>
                      </label>
                    </div>
                    {errors.family_account_type && (
                      <p className="mt-2 text-sm text-red-500 font-medium">{errors.family_account_type.message}</p>
                    )}
                  </div>
                  {familyAccountType === 'existing' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Chọn tài khoản gia đình <span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full p-3 border-2 rounded-lg text-sm outline-none transition-colors duration-200 ${errors.existing_family_id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
                        {...register('existing_family_id', { 
                          required: familyAccountType === 'existing' ? 'Vui lòng chọn tài khoản gia đình' : false 
                        })}
                      >
                        <option value="">-- Chọn tài khoản gia đình --</option>
                        {existingFamilyAccounts.map(account => (
                          <option key={account._id} value={account._id}>
                            {account.full_name} ({account.username}) - {account.phone} - {account.email}
                          </option>
                        ))}
                      </select>
                      {errors.existing_family_id && (
                        <p className="mt-2 text-sm text-red-500 font-medium">{errors.existing_family_id.message}</p>
                      )}
                      {existingFamilyAccounts.length === 0 && (
                        <p className="mt-2 text-sm text-amber-600 font-medium">Không có tài khoản gia đình nào trong hệ thống. Vui lòng chọn "Tạo tài khoản mới".</p>
                      )}
                    </div>
                  )}


                  {familyAccountType === 'new' && (
                    <div className="p-4 bg-blue-50 border border-sky-500 rounded-lg mt-4">
                      <p className="text-sm text-sky-900 m-0 flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hệ thống sẽ tự động tạo tài khoản gia đình mới với thông tin từ bảng bên dưới.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <PhoneIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin liên hệ khẩn cấp
                </h2>
              </div>
            </div>
            <div style={{padding: '2rem'}}>
              {(familyAccountType === 'new' || familyAccountType === 'existing') && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>

                  {familyAccountType === 'new' && (
                  <div>
                    <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem'}}>
                      Họ tên người liên hệ <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="text"
                      style={{width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.name ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.name ? '#fef2f2' : 'white'}}
                      placeholder="Họ tên người thân"
                      {...register('emergency_contact.name', { required: 'Người liên hệ khẩn cấp là bắt buộc', minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }, maxLength: { value: 100, message: 'Tên không được quá 100 ký tự' }, pattern: { value: /^[a-zA-ZÀ-ỹ\s]+$/, message: 'Tên chỉ được chứa chữ cái và khoảng trắng' } })}
                    />
                    {errors.emergency_contact?.name && (
                      <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>{errors.emergency_contact.name.message}</p>
                    )}
                  </div>
                  )}

                  {familyAccountType === 'new' && (
                  <div>
                    <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem'}}>
                      Số điện thoại khẩn cấp <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="tel"
                      style={{width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.phone ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.phone ? '#fef2f2' : 'white'}}
                      placeholder="0987654321"
                      {...register('emergency_contact.phone', { required: 'Số điện thoại khẩn cấp là bắt buộc', validate: validatePhone, onChange: (e) => { let value = e.target.value.replace(/\D/g, ''); if (value.length > 0 && !value.startsWith('0') && !value.startsWith('84')) { value = '0' + value; } if (value.length > 11) { value = value.substring(0, 11); } e.target.value = value; } })}
                    />
                    {errors.emergency_contact?.phone && (
                      <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>{errors.emergency_contact.phone.message}</p>
                    )}
                  </div>
                  )}
                  
                  
                  {familyAccountType === 'new' && (
                  <div>
                    <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem'}}>
                      Email người liên hệ <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="email"
                      style={{width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.email ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.email ? '#fef2f2' : 'white'}}
                      placeholder="example@email.com"
                      {...register('emergency_contact.email', { 
                        required: 'Email là bắt buộc', 
                        validate: (value) => {
                          const base = validateEmail(value);
                          if (base !== true) return base;
                          return /@gmail\.com$/i.test(value) || 'Email phải theo dạng @gmail.com';
                        },
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Email không đúng định dạng'
                        }
                      })}
                    />
                    {errors.emergency_contact?.email && (
                      <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>{errors.emergency_contact.email.message}</p>
                    )}
                  </div>
                  )}
                  
                  {familyAccountType === 'new' && (
                  <div>
                    <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem'}}>
                      Địa chỉ người liên hệ <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <input
                      type="text"
                      style={{width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.address ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.address ? '#fef2f2' : 'white'}}
                      placeholder="Nhập địa chỉ của người liên hệ"
                      {...register('emergency_contact.address', { 
                        required: 'Địa chỉ người liên hệ là bắt buộc',
                        minLength: { value: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' },
                        maxLength: { value: 200, message: 'Địa chỉ không được quá 200 ký tự' }
                      })}
                    />
                    {errors.emergency_contact?.address && (
                      <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>{errors.emergency_contact.address.message}</p>
                    )}
                  </div>
                  )}

                   <div>
                     <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem'}}>
                       Mối quan hệ với người cao tuổi <span style={{color: '#ef4444'}}>*</span>
                     </label>
                     
                     {relationshipType === 'khác' ? (
                       <div>
                         <input
                           type="text"
                           placeholder="Nhập mối quan hệ cụ thể (VD: chú, bác, cô, dì, bạn thân...)"
                           style={{
                             width: '100%', 
                             padding: '0.75rem', 
                             border: `2px solid ${errors.emergency_contact?.relationship_other ? '#ef4444' : '#f59e0b'}`, 
                             borderRadius: '0.5rem', 
                             fontSize: '0.95rem', 
                             outline: 'none', 
                             transition: 'border-color 0.2s', 
                             background: errors.emergency_contact?.relationship_other ? '#fef2f2' : 'white'
                           }}
                           {...register('emergency_contact.relationship_other', { 
                             required: relationshipType === 'khác' ? 'Vui lòng nhập mối quan hệ cụ thể' : false, 
                             minLength: { value: 2, message: 'Mối quan hệ phải có ít nhất 2 ký tự' }, 
                             maxLength: { value: 50, message: 'Mối quan hệ không được quá 50 ký tự' },
                             pattern: {
                               value: /^[a-zA-ZÀ-ỹ\s]+$/,
                               message: 'Mối quan hệ chỉ được chứa chữ cái và khoảng trắng'
                             }
                           })}
                         />
                         <div style={{
                           marginTop: '0.5rem',
                           padding: '0.5rem',
                           backgroundColor: '#fef3c7',
                           border: '1px solid #f59e0b',
                           borderRadius: '0.375rem'
                         }}>
                           <p style={{
                             fontSize: '0.75rem', 
                             color: '#92400e', 
                             fontStyle: 'italic',
                             margin: 0
                           }}>
                             Ví dụ: chú, bác, cô, dì, bạn thân, người giám hộ...
                           </p>
                                                                                    
                         </div>
                         {errors.emergency_contact?.relationship_other && (
                           <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                             {errors.emergency_contact.relationship_other.message}
                           </p>
                         )}
                       </div>
                     ) : (
                       <select
                         style={{width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.relationship ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.relationship ? '#fef2f2' : 'white'}}
                         {...register('emergency_contact.relationship', { 
                           required: 'Mối quan hệ là bắt buộc'
                         })}
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
                     
                     {errors.emergency_contact?.relationship && (
                       <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>{errors.emergency_contact.relationship.message}</p>
                     )}
                   </div>
                </div>
              )}
              {familyAccountType === 'existing' && watch('existing_family_id') && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '0.75rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#166534', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thông tin tài khoản gia đình hiện có
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Tên:</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#166534' }}>
                        {existingFamilyAccounts.find(acc => acc._id === watch('existing_family_id'))?.full_name}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Số điện thoại:</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#166534' }}>
                        {existingFamilyAccounts.find(acc => acc._id === watch('existing_family_id'))?.phone}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Email:</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#166534' }}>
                        {existingFamilyAccounts.find(acc => acc._id === watch('existing_family_id'))?.email}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Tên đăng nhập:</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#166534', fontFamily: 'monospace' }}>
                        {existingFamilyAccounts.find(acc => acc._id === watch('existing_family_id'))?.username}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <DocumentTextIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin y tế
                </h2>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiền sử bệnh lý
                </label>
                <textarea
                  rows={4}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm outline-none transition-colors duration-200 resize-vertical focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Mô tả tiền sử bệnh lý, tình trạng sức khỏe hiện tại..."
                  {...register('medical_history')}
                />
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700">Thuốc đang sử dụng</label>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-emerald-600"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Thêm thuốc
                  </button>
                </div>
                {medications.map((medication, index) => (
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
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="p-2 bg-red-500 text-white rounded-lg transition-colors duration-200 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700">Dị ứng</label>
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="inline-flex items-center gap-2 py-2 px-4 bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-amber-600"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Thêm dị ứng
                  </button>
                </div>
                {allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Dị ứng thức ăn, thuốc, hoặc các chất khác..."
                      value={allergy}
                      onChange={(e) => updateAllergy(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    {allergies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="p-2 bg-red-500 text-white rounded-lg transition-colors duration-200 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Link 
                  href="/staff/residents" 
                  className="px-6 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-600 no-underline bg-white transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300 inline-block"
                >
                  Hủy bỏ
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 border-2 border-transparent rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-lg'
                  }`}
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isSubmitting ? 'Đang xử lý...' : 'Lưu thông tin người cao tuổi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
