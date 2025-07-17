"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  HeartIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { residentAPI } from '@/lib/api';

type ResidentFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  room: string;
  careLevel: string;
  emergencyContact: string;
  contactPhone: string;
  emergencyPhone: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  notes: string;
};

const validateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  return age >= 50 || "người cao tuổi phải từ 50 tuổi trở lên";
};

const validatePhone = (phone: string) => {
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone) || "Số điện thoại không đúng định dạng";
};

const validateIdNumber = (idNumber: string) => {
  const idRegex = /^\d{9}$|^\d{12}$/;
  return idRegex.test(idNumber) || "CMND/CCCD phải có 9 hoặc 12 số";
};

export default function AddResidentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    watch
  } = useForm<ResidentFormData>();
  
  const onSubmit = async (data: ResidentFormData) => {
    setIsSubmitting(true);
    try {
      // Map form data sang request body API
      const payload = {
        fullName: data.lastName + ' ' + data.firstName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        admissionDate: new Date().toISOString().slice(0,10),
        dischargeDate: null,
        familyMemberId: '', // Có thể lấy từ user context nếu có
        medicalHistory: data.medicalConditions,
        currentMedications: data.medications ? data.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContact: {
          fullName: data.emergencyContact,
          relationship: '', // Có thể bổ sung trường này nếu form có
          phoneNumber: data.emergencyPhone
        },
        careLevel: data.careLevel,
        status: 'active',
        room: data.room,
        notes: data.notes,
        idNumber: data.idNumber,
        contactPhone: data.contactPhone
      };
      await residentAPI.create(payload);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/residents');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
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
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Họ và tên đệm <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.lastName ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.lastName ? '#fef2f2' : 'white'
                    }}
                    placeholder="Nhập họ và tên đệm"
                    {...register('lastName', { 
                      required: 'Họ và tên đệm là bắt buộc',
                      minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                    })}
                  />
                  {errors.lastName && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.lastName.message}
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
                    Tên <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.firstName ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.firstName ? '#fef2f2' : 'white'
                    }}
                    placeholder="Nhập tên"
                    {...register('firstName', { 
                      required: 'Tên là bắt buộc',
                      minLength: { value: 1, message: 'Tên không được để trống' }
                    })}
                  />
                  {errors.firstName && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.firstName.message}
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
                    CMND/CCCD <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.idNumber ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.idNumber ? '#fef2f2' : 'white'
                    }}
                    placeholder="Nhập số CMND/CCCD"
                    {...register('idNumber', { 
                      required: 'CMND/CCCD là bắt buộc',
                      validate: validateIdNumber
                    })}
                  />
                  {errors.idNumber && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.idNumber.message}
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
                    type="date"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.dateOfBirth ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.dateOfBirth ? '#fef2f2' : 'white'
                    }}
                    {...register('dateOfBirth', { 
                      required: 'Ngày sinh là bắt buộc',
                      validate: validateAge
                    })}
                  />
                  {errors.dateOfBirth && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.dateOfBirth.message}
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


              </div>
            </div>

            {/* Service Information Section */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <HeartIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin dịch vụ
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
                    Số phòng <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.room ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.room ? '#fef2f2' : 'white'
                    }}
                    placeholder="VD: A101, B205..."
                    {...register('room', { 
                      required: 'Số phòng là bắt buộc',
                      pattern: {
                        value: /^[A-Z]\d{3}$/,
                        message: 'Số phòng phải có định dạng A101, B205...'
                      }
                    })}
                  />
                  {errors.room && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.room.message}
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
                    Gói dịch vụ <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.careLevel ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.careLevel ? '#fef2f2' : 'white'
                    }}
                    {...register('careLevel', { required: 'Gói dịch vụ là bắt buộc' })}
                  >
                    <option value="">Chọn gói dịch vụ</option>
                    <option value="basic">Gói Cơ Bản - 15,000,000 VNĐ/tháng</option>
                    <option value="advanced">Gói Nâng Cao - 25,000,000 VNĐ/tháng</option>
                    <option value="premium">Gói Cao Cấp - 35,000,000 VNĐ/tháng</option>
                  </select>
                  {errors.careLevel && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.careLevel.message}
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
                      border: `2px solid ${errors.emergencyContact ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.emergencyContact ? '#fef2f2' : 'white'
                    }}
                    placeholder="Họ tên người thân"
                    {...register('emergencyContact', { 
                      required: 'Người liên hệ khẩn cấp là bắt buộc',
                      minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                    })}
                  />
                  {errors.emergencyContact && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.emergencyContact.message}
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
                    Số điện thoại cá nhân
                  </label>
                  <input
                    type="tel"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.contactPhone ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.contactPhone ? '#fef2f2' : 'white'
                    }}
                    placeholder="0987654321"
                    {...register('contactPhone', { 
                      validate: (value) => !value || validatePhone(value)
                    })}
                  />
                  {errors.contactPhone && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.contactPhone.message}
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
                      border: `2px solid ${errors.emergencyPhone ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: errors.emergencyPhone ? '#fef2f2' : 'white'
                    }}
                    placeholder="0987654321"
                    {...register('emergencyPhone', { 
                      required: 'Số điện thoại khẩn cấp là bắt buộc',
                      validate: validatePhone
                    })}
                  />
                  {errors.emergencyPhone && (
                    <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 500}}>
                      {errors.emergencyPhone.message}
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
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Tình trạng sức khỏe
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
                    placeholder="Mô tả tình trạng sức khỏe hiện tại, bệnh lý có..."
                    {...register('medicalConditions')}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Thuốc đang sử dụng
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
                    placeholder="Liệt kê các loại thuốc, liều lượng, tần suất..."
                    {...register('medications')}
                  />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem'}}>
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Dị ứng
                  </label>
                  <textarea
                    rows={3}
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
                    placeholder="Dị ứng thức ăn, thuốc, hoặc các chất khác..."
                    {...register('allergies')}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    marginBottom: '0.5rem'
                  }}>
                    Ghi chú bổ sung
                  </label>
                  <textarea
                    rows={3}
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
                    placeholder="Thông tin bổ sung khác..."
                    {...register('notes')}
                  />
                </div>
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
