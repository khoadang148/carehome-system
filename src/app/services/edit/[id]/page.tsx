import { getUserFriendlyError } from '@/lib/utils/error-translations';
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ArrowLeftIcon,
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { carePlansAPI } from '@/lib/api';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const packageId = params.id as string;
  
  // Form state
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    monthly_price: '',
    plan_type: 'regular',
    category: 'regular',
    services_included: [''],
    staff_ratio: '',
    duration_type: 'monthly',
    default_medications: [],
    prerequisites: [],
    contraindications: [],
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check access permissions
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

  // Load package data
  useEffect(() => {
    if (!packageId) return;
    
    const loadPackageData = async () => {
      try {
        setLoadingData(true);
        const packageData = await carePlansAPI.getById(packageId);
        
        setFormData({
          plan_name: packageData.plan_name || '',
          description: packageData.description || '',
          monthly_price: packageData.monthly_price?.toString() || '',
          plan_type: packageData.plan_type || 'cham_soc_dac_biet',
          category: packageData.category === 'regular' ? 'main' : (packageData.category || 'main'),
          services_included: packageData.services_included?.length > 0 
            ? packageData.services_included 
            : [''],
          staff_ratio: packageData.staff_ratio || '1:3',
          duration_type: packageData.duration_type || 'monthly',
          default_medications: packageData.default_medications || [],
          prerequisites: packageData.prerequisites || [],
          contraindications: packageData.contraindications || [],
          is_active: typeof packageData.is_active === 'boolean' ? packageData.is_active : true,
        });
      } catch (err: any) {
        console.error('Error loading package data:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy gói dịch vụ này');
        } else {
          setError('Không thể tải thông tin gói dịch vụ. Vui lòng thử lại sau.');
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadPackageData();
  }, [packageId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
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
    
    // Clear error when user starts typing
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
    
    // Clear previous errors
    setError(null);
    
    // Validation
    if (!formData.plan_name.trim()) {
      setError('Tên gói dịch vụ không được để trống');
      return;
    }
    
    if (formData.plan_name.trim().length < 3) {
      setError('Tên gói dịch vụ phải có ít nhất 3 ký tự');
      return;
    }
    
    if (formData.plan_name.trim().length > 100) {
      setError('Tên gói dịch vụ không được quá 100 ký tự');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Mô tả không được để trống');
      return;
    }
    
    if (formData.description.trim().length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự');
      return;
    }
    
    if (formData.description.trim().length > 500) {
      setError('Mô tả không được quá 500 ký tự');
      return;
    }
    
    if (!formData.monthly_price || formData.monthly_price.trim() === '') {
      setError('Giá hàng tháng không được để trống');
      return;
    }
    
    const price = parseFloat(formData.monthly_price);
    if (isNaN(price)) {
      setError('Giá hàng tháng phải là số hợp lệ');
      return;
    }
    
    if (price <= 0) {
      setError('Giá hàng tháng phải lớn hơn 0');
      return;
    }
    
    if (price > 1000000000) {
      setError('Giá hàng tháng không được quá 1 tỷ VND');
      return;
    }
    
    const validServices = formData.services_included.filter(service => service.trim() !== '');
    if (validServices.length === 0) {
      setError('Phải có ít nhất một dịch vụ được bao gồm');
      return;
    }
    
    // Validate each service
    for (let i = 0; i < validServices.length; i++) {
      const service = validServices[i];
      if (service.trim().length < 2) {
        setError(`Dịch vụ ${i + 1} phải có ít nhất 2 ký tự`);
        return;
      }
      if (service.trim().length > 100) {
        setError(`Dịch vụ ${i + 1} không được quá 100 ký tự`);
        return;
      }
    }
    
    // Check for duplicate services
    const uniqueServices = [...new Set(validServices.map(s => s.trim().toLowerCase()))];
    if (uniqueServices.length !== validServices.length) {
      setError('Không được có dịch vụ trùng lặp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const packageData = {
        plan_name: formData.plan_name.trim(),
        description: formData.description.trim(),
        monthly_price: parseFloat(formData.monthly_price),
        plan_type: formData.plan_type,
        category: formData.category === 'regular' ? 'main' : formData.category,
        services_included: validServices,
        staff_ratio: formData.staff_ratio?.trim() || '1:3',
        duration_type: formData.duration_type,
        default_medications: formData.default_medications.length > 0 ? formData.default_medications : [],
        prerequisites: formData.prerequisites.length > 0 ? formData.prerequisites : [],
        contraindications: formData.contraindications.length > 0 ? formData.contraindications : [],
        is_active: formData.is_active
      };

      await carePlansAPI.update(packageId, packageData);
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/services');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Đang tải thông tin gói dịch vụ...
          </h2>
        </div>
      </div>
    );
  }

  if (error && !loadingData) {
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
          <div style={{
            width: '4rem',
            height: '4rem',
            color: '#ef4444',
            margin: '0 auto 1rem',
            fontSize: '4rem'
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Có lỗi xảy ra
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/services')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Quay về trang dịch vụ
          </button>
        </div>
      </div>
    );
  }

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
            Cập nhật gói dịch vụ thành công!
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            Gói dịch vụ đã được cập nhật và sẽ hiển thị trong danh sách.
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
            <ArrowLeftIcon style={{height: '1.25rem', width: '1.25rem'}} />
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
                <PencilIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
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
                Chỉnh sửa gói dịch vụ
              </h1>
            </div>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              Cập nhật thông tin gói dịch vụ chăm sóc
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
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <PencilIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Thông tin cơ bản
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
                    Tên gói dịch vụ <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.plan_name}
                    onChange={(e) => handleInputChange('plan_name', e.target.value)}
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
                    placeholder="Nhập tên gói dịch vụ"
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
                    Giá hàng tháng (VND) <span style={{color: '#ef4444'}}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthly_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers
                      if (value === '' || /^\d+$/.test(value)) {
                        handleInputChange('monthly_price', value);
                      }
                    }}
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
                    placeholder="Nhập giá hàng tháng"
                    min="0"
                    step="1000"
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
                    <option value="regular">Gói thường</option>
                    <option value="main">Gói chính</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Kiểu gói
                  </label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => handleInputChange('plan_type', e.target.value)}
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
                    <option value="regular">Gói thường</option>
                    <option value="cham_soc_dac_biet">Chăm sóc đặc biệt</option>
                    <option value="cham_soc_cao_cap">Chăm sóc cao cấp</option>
                    <option value="cham_soc_co_ban">Chăm sóc cơ bản</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      style={{
                        width: '1rem',
                        height: '1rem'
                      }}
                    />
                    Kích hoạt gói dịch vụ
                  </label>
                </div>
              </div>

              <div style={{marginBottom: '2rem'}}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mô tả <span style={{color: '#ef4444'}}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    background: 'white'
                  }}
                  placeholder="Mô tả chi tiết về gói dịch vụ"
                />
              </div>
            </div>

            {/* Services Section */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <DocumentTextIcon style={{width: '1.25rem', height: '1.25rem'}} />
                <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>
                  Dịch vụ bao gồm
                </h2>
              </div>
            </div>

            <div style={{padding: '2rem'}}>
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
                  Danh sách dịch vụ <span style={{color: '#ef4444'}}>*</span>
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
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: 'white'
                    }}
                    placeholder={`Dịch vụ ${index + 1}`}
                  />
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

              {/* Error Message */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#dc2626'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
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
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
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
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                      Cập nhật gói dịch vụ
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