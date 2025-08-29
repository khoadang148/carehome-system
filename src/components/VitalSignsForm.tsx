"use client";

import React, { useState, useEffect } from 'react';
import { 
  HeartIcon as HeartIconSolid,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  FireIcon,
  CloudIcon,
  ScaleIcon,
  BeakerIcon,
  HandRaisedIcon
} from '@heroicons/react/24/solid';

import { useVitalSigns } from '@/hooks/useVitalSigns';
import { validateVitalSigns } from '@/lib/utils/vital-signs-utils';
import { vitalSignsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts';

interface VitalSigns {
  residentId: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  weight?: number;
  notes: string;
  bloodPressure?: string;
}

interface VitalSignsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VitalSigns) => Promise<void>;
}

export default function VitalSignsForm({ isOpen, onClose, onSubmit }: VitalSignsFormProps) {
  const { residents, loading: residentsLoading } = useVitalSigns();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  console.log('🏠 Available residents:', residents);
  console.log('🏠 Residents loading:', residentsLoading);

  const [formData, setFormData] = useState<VitalSigns>({
    residentId: '',
    bloodPressure: '',
    heartRate: undefined,
    temperature: undefined,
    oxygenSaturation: undefined,
    respiratoryRate: undefined,
    weight: undefined,
    notes: '',
  });

  const validateFormStrict = (data: VitalSigns) => {
    const errors: { [key: string]: string } = {};
    
    if (!data.residentId) {
      errors.residentId = 'Vui lòng chọn người cao tuổi';
    }
    
    if (data.temperature === undefined || data.temperature === null || isNaN(Number(data.temperature))) {
      errors.temperature = 'Vui lòng nhập nhiệt độ';
    } else if (data.temperature < 30 || data.temperature > 45) {
      errors.temperature = 'Nhiệt độ phải từ 30°C đến 45°C';
    }
    
    if (data.heartRate === undefined || data.heartRate === null || isNaN(Number(data.heartRate))) {
      errors.heartRate = 'Vui lòng nhập nhịp tim';
    } else if (data.heartRate < 30 || data.heartRate > 200) {
      errors.heartRate = 'Nhịp tim phải từ 30 đến 200 bpm';
    }
    
    if (!data.bloodPressure || data.bloodPressure.trim() === '') {
      errors.bloodPressure = 'Vui lòng nhập huyết áp';
    } else if (!/^\d{2,3}\/\d{2,3}$/.test(data.bloodPressure)) {
      errors.bloodPressure = 'Huyết áp phải đúng định dạng (ví dụ: 120/80)';
    }
    
    if (data.oxygenSaturation === undefined || data.oxygenSaturation === null || isNaN(Number(data.oxygenSaturation))) {
      errors.oxygenSaturation = 'Vui lòng nhập nồng độ oxy';
    } else if (data.oxygenSaturation < 70 || data.oxygenSaturation > 100) {
      errors.oxygenSaturation = 'Nồng độ oxy phải từ 70% đến 100%';
    }
    
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      if (data.respiratoryRate < 5 || data.respiratoryRate > 60) {
        errors.respiratoryRate = 'Nhịp thở phải từ 5 đến 60 lần/phút';
      }
    }
    
    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      if (data.weight < 20 || data.weight > 200) {
        errors.weight = 'Cân nặng phải từ 20kg đến 200kg';
      }
    }
    
    return errors;
  };

  const validateForm = validateFormStrict;

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setFormData({
        residentId: '',
        bloodPressure: '',
        heartRate: undefined,
        temperature: undefined,
        oxygenSaturation: undefined,
        respiratoryRate: undefined,
        weight: undefined,
        notes: '',
      });
      setValidationErrors({});
      setSubmitSuccess(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof VitalSigns, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const transformToApiFormat = (data: VitalSigns) => {
    const apiData: any = {
      resident_id: data.residentId,
      recorded_by: user?.id || '',
      temperature: Number(data.temperature),
      heart_rate: Number(data.heartRate),
      blood_pressure: data.bloodPressure,
      oxygen_level: Number(data.oxygenSaturation),
      notes: data.notes?.trim() || ''
    };

    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      apiData.respiratory_rate = Number(data.respiratoryRate);
    }

    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      apiData.weight = Number(data.weight);
    }

    console.log('🔧 Transformed API data:', apiData);
    return apiData;
  };

  const parseApiError = (error: any) => {
    console.error('🔍 Parsing API error:', error);
    
    let errorMessage = 'Có lỗi không xác định xảy ra. Vui lòng thử lại.';
    let fieldErrors: { [key: string]: string } = {};

    if (error.response) {
      const { status, data } = error.response;
      console.error(`❌ API Error - Status: ${status}`, data);

      switch (status) {
        case 400:
          if (data && typeof data === 'object') {
            if (data.detail && Array.isArray(data.detail)) {
              data.detail.forEach((item: any) => {
                if (item.loc && item.msg) {
                  const field = item.loc[item.loc.length - 1];
                  let fieldName = field;
                  let errorMsg = item.msg;

                  switch (field) {
                    case 'resident_id':
                      fieldName = 'residentId';
                      errorMsg = 'ID người cao tuổi không hợp lệ';
                      break;
                    case 'temperature':
                      fieldName = 'temperature';
                      errorMsg = `Nhiệt độ không hợp lệ: ${item.msg}`;
                      break;
                    case 'heart_rate':
                      fieldName = 'heartRate';
                      errorMsg = `Nhịp tim không hợp lệ: ${item.msg}`;
                      break;
                    case 'blood_pressure':
                      fieldName = 'bloodPressure';
                      errorMsg = `Huyết áp không hợp lệ: ${item.msg}`;
                      break;
                    case 'respiratory_rate':
                      fieldName = 'respiratoryRate';
                      errorMsg = `Nhịp thở không hợp lệ: ${item.msg}`;
                      break;
                    case 'oxygen_level':
                      fieldName = 'oxygenSaturation';
                      errorMsg = `Nồng độ oxy không hợp lệ: ${item.msg}`;
                      break;
                    case 'weight':
                      fieldName = 'weight';
                      errorMsg = `Cân nặng không hợp lệ: ${item.msg}`;
                      break;
                    default:
                      errorMsg = `${field}: ${item.msg}`;
                  }
                  
                  fieldErrors[fieldName] = errorMsg;
                }
              });
              
              if (Object.keys(fieldErrors).length > 0) {
                errorMessage = 'Dữ liệu nhập vào có lỗi. Vui lòng kiểm tra các trường được đánh dấu đỏ.';
              } else {
                errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
              }
            }
            else if (data.detail && typeof data.detail === 'string') {
              errorMessage = `Lỗi dữ liệu: ${data.detail}`;
            }
            else if (data.message) {
              errorMessage = `Lỗi: ${data.message}`;
            }
            else if (data.error) {
              errorMessage = `Lỗi: ${data.error}`;
            }
            else {
              errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
            }
          } else {
            errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          }
          break;

        case 401:
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          break;

        case 403:
          errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
          break;

        case 404:
          if (data && data.detail) {
            errorMessage = `Không tìm thấy: ${data.detail}`;
          } else {
            errorMessage = 'Không tìm thấy người cao tuổi được chọn. Vui lòng chọn lại.';
          }
          break;

        case 409:
          if (data && data.detail) {
            errorMessage = `Xung đột dữ liệu: ${data.detail}`;
          } else {
            errorMessage = 'Đã tồn tại bản ghi với thông tin tương tự.';
          }
          break;

        case 422:
          errorMessage = 'Dữ liệu không được chấp nhận. Vui lòng kiểm tra định dạng và giá trị các trường.';
          break;

        case 500:
          if (data && data.detail) {
            errorMessage = `Lỗi hệ thống: ${data.detail}`;
          } else {
            errorMessage = 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
          }
          break;

        case 502:
          errorMessage = 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.';
          break;

        case 503:
          errorMessage = 'Dịch vụ tạm thời bảo trì. Vui lòng thử lại sau.';
          break;

        default:
          if (data && data.detail) {
            errorMessage = `Lỗi ${status}: ${data.detail}`;
          } else if (data && data.message) {
            errorMessage = `Lỗi ${status}: ${data.message}`;
          } else {
            errorMessage = `Lỗi HTTP ${status}. Vui lòng thử lại hoặc liên hệ hỗ trợ.`;
          }
      }
    } else if (error.request) {
      console.error('🌐 Network error:', error.request);
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
    } else {
      console.error('⚠️ Other error:', error.message);
      errorMessage = `Lỗi: ${error.message || 'Có lỗi không xác định xảy ra'}`;
    }

    return { errorMessage, fieldErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!formData.residentId) {
      setValidationErrors({ residentId: 'Vui lòng chọn người cao tuổi' });
      return;
    }
    if (!formData.bloodPressure) {
      setValidationErrors({ bloodPressure: 'Vui lòng nhập huyết áp' });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});
    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      setTimeout(() => {
        const modal = document.querySelector('.vital-signs-modal');
        if (modal) modal.scrollTop = 0;
      }, 100);
      setTimeout(() => {
        setFormData({
          residentId: '',
          bloodPressure: '',
          heartRate: undefined,
          temperature: undefined,
          oxygenSaturation: undefined,
          respiratoryRate: undefined,
          weight: undefined,
          notes: '',
        });
        setValidationErrors({});
        setSubmitSuccess(false);
        onClose();
      }, 1500);
    } catch (error: any) {
      const { errorMessage, fieldErrors } = parseApiError(error);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors({ ...fieldErrors, general: errorMessage });
      } else {
        setValidationErrors({ general: errorMessage });
      }
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
          .vital-signs-modal {
            animation: fadeIn 0.3s ease-out;
          }
          .modal-content {
            animation: slideIn 0.3s ease-out;
          }
          .success-banner {
            animation: pulse 2s ease-in-out infinite;
          }
          .input-focus:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
          }
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .card-hover {
            transition: all 0.3s ease;
          }
          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          }
        `
      }} />
      
      <div className="vital-signs-modal" style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        overflow: 'auto'
      }}>
        <div className="modal-content" style={{
          background: 'white',
          borderRadius: '1.5rem',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }} />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <HeartIconSolid style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'white',
                    margin: '0 0 0.25rem 0',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    Thêm Chỉ Số Sức Khỏe
                  </h2>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: 0,
                    fontSize: '0.875rem'
                  }}>
                    Ghi nhận thông số sinh lý quan trọng
                  </p>
                </div>
              </div>
              <button
                title="Đóng"
                onClick={onClose}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
            {submitSuccess && (
              <div className="success-banner" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid #34d399',
                borderRadius: '1rem',
                marginBottom: '2rem',
                fontWeight: 600,
                fontSize: '1rem',
                color: 'white',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                Đã lưu chỉ số sức khỏe thành công!
              </div>
            )}
            
            {validationErrors.general && !submitSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: '1px solid #f87171',
                borderRadius: '1rem',
                marginBottom: '2rem',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
              }}>
                <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: '0 0 0.25rem 0' }}>
                    Có lỗi xảy ra
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                    {validationErrors.general}
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: '0.75rem'
              }}>
                <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
                Người cao tuổi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.residentId || ''}
                onChange={(e) => handleInputChange('residentId', e.target.value)}
                className="input-focus"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: `2px solid ${validationErrors.residentId ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                <option value="">Chọn người cao tuổi...</option>
                {residents.map(resident => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name} - Phòng {resident.room}
                  </option>
                ))}
              </select>
              {validationErrors.residentId && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
                  {validationErrors.residentId}
                </p>
              )}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '2rem' 
            }}>
              <div className="card-hover" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  <HeartIconSolid style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                  Huyết áp (mmHg) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.bloodPressure || ''}
                  onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                  placeholder="120/80"
                  className="input-focus"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${validationErrors.bloodPressure ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                />
                {validationErrors.bloodPressure && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {validationErrors.bloodPressure}
                  </p>
                )}
              </div>

              <div className="card-hover" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  <HeartIconSolid style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                  Nhịp tim (bpm) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.heartRate || ''}
                  onChange={(e) => handleInputChange('heartRate', Number(e.target.value))}
                  placeholder="72"
                  className="input-focus"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${validationErrors.heartRate ? '#ef4444' : '#fca5a5'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                />
                {validationErrors.heartRate && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {validationErrors.heartRate}
                  </p>
                )}
              </div>

              <div className="card-hover" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  <FireIcon style={{ width: '1rem', height: '1rem', color: '#ea580c' }} />
                  Nhiệt độ (°C) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature || ''}
                  onChange={(e) => handleInputChange('temperature', Number(e.target.value))}
                  placeholder="36.5"
                  className="input-focus"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${validationErrors.temperature ? '#ef4444' : '#fbbf24'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                />
                {validationErrors.temperature && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {validationErrors.temperature}
                  </p>
                )}
              </div>

              <div className="card-hover" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  <CloudIcon style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                  Nồng độ oxy (%) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.oxygenSaturation || ''}
                  onChange={(e) => handleInputChange('oxygenSaturation', Number(e.target.value))}
                  placeholder="98"
                  className="input-focus"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${validationErrors.oxygenSaturation ? '#ef4444' : '#60a5fa'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                />
                {validationErrors.oxygenSaturation && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {validationErrors.oxygenSaturation}
                  </p>
                )}
              </div>

              <div className="card-hover" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  <HandRaisedIcon style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
                  Nhịp thở (lần/phút)
                </label>
                <input
                  type="number"
                  value={formData.respiratoryRate || ''}
                  onChange={(e) => handleInputChange('respiratoryRate', Number(e.target.value))}
                  placeholder="16"
                  className="input-focus"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #a7f3d0',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                />
                {validationErrors.respiratoryRate && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {validationErrors.respiratoryRate}
                  </p>
                )}
              </div>

              <div className="card-hover" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  <ScaleIcon style={{ width: '1rem', height: '1rem', color: '#9333ea' }} />
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                  placeholder="65.0"
                  className="input-focus"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: `2px solid ${validationErrors.weight ? '#ef4444' : '#d8b4fe'}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                />
                {validationErrors.weight && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {validationErrors.weight}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: '0.75rem'
              }}>
                <BeakerIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                Ghi chú
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Ghi chú thêm về tình trạng sức khỏe, triệu chứng, hoặc các thông tin quan trọng khác..."
                rows={4}
                className="input-focus"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.875rem 2rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.75rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.875rem 2rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  background: isSubmitting 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSubmitting 
                    ? 'none' 
                    : '0 4px 12px rgba(239, 68, 68, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }
                }}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang thêm...
                  </div>
                ) : (
                  'Thêm chỉ số'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 