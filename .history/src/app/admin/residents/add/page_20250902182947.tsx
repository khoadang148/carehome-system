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
  if (age >130) return "Tuổi không hợp lệ (phải nhỏ hơn 130)";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([
    { medication_name: '', dosage: '', frequency: '' }
  ]);
  const [allergies, setAllergies] = useState<string[]>(['']);
  const [existingFamilyAccounts, setExistingFamilyAccounts] = useState<any[]>([]);

  const [admissionDateDisplay, setAdmissionDateDisplay] = useState('');

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
      relationship: '',
      relationship_other: '',
      admission_date: '',
      current_medications: [],
      allergies: [],
      family_account_type: 'new'
    },
    mode: 'onBlur'
  });

  const familyAccountType = watch('family_account_type');

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

      if (!data.relationship?.trim()) {
        toast.error('Mối quan hệ là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      if (data.relationship === 'khác' && !data.relationship_other?.trim()) {
        toast.error('Vui lòng nhập mối quan hệ cụ thể');
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
      }

      if (data.family_account_type === 'existing' && !data.existing_family_id) {
        toast.error('Vui lòng chọn tài khoản gia đình hiện có');
        setIsSubmitting(false);
        return;
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
          emergencyContactInfo = {
            name: selectedFamilyAccount.full_name || '',
            phone: selectedFamilyAccount.phone || '',
            email: selectedFamilyAccount.email || '',
            relationship: data.relationship === 'khác' ? (data.relationship_other || '') : (data.relationship || '')
          };
        }
      } else if (data.family_account_type === 'new') {
        emergencyContactInfo = {
          name: data.emergency_contact.name || '',
          phone: data.emergency_contact.phone || '',
          email: data.emergency_contact.email || '',
          relationship: data.emergency_contact.relationship === 'khác' ? (data.emergency_contact.relationship_other || '') : (data.emergency_contact.relationship || '')
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

      const payload: any = {
        full_name: data.full_name,
        date_of_birth: convertedDateOfBirth,
        gender: data.gender,
        avatar: avatarFile && avatarPreview ? avatarPreview : '/default-avatar.svg',
        relationship: data.relationship === 'khác' ? (data.relationship_other || '') : (data.relationship || ''),
        admission_date: data.admission_date ? convertDDMMYYYYToISO(data.admission_date) : new Date().toISOString().slice(0, 10),
        medical_history: data.medical_history || 'Không có',
        current_medications: medications.filter(med => med.medication_name && med.dosage && med.frequency),
        allergies: allergies.filter(allergy => allergy.trim()),
        emergency_contact: emergencyContactInfo,
        status: data.status
      };

      if (data.family_account_type === 'existing' && data.existing_family_id) {
        payload.family_member_id = familyMemberId;
      }
      else if (data.family_account_type === 'new') {
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

          if (data.emergency_contact.address) {
            accountData.append("address", data.emergency_contact.address);
          }

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
      }

      if (data.family_account_type === 'new') {
        router.push(`/admin/residents/success?residentName=${encodeURIComponent(data.full_name)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}&role=family`);
      } else if (data.family_account_type === 'existing' && data.existing_family_id) {
        const selectedFamilyAccount = existingFamilyAccounts.find(acc => acc._id === data.existing_family_id);
        router.push(`/admin/residents/success?residentName=${encodeURIComponent(data.full_name)}&existingAccount=true&familyName=${encodeURIComponent(selectedFamilyAccount?.full_name || '')}&familyUsername=${encodeURIComponent(selectedFamilyAccount?.username || '')}`);
      } else {
        router.push(`/admin/residents/success?residentName=${encodeURIComponent(data.full_name)}`);
      }
    } catch (error: any) {
      handleAPIError(error, 'Có lỗi xảy ra khi tạo người cao tuổi. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <CheckCircleIcon style={{
            width: '4rem',
            height: '4rem',
            color: '#10b981',
            margin: '0 auto 1rem auto'
          }} />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Thành công!
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            người cao tuổi mới đã được thêm vào hệ thống
          </p>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <Link href="/admin/residents" style={{
            marginRight: '1rem',
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(102, 126, 234, 0.1)',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}>
            <ArrowLeftIcon style={{ height: '1.25rem', width: '1.25rem' }} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
              </div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
              }}>
                Thêm người cao tuổi mới
              </h1>
            </div>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Điền thông tin chi tiết để đăng ký người cao tuổi mới vào hệ thống
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Thông tin cá nhân
                </h2>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Ảnh đại diện
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2rem',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '1rem',
                  border: '2px dashed #cbd5e1'
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: '3px solid #e5e7eb',
                    background: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    {(avatarFile && avatarPreview) ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
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
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    )}
                    <div style={{
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}>
                      {watch('full_name') ? watch('full_name').charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div style={{ flex: 1, maxWidth: '400px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Chọn ảnh từ máy tính
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    />
                    <p style={{
                      marginTop: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      textAlign: 'center'
                    }}>
                      Hỗ trợ: JPG, PNG, GIF (tối đa 1MB)
                    </p>
                    {avatarFile && (
                      <p style={{
                        marginTop: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#059669',
                        textAlign: 'center',
                        fontWeight: 500
                      }}>
                        ✓ Đã chọn: {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.full_name ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.full_name ? '#fef2f2' : 'white'
                    }}
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
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ngày sinh <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.date_of_birth ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.date_of_birth ? '#fef2f2' : 'white'
                    }}
                    placeholder="dd/mm/yyyy"
                    {...register('date_of_birth', {
                      required: 'Ngày sinh là bắt buộc',
                      validate: (value) => {
                        if (!value) return 'Ngày sinh là bắt buộc';
                        const formattedValue = formatDateToDisplay(value);
                        return validateDate(formattedValue, 'Ngày sinh');
                      },
                      onChange: (e) => {
                        const formattedDate = formatDateToISO(e.target.value);
                        setValue('date_of_birth', formattedDate);
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
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                      {errors.date_of_birth.message}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Giới tính <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.gender ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.gender ? '#fef2f2' : 'white'
                    }}
                    {...register('gender', { required: 'Giới tính là bắt buộc' })}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                  {errors.gender && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ngày nhập viện
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.admission_date ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.admission_date ? '#fef2f2' : 'white'
                    }}
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
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                      {errors.admission_date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mối quan hệ với người cao tuổi (người giám hộ) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.relationship ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.relationship ? '#fef2f2' : 'white'
                    }}
                    {...register('relationship', {
                      required: 'Mối quan hệ với gia đình là bắt buộc'
                    })}
                    onChange={(e) => {
                      if (e.target.value === 'khác') {
                        setValue('relationship_other', '');
                      }
                    }}
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
                  {watch('relationship') === 'khác' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Nhập mối quan hệ cụ thể..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${errors.relationship_other ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '0.5rem',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          background: errors.relationship_other ? '#fef2f2' : 'white'
                        }}
                        {...register('relationship_other', {
                          required: watch('relationship') === 'khác' ? 'Vui lòng nhập mối quan hệ cụ thể' : false,
                          minLength: { value: 2, message: 'Mối quan hệ phải có ít nhất 2 ký tự' },
                          maxLength: { value: 50, message: 'Mối quan hệ không được quá 50 ký tự' }
                        })}
                      />
                      {errors.relationship_other && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                          {errors.relationship_other.message}
                        </p>
                      )}
                    </div>
                  )}
                  {errors.relationship && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                      {errors.relationship.message}
                    </p>
                  )}
                </div>

                <div style={{
                  gridColumn: '1 / -1',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  backgroundColor: '#f9fafb',
                  marginTop: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Tài khoản gia đình
                  </h3>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Loại tài khoản gia đình <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        backgroundColor: familyAccountType === 'new' ? '#dbeafe' : 'white',
                        transition: 'all 0.2s'
                      }}>
                        <input
                          type="radio"
                          value="new"
                          {...register('family_account_type', { required: 'Vui lòng chọn loại tài khoản' })}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontWeight: 500 }}>Tạo tài khoản mới</span>
                      </label>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        backgroundColor: familyAccountType === 'existing' ? '#dbeafe' : 'white',
                        transition: 'all 0.2s'
                      }}>
                        <input
                          type="radio"
                          value="existing"
                          {...register('family_account_type', { required: 'Vui lòng chọn loại tài khoản' })}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontWeight: 500 }}>Đã có tài khoản</span>
                      </label>
                    </div>
                    {errors.family_account_type && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                        {errors.family_account_type.message}
                      </p>
                    )}
                  </div>

                  {familyAccountType === 'existing' && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Chọn tài khoản gia đình <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${errors.existing_family_id ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '0.5rem',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          background: errors.existing_family_id ? '#fef2f2' : 'white'
                        }}
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
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>
                          {errors.existing_family_id.message}
                        </p>
                      )}
                      {existingFamilyAccounts.length === 0 && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#f59e0b', fontWeight: 500 }}>
                          Không có tài khoản gia đình nào trong hệ thống. Vui lòng chọn "Tạo tài khoản mới".
                        </p>
                      )}
                    </div>
                  )}

                  {familyAccountType === 'new' && (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: '0.5rem',
                      marginTop: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#0c4a6e',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hệ thống sẽ tự động tạo tài khoản gia đình mới với thông tin từ form bên dưới.
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PhoneIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Thông tin liên hệ khẩn cấp
                </h2>
              </div>
            </div>
            <div style={{ padding: '2rem' }}>
              {familyAccountType === 'new' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Họ tên người liên hệ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.name ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.name ? '#fef2f2' : 'white' }}
                      placeholder="Họ tên người thân"
                      {...register('emergency_contact.name', { required: 'Người liên hệ khẩn cấp là bắt buộc', minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }, maxLength: { value: 100, message: 'Tên không được quá 100 ký tự' }, pattern: { value: /^[a-zA-ZÀ-ỹ\s]+$/, message: 'Tên chỉ được chứa chữ cái và khoảng trắng' } })}
                    />
                    {errors.emergency_contact?.name && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>{errors.emergency_contact.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Số điện thoại khẩn cấp <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      style={{ width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.phone ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.phone ? '#fef2f2' : 'white' }}
                      placeholder="0987654321"
                      {...register('emergency_contact.phone', { required: 'Số điện thoại khẩn cấp là bắt buộc', validate: validatePhone, onChange: (e) => { let value = e.target.value.replace(/\D/g, ''); if (value.length > 0 && !value.startsWith('0') && !value.startsWith('84')) { value = '0' + value; } if (value.length > 11) { value = value.substring(0, 11); } e.target.value = value; } })}
                    />
                    {errors.emergency_contact?.phone && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>{errors.emergency_contact.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Email người liên hệ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      style={{ width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.email ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.email ? '#fef2f2' : 'white' }}
                      placeholder="example@email.com"
                      {...register('emergency_contact.email', {
                        required: 'Email là bắt buộc',
                        validate: validateEmail,
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Email không đúng định dạng'
                        }
                      })}
                    />
                    {errors.emergency_contact?.email && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>{errors.emergency_contact.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Địa chỉ người liên hệ
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: 'white' }}
                      placeholder="Nhập địa chỉ của người liên hệ"
                      {...register('emergency_contact.address')}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Mối quan hệ với người cao tuổi (người liên hệ khẩn cấp) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      style={{ width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.relationship ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.relationship ? '#fef2f2' : 'white' }}
                      {...register('emergency_contact.relationship', { required: 'Mối quan hệ là bắt buộc' })}
                      onChange={(e) => { if (e.target.value === 'khác') { setValue('emergency_contact.relationship_other', ''); } }}
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
                    {watch('emergency_contact.relationship') === 'khác' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Nhập mối quan hệ cụ thể..."
                          style={{ width: '100%', padding: '0.75rem', border: `2px solid ${errors.emergency_contact?.relationship_other ? '#ef4444' : '#e5e7eb'}`, borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: errors.emergency_contact?.relationship_other ? '#fef2f2' : 'white' }}
                          {...register('emergency_contact.relationship_other', { required: watch('emergency_contact.relationship') === 'khác' ? 'Vui lòng nhập mối quan hệ cụ thể' : false, minLength: { value: 2, message: 'Mối quan hệ phải có ít nhất 2 ký tự' }, maxLength: { value: 50, message: 'Mối quan hệ không được quá 50 ký tự' } })}
                        />
                        {errors.emergency_contact?.relationship_other && (
                          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>{errors.emergency_contact.relationship_other.message}</p>
                        )}
                      </div>
                    )}
                    {errors.emergency_contact?.relationship && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>{errors.emergency_contact.relationship.message}</p>
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
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#166534', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Thông tin y tế
                </h2>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tiền sử bệnh lý
                </label>
                <textarea
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                  placeholder="Mô tả tiền sử bệnh lý, tình trạng sức khỏe hiện tại..."
                  {...register('medical_history')}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Thuốc đang sử dụng
                  </label>
                  <button
                    type="button"
                    onClick={addMedication}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Thêm thuốc
                  </button>
                </div>

                {medications.map((medication, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr auto',
                    gap: '1rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <input
                      type="text"
                      placeholder="Tên thuốc"
                      value={medication.medication_name}
                      onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Liều lượng"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Tần suất"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151'
                  }}>
                    Dị ứng
                  </label>
                  <button
                    type="button"
                    onClick={addAllergy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Thêm dị ứng
                  </button>
                </div>

                {allergies.map((allergy, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      placeholder="Dị ứng thức ăn, thuốc, hoặc các chất khác..."
                      value={allergy}
                      onChange={(e) => updateAllergy(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    {allergies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>



              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Link
                  href="/admin/residents"
                  style={{
                    padding: '0.75rem 2rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    textDecoration: 'none',
                    background: 'white',
                    transition: 'all 0.2s',
                    display: 'inline-block'
                  }}
                >
                  Hủy bỏ
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 2rem',
                    border: '2px solid transparent',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'white',
                    background: isSubmitting
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting && (
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {isSubmitting ? 'Đang xử lý...' : 'Lưu thông tin người cao tuổi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        input:focus, select:focus, textarea:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        a:hover {
          background: rgba(102, 126, 234, 0.2) !important;
        }
        
        button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
} 
