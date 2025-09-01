"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { carePlansAPI } from '@/lib/api';

export default function CreateServicePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    monthly_price: '',
    plan_type: 'cham_soc_dac_biet',
     category: 'supplementary',
    services_included: [''],
    staff_ratio: '1:3',
    duration_type: 'monthly',
    default_medications: [],
    prerequisites: [],
    contraindications: [],
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/services');
      return;
    }
  }, [user, router]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'plan_name':
        if (!value || !value.trim()) {
          return 'Tên gói dịch vụ không được để trống';
        }
        if (value.trim().length < 3) {
          return 'Tên gói dịch vụ phải có ít nhất 3 ký tự';
        }
        if (value.trim().length > 100) {
          return 'Tên gói dịch vụ không được quá 100 ký tự';
        }
        break;
      case 'description':
        if (!value || !value.trim()) {
          return 'Mô tả không được để trống';
        }
        if (value.trim().length < 10) {
          return 'Mô tả phải có ít nhất 10 ký tự';
        }
        if (value.trim().length > 500) {
          return 'Mô tả không được quá 500 ký tự';
        }
        break;
             case 'monthly_price':
         if (!value || !value.trim()) {
           return 'Giá hàng tháng không được để trống';
         }
         const price = parseFloat(value);
         if (isNaN(price) || price <= 0) {
           return 'Giá hàng tháng phải là số dương';
         }
         break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    if (error) {
      setError(null);
    }
  };

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...formData.services_included];
    newServices[index] = value;
    setFormData(prev => ({
      ...prev,
      services_included: newServices
    }));

    // Clear service-specific error when user starts typing
    const serviceFieldName = `service_${index}`;
    if (fieldErrors[serviceFieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [serviceFieldName]: ''
      }));
    }

    if (error) {
      setError(null);
    }
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services_included: [...prev.services_included, '']
    }));
  };

  const removeService = (index: number) => {
    if (formData.services_included.length > 1) {
      const newServices = formData.services_included.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        services_included: newServices
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setFieldErrors({});

    // Validate all fields
    const newFieldErrors: {[key: string]: string} = {};
    let hasValidationError = false;

    // Validate plan_name
    const planNameError = validateField('plan_name', formData.plan_name);
    if (planNameError) {
      newFieldErrors.plan_name = planNameError;
      hasValidationError = true;
    }

    // Validate description
    const descriptionError = validateField('description', formData.description);
    if (descriptionError) {
      newFieldErrors.description = descriptionError;
      hasValidationError = true;
    }

    // Validate monthly_price
    const monthlyPriceError = validateField('monthly_price', formData.monthly_price);
    if (monthlyPriceError) {
      newFieldErrors.monthly_price = monthlyPriceError;
      hasValidationError = true;
    }

    // Validate services
    const validServices = formData.services_included.filter(service => service.trim() !== '');
    if (validServices.length === 0) {
      newFieldErrors.services = 'Phải có ít nhất một dịch vụ được bao gồm';
      hasValidationError = true;
    } else {
    for (let i = 0; i < validServices.length; i++) {
      const service = validServices[i];
      if (service.trim().length < 2) {
          newFieldErrors[`service_${i}`] = `Dịch vụ ${i + 1} phải có ít nhất 2 ký tự`;
          hasValidationError = true;
      }
      if (service.trim().length > 100) {
          newFieldErrors[`service_${i}`] = `Dịch vụ ${i + 1} không được quá 100 ký tự`;
          hasValidationError = true;
      }
    }

    const uniqueServices = [...new Set(validServices.map(s => s.trim().toLowerCase()))];
    if (uniqueServices.length !== validServices.length) {
        newFieldErrors.services = 'Không được có dịch vụ trùng lặp';
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const packageData = {
        plan_name: formData.plan_name.trim(),
        description: formData.description.trim(),
         monthly_price: parseFloat(formData.monthly_price.trim()),
        plan_type: formData.plan_type,
        category: formData.category,
        services_included: validServices,
        staff_ratio: formData.staff_ratio.trim() || null,
        duration_type: formData.duration_type,
        default_medications: formData.default_medications.length > 0 ? formData.default_medications : [],
        prerequisites: formData.prerequisites.length > 0 ? formData.prerequisites : [],
        contraindications: formData.contraindications.length > 0 ? formData.contraindications : [],
        is_active: formData.is_active
      };

      await carePlansAPI.create(packageData);
      setSuccess(true);

      setTimeout(() => {
        router.push('/services');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '500px',
          width: '90%'
        }}>
          <CheckCircleIcon style={{
            width: '4rem',
            height: '4rem',
            color: '#10b981',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Tạo gói dịch vụ thành công!
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            Gói dịch vụ đã được tạo và sẽ hiển thị trong danh sách.
          </p>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
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
          <button
            onClick={() => router.push('/services')}
            style={{
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
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
            }}
          >
            <ArrowLeftIcon style={{ height: '1.25rem', width: '1.25rem' }} />
          </button>
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
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
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
                Tạo gói dịch vụ mới
              </h1>
            </div>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Điền thông tin chi tiết để tạo gói dịch vụ chăm sóc mới
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
          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Thông tin cơ bản
                </h2>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tên gói dịch vụ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.plan_name}
                    onChange={(e) => handleInputChange('plan_name', e.target.value)}
                     onBlur={(e) => {
                       const error = validateField('plan_name', e.target.value);
                       setFieldErrors(prev => ({
                         ...prev,
                         plan_name: error
                       }));
                     }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                       border: fieldErrors.plan_name ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                    placeholder="Nhập tên gói dịch vụ"
                  />
                   {fieldErrors.plan_name && (
                     <div style={{
                       color: '#ef4444',
                       fontSize: '0.75rem',
                       marginTop: '0.25rem'
                     }}>
                       {fieldErrors.plan_name}
                     </div>
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
                    Giá hàng tháng (VND) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthly_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        handleInputChange('monthly_price', value);
                      }
                    }}
                     onBlur={(e) => {
                       const error = validateField('monthly_price', e.target.value);
                       setFieldErrors(prev => ({
                         ...prev,
                         monthly_price: error
                       }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                       border: fieldErrors.monthly_price ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                    placeholder="Nhập giá hàng tháng"
                   />
                   {fieldErrors.monthly_price && (
                     <div style={{
                       color: '#ef4444',
                       fontSize: '0.75rem',
                       marginTop: '0.25rem'
                     }}>
                       {fieldErrors.monthly_price}
                     </div>
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
                    Loại gói
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                  >
                                         <option value="supplementary">Gói bổ sung</option>
                    <option value="main">Gói chính</option>
                  </select>
                </div>




              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mô tả <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                   onBlur={(e) => {
                     const error = validateField('description', e.target.value);
                     setFieldErrors(prev => ({
                       ...prev,
                       description: error
                     }));
                   }}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                     border: fieldErrors.description ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    background: 'white'
                  }}
                  placeholder="Mô tả chi tiết về gói dịch vụ"
                />
                 {fieldErrors.description && (
                   <div style={{
                     color: '#ef4444',
                     fontSize: '0.75rem',
                     marginTop: '0.25rem'
                   }}>
                     {fieldErrors.description}
                   </div>
                 )}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Dịch vụ bao gồm
                </h2>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Danh sách dịch vụ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={addService}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#10b981';
                  }}
                >
                  <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                  Thêm dịch vụ
                </button>
              </div>

              {formData.services_included.map((service, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                   <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                       onBlur={(e) => {
                         const serviceFieldName = `service_${index}`;
                         let error = '';
                         if (!e.target.value.trim()) {
                           error = `Dịch vụ ${index + 1} không được để trống`;
                         } else if (e.target.value.trim().length < 2) {
                           error = `Dịch vụ ${index + 1} phải có ít nhất 2 ký tự`;
                         } else if (e.target.value.trim().length > 100) {
                           error = `Dịch vụ ${index + 1} không được quá 100 ký tự`;
                         }
                         setFieldErrors(prev => ({
                           ...prev,
                           [serviceFieldName]: error
                         }));
                       }}
                    style={{
                         width: '100%',
                      padding: '0.75rem',
                         border: fieldErrors[`service_${index}`] ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                    placeholder={`Dịch vụ ${index + 1}`}
                  />
                     {fieldErrors[`service_${index}`] && (
                       <div style={{
                         color: '#ef4444',
                         fontSize: '0.75rem',
                         marginTop: '0.25rem'
                       }}>
                         {fieldErrors[`service_${index}`]}
                       </div>
                     )}
                   </div>
                  {formData.services_included.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                    >
                      <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  )}
                </div>
              ))}

                             {(error || fieldErrors.services) && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#dc2626'
                }}>
                   {error || fieldErrors.services}
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                marginTop: '2rem'
              }}>
                <button
                  type="button"
                  onClick={() => router.push('/services')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: '2px solid transparent',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                      Tạo gói dịch vụ
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus, select:focus, textarea:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
} 