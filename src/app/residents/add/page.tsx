"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { residentAPI } from '@/lib/api';

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
  medical_history: string;
  current_medications: Medication[];
  allergies: string[];
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  care_level: string;
  status: string;
  notes: string;
};

const validateAge = (dateOfBirth: string) => {
  if (!dateOfBirth) return "Ngày sinh là bắt buộc";
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Kiểm tra nếu ngày sinh không hợp lệ
  if (isNaN(birthDate.getTime())) {
    return "Ngày sinh không hợp lệ";
  }
  
  // Kiểm tra nếu ngày sinh trong tương lai
  if (birthDate > today) {
    return "Ngày sinh không thể trong tương lai";
  }
  
  // Tính tuổi chính xác
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Nếu chưa đến sinh nhật trong năm nay, trừ đi 1 tuổi
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  console.log('Date of birth:', dateOfBirth, 'Age calculated:', age);
  
  return age >= 50 || "người cao tuổi phải từ 50 tuổi trở lên";
};

const validatePhone = (phone: string) => {
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone) || "Số điện thoại không đúng định dạng";
};

// Thêm các hàm chuyển đổi định dạng ngày
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


export default function AddResidentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://example.com/avatar.jpg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([
    { medication_name: '', dosage: '', frequency: '' }
  ]);
  const [allergies, setAllergies] = useState<string[]>(['']);
  
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
      family_member_id: '664f1b2c2f8b2c0012a4e750', // Default value, should be dynamic
      relationship: 'con gái',
      current_medications: [],
      allergies: []
    },
    mode: 'onBlur'
  });

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
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF)');
        return;
      }
      
      // Kiểm tra kích thước file (max 1MB thay vì 5MB)
      if (file.size > 1 * 1024 * 1024) {
        alert('File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 1MB');
        return;
      }

      setAvatarFile(file);
      
      // Tạo preview với kích thước nhỏ hơn
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Tạo canvas để resize ảnh
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize ảnh xuống 300x300px để giảm kích thước
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
            const resizedImage = canvas.toDataURL('image/jpeg', 0.7); // Chất lượng 70%
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
      // Validate required fields
      if (!data.full_name?.trim()) {
        alert('Họ và tên là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      if (!data.date_of_birth) {
        alert('Ngày sinh là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      
      // Validate age
      const ageValidation = validateAge(data.date_of_birth);
      if (ageValidation !== true) {
        alert(ageValidation);
        setIsSubmitting(false);
        return;
      }
      if (!data.gender) {
        alert('Giới tính là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      if (!data.relationship?.trim()) {
        alert('Mối quan hệ là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      if (!data.emergency_contact?.name?.trim()) {
        alert('Tên người liên hệ khẩn cấp là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      if (!data.emergency_contact?.phone?.trim()) {
        alert('Số điện thoại khẩn cấp là bắt buộc');
        setIsSubmitting(false);
        return;
      }
      
      // Validate phone number
      const phoneValidation = validatePhone(data.emergency_contact.phone);
      if (phoneValidation !== true) {
        alert(phoneValidation);
        setIsSubmitting(false);
        return;
      }
      if (!data.emergency_contact?.relationship?.trim()) {
        alert('Mối quan hệ với người liên hệ là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      // Prepare the payload according to API specification
      const payload: any = {
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        avatar: avatarFile && avatarPreview ? avatarPreview : '/default-avatar.svg',
        family_member_id: data.family_member_id || '664f1b2c2f8b2c0012a4e750',
        relationship: data.relationship,
        medical_history: data.medical_history,
        current_medications: medications.filter(med => med.medication_name && med.dosage && med.frequency),
        allergies: allergies.filter(allergy => allergy.trim()),
        emergency_contact: {
          name: data.emergency_contact.name,
          phone: data.emergency_contact.phone,
          relationship: data.emergency_contact.relationship
        },
        status: data.status
      };

      // Xóa các trường nếu là mảng rỗng hoặc chuỗi rỗng
      if (!payload.medical_history) delete payload.medical_history;
      if (!payload.current_medications.length) delete payload.current_medications;
      if (!payload.allergies.length) delete payload.allergies;

      console.log('Sending payload to API:', payload);
      await residentAPI.create(payload);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/residents');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Log chi tiết lỗi
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.data && error.response.data.detail) {
          alert(`Lỗi: ${error.response.data.detail}`);
        } else if (error.response.data && error.response.data.message) {
          alert(`Lỗi: ${error.response.data.message}`);
        } else {
          alert(`Lỗi ${error.response.status}: Có lỗi xảy ra khi tạo người cao tuổi. Vui lòng kiểm tra lại thông tin.`);
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        console.error('Error message:', error.message);
        alert(`Lỗi: ${error.message}`);
      }
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
      {/* Background pattern */}
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
        {/* Header */}
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
          <Link href="/residents" style={{
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
            <ArrowLeftIcon style={{height: '1.25rem', width: '1.25rem'}} />
          </Link>
          <div>
            <h1 style={{
              fontSize: '1.875rem', 
              fontWeight: 700, 
              color: '#111827',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              Thêm người cao tuổi mới
            </h1>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '0.95rem'
            }}>
              Điền thông tin chi tiết để đăng ký người cao tuổi mới vào hệ thống
            </p>
          </div>
        </div>
        
        {/* Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Personal Information Section */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <UserIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin cá nhân
                </h2>
              </div>
            </div>
            
            <div style={{padding: '2rem'}}>
              {/* Avatar Section - Full Width */}
              <div style={{marginBottom: '2rem'}}>
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
                    ) : null}
                    <div style={{
                      display: (avatarFile && avatarPreview) ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      background: '#e5e7eb'
                    }}>
                      <UserIcon style={{width: '3rem', height: '3rem', color: '#9ca3af'}} />
                    </div>
                  </div>
                  <div style={{flex: 1, maxWidth: '400px'}}>
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

              {/* Personal Information Grid */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Họ và tên <span style={{color: '#ef4444'}}>*</span>
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
                      minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                    })}
                  />
                  {errors.full_name && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
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
                    Ngày sinh <span style={{color: '#ef4444'}}>*</span>
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
                    value={watch('date_of_birth') ? formatDateToDisplay(watch('date_of_birth')) : ''}
                    onChange={e => {
                      const formattedDate = formatDateToISO(e.target.value);
                      setValue('date_of_birth', formattedDate);
                    }}
                    onBlur={e => {
                      // Trigger validation khi blur
                      const formattedDate = formatDateToISO(e.target.value);
                      if (formattedDate) {
                        setValue('date_of_birth', formattedDate, { shouldValidate: true });
                      }
                    }}
                  />
                  {errors.date_of_birth && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
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
                    Giới tính <span style={{color: '#ef4444'}}>*</span>
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
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
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
                    Mối quan hệ với người cao tuổi (người giám hộ) <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
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
                    placeholder="VD: con gái, con trai, vợ, chồng..."
                    {...register('relationship', { 
                      required: 'Mối quan hệ với gia đình là bắt buộc'
                    })}
                  />
                  {errors.relationship && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.relationship.message}
                    </p>
                  )}
                </div>


              </div>
            </div>



            {/* Contact Information Section */}
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
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Họ tên người liên hệ <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.emergency_contact?.name ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.emergency_contact?.name ? '#fef2f2' : 'white'
                    }}
                    placeholder="Họ tên người thân"
                    {...register('emergency_contact.name', { 
                      required: 'Người liên hệ khẩn cấp là bắt buộc',
                      minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                    })}
                  />
                  {errors.emergency_contact?.name && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.emergency_contact.name.message}
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
                    Số điện thoại khẩn cấp <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="tel"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.emergency_contact?.phone ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.emergency_contact?.phone ? '#fef2f2' : 'white'
                    }}
                    placeholder="0987654321"
                    {...register('emergency_contact.phone', { 
                      required: 'Số điện thoại khẩn cấp là bắt buộc',
                      validate: validatePhone
                    })}
                  />
                  {errors.emergency_contact?.phone && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.emergency_contact.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Mối quan hệ với người cao tuổi (người liên hệ khẩn cấp) <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.emergency_contact?.relationship ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.emergency_contact?.relationship ? '#fef2f2' : 'white'
                    }}
                    placeholder="VD: con gái, con trai, vợ, chồng..."
                    {...register('emergency_contact.relationship', { 
                      required: 'Mối quan hệ là bắt buộc'
                    })}
                  />
                  {errors.emergency_contact?.relationship && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.emergency_contact.relationship.message}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Medical Information Section */}
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

            <div style={{padding: '2rem'}}>
              <div style={{marginBottom: '2rem'}}>
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

              {/* Medications Section */}
              <div style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
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
                    <PlusIcon style={{width: '1rem', height: '1rem'}} />
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
                        <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Allergies Section */}
              <div style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
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
                    <PlusIcon style={{width: '1rem', height: '1rem'}} />
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
                        <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                    )}
                  </div>
                ))}
              </div>



              {/* Action Buttons */}
              <div style={{
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Link 
                  href="/residents" 
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
