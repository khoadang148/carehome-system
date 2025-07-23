"use client";

import React, { useState, useEffect } from 'react';
import { 
  HeartIcon as HeartIconSolid,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
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
  
  // Debug residents
  console.log('🏠 Available residents:', residents);
  console.log('🏠 Residents loading:', residentsLoading);

  // Single field for blood pressure input
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

  // Update validateFormStrict for single bloodPressure field
  const validateFormStrict = (data: VitalSigns) => {
    const errors: { [key: string]: string } = {};
    
    // Required fields
    if (!data.residentId) {
      errors.residentId = 'Vui lòng chọn người cao tuổi';
    }
    
    // Temperature (required)
    if (data.temperature === undefined || data.temperature === null || isNaN(Number(data.temperature))) {
      errors.temperature = 'Vui lòng nhập nhiệt độ';
    } else if (data.temperature < 30 || data.temperature > 45) {
      errors.temperature = 'Nhiệt độ phải từ 30°C đến 45°C';
    }
    
    // Heart Rate (required)
    if (data.heartRate === undefined || data.heartRate === null || isNaN(Number(data.heartRate))) {
      errors.heartRate = 'Vui lòng nhập nhịp tim';
    } else if (data.heartRate < 30 || data.heartRate > 200) {
      errors.heartRate = 'Nhịp tim phải từ 30 đến 200 bpm';
    }
    
    // Blood Pressure (required) - validate format only
    if (!data.bloodPressure || data.bloodPressure.trim() === '') {
      errors.bloodPressure = 'Vui lòng nhập huyết áp';
    } else if (!/^\d{2,3}\/\d{2,3}$/.test(data.bloodPressure)) {
      errors.bloodPressure = 'Huyết áp phải đúng định dạng (ví dụ: 120/80)';
    }
    
    // Oxygen Saturation (required)
    if (data.oxygenSaturation === undefined || data.oxygenSaturation === null || isNaN(Number(data.oxygenSaturation))) {
      errors.oxygenSaturation = 'Vui lòng nhập nồng độ oxy';
    } else if (data.oxygenSaturation < 70 || data.oxygenSaturation > 100) {
      errors.oxygenSaturation = 'Nồng độ oxy phải từ 70% đến 100%';
    }
    
    // Optional fields - only validate if provided
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

  // Replace old validateForm with strict version
  const validateForm = validateFormStrict;

  // Reset form when modal opens/closes
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
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };



  // Update transformToApiFormat to use bloodPressure directly and handle optional fields
  const transformToApiFormat = (data: VitalSigns) => {
    const apiData: any = {
      resident_id: data.residentId,
      recorded_by: user?.id || '', // Add current user ID as recorded_by
      temperature: Number(data.temperature),
      heart_rate: Number(data.heartRate),
      blood_pressure: data.bloodPressure,
      oxygen_level: Number(data.oxygenSaturation),
      notes: data.notes?.trim() || ''
    };

    // Only include optional fields if they have valid values
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      apiData.respiratory_rate = Number(data.respiratoryRate);
    }

    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      apiData.weight = Number(data.weight);
    }

    console.log('🔧 Transformed API data:', apiData);
    return apiData;
  };

  // Enhanced error handling function
  const parseApiError = (error: any) => {
    console.error('🔍 Parsing API error:', error);
    
    // Default error message
    let errorMessage = 'Có lỗi không xác định xảy ra. Vui lòng thử lại.';
    let fieldErrors: { [key: string]: string } = {};

    if (error.response) {
      const { status, data } = error.response;
      console.error(`❌ API Error - Status: ${status}`, data);

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          // Bad Request - usually validation errors
          if (data && typeof data === 'object') {
            // Check for FastAPI validation errors
            if (data.detail && Array.isArray(data.detail)) {
              // FastAPI validation error format
              data.detail.forEach((item: any) => {
                if (item.loc && item.msg) {
                  const field = item.loc[item.loc.length - 1]; // Get last location part
                  let fieldName = field;
                  let errorMsg = item.msg;

                  // Map API field names to UI field names
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
            // Check for single detail message
            else if (data.detail && typeof data.detail === 'string') {
              errorMessage = `Lỗi dữ liệu: ${data.detail}`;
            }
            // Check for message field
            else if (data.message) {
              errorMessage = `Lỗi: ${data.message}`;
            }
            // Check for error field
            else if (data.error) {
              errorMessage = `Lỗi: ${data.error}`;
            }
            // Generic validation error
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
          // Unprocessable Entity - validation errors
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
      // Network error
      console.error('🌐 Network error:', error.request);
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
    } else {
      // Other error
      console.error('⚠️ Other error:', error.message);
      errorMessage = `Lỗi: ${error.message || 'Có lỗi không xác định xảy ra'}`;
    }

    return { errorMessage, fieldErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Check required fields
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
      // Scroll lên đầu modal để thấy banner thành công
      setTimeout(() => {
        const modal = document.querySelector('.vital-signs-modal');
        if (modal) modal.scrollTop = 0;
      }, 100);
      // Tự động đóng modal sau 1.5s
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
      // Parse the error to get detailed information
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
    <div className="vital-signs-modal" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem 2rem 1rem 2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HeartIconSolid style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0
            }}>
              Thêm Chỉ Số Sức Khỏe
            </h2>
          </div>
          <button
            title="Đóng"
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#f3f4f6',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          {/* Success Message */}
          {submitSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: '#ecfdf5',
              border: '1px solid #86efac',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#065f46',
              justifyContent: 'center'
            }}>
              <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              Đã lưu chỉ số sức khỏe thành công!
            </div>
          )}
          {/* Error Message */}
          {validationErrors.general && !submitSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#991b1b', margin: 0 }}>
                  Có lỗi xảy ra
                </p>
                <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0 }}>
                  {validationErrors.general}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Resident Selection */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Người cao tuổi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.residentId || ''}
                onChange={(e) => handleInputChange('residentId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${validationErrors.residentId ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: 'white'
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
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.residentId}
                </p>
              )}
            </div>

            {/* Blood Pressure (single input) */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Huyết áp (mmHg) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.bloodPressure || ''}
                onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                placeholder="120/80"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${validationErrors.bloodPressure ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {validationErrors.bloodPressure && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.bloodPressure}
                </p>
              )}
            </div>

            {/* Heart Rate */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nhịp tim (bpm) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                value={formData.heartRate || ''}
                onChange={(e) => handleInputChange('heartRate', Number(e.target.value))}
                placeholder="72"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${validationErrors.heartRate ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {validationErrors.heartRate && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.heartRate}
                </p>
              )}
            </div>

            {/* Temperature */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nhiệt độ (°C) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature || ''}
                onChange={(e) => handleInputChange('temperature', Number(e.target.value))}
                placeholder="36.5"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${validationErrors.temperature ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {validationErrors.temperature && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.temperature}
                </p>
              )}
            </div>

            {/* Oxygen Level */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nồng độ oxy (%) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                value={formData.oxygenSaturation || ''}
                onChange={(e) => handleInputChange('oxygenSaturation', Number(e.target.value))}
                placeholder="98"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${validationErrors.oxygenSaturation ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {validationErrors.oxygenSaturation && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.oxygenSaturation}
                </p>
              )}
            </div>

            {/* Respiratory Rate */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nhịp thở (lần/phút)
              </label>
              <input
                type="number"
                value={formData.respiratoryRate || ''}
                onChange={(e) => handleInputChange('respiratoryRate', Number(e.target.value))}
                placeholder="16"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {validationErrors.respiratoryRate && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.respiratoryRate}
                </p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Cân nặng (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                placeholder="65.0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${validationErrors.weight ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {validationErrors.weight && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.weight}
                </p>
              )}
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ghi chú
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Ghi chú thêm về tình trạng sức khỏe..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* General Error Display */}
          {validationErrors.general && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {validationErrors.general}
            </div>
          )}

          {/* Success Message Display */}
          {submitSuccess && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '0.5rem',
              color: '#065f46',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#065f46' }} />
              Dữ liệu đã được lưu thành công!
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang thêm...' : 'Thêm chỉ số'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 