"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HeartIcon as HeartIconSolid,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  FireIcon,
  CloudIcon,
  ScaleIcon,
  BeakerIcon,
  HandRaisedIcon
} from '@heroicons/react/24/solid';

import { validateVitalSigns } from '@/lib/utils/vital-signs-utils';
import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export default function AddVitalSignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load residents from API when component mounts
  useEffect(() => {
    const fetchResidents = async () => {
      setLoadingData(true);
      try {
        let mapped: any[] = [];
        
        if (user?.role === 'staff') {
          // Staff chỉ thấy residents được phân công
          const data = await staffAssignmentsAPI.getMyAssignments();
          const assignmentsData = Array.isArray(data) ? data : [];
          
          // Debug: Log assignments data
          console.log('Raw assignments data:', assignmentsData);
          
          // Map API data về đúng format UI và chỉ lấy những assignment active
          mapped = assignmentsData
            .filter((assignment: any) => assignment.status === 'active') // Chỉ lấy active assignments
            .map((assignment: any) => {
              const resident = assignment.resident_id;
              
              return {
                id: resident._id,
                name: resident.full_name || '',
                avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
                assignmentStatus: assignment.status || 'unknown',
                assignmentId: assignment._id,
              };
            });
        } else if (user?.role === 'admin') {
          // Admin thấy tất cả residents
          const data = await residentAPI.getAll();
          const residentsData = Array.isArray(data) ? data : [];
          
          mapped = residentsData.map((resident: any) => ({
            id: resident._id,
            name: resident.full_name || '',
            avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
          }));
        }
        
        setResidents(mapped);
        
        // Lấy số phòng cho từng resident
        mapped.forEach(async (resident: any) => {
          try {
            const assignments = await carePlansAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
            const roomId = assignment?.assigned_room_id;
            // Đảm bảo roomId là string, không phải object
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa cập nhật' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
          }
        });
        
      } catch (err) {
        console.error('Error loading residents:', err);
        setResidents([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (user) {
      fetchResidents();
    }
  }, [user]);

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
      if (data.respiratoryRate < 8 || data.respiratoryRate > 40) {
        errors.respiratoryRate = 'Nhịp thở phải từ 8 đến 40 lần/phút';
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
      residentId: data.residentId,
      bloodPressure: data.bloodPressure,
      heartRate: data.heartRate,
      temperature: data.temperature,
      oxygenSaturation: data.oxygenSaturation,
      notes: data.notes || '',
    };

    // Only include optional fields if they have values
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      apiData.respiratoryRate = data.respiratoryRate;
    }
    
    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      apiData.weight = data.weight;
    }

    return apiData;
  };

  const parseApiError = (error: any) => {
    let errorMessage = 'Có lỗi xảy ra khi thêm chỉ số sức khỏe';
    const fieldErrors: { [key: string]: string } = {};

    if (error.response?.data) {
      const data = error.response.data;
      
      if (data.message) {
        errorMessage = data.message;
      }
      
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach((err: any) => {
          if (err.field && err.message) {
            fieldErrors[err.field] = err.message;
          }
        });
      }
    } else if (error.message) {
      errorMessage = error.message;
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
      const apiData = transformToApiFormat(formData);
      await vitalSignsAPI.create(apiData);
      
      setSubmitSuccess(true);
      toast.success('Thêm chỉ số sức khỏe thành công!', { position: 'top-right' });
      
      // Reset form
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
      
      // Redirect back to vital signs page after 1.5s
      setTimeout(() => {
        router.push('/staff/vital-signs');
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
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loadingData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s ease;
            background: white;
          }
          
          .form-input:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
          
          .form-input.error {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
          
          .form-select {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s ease;
            background: white;
            cursor: pointer;
          }
          
          .form-select:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
          
          .form-select.error {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
          
          .form-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s ease;
            background: white;
            resize: vertical;
            min-height: 100px;
          }
          
          .form-textarea:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }
        `
      }} />
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/staff/vital-signs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '1rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại
          </button>

          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '1rem',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <HeartIconSolid style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 0.5rem 0'
                }}>
                  Thêm Chỉ Số Sức Khỏe Mới
                </h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Ghi nhận các thông số sinh lý quan trọng của người cao tuổi
                </p>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              border: '1px solid #10b981',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircleIcon style={{ width: '2rem', height: '2rem', color: '#10b981' }} />
              <div>
                <h3 style={{ color: '#065f46', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                  Thêm chỉ số sức khỏe thành công!
                </h3>
                <p style={{ color: '#047857', margin: 0 }}>
                  Dữ liệu đã được lưu vào hệ thống. Đang chuyển về trang danh sách...
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {validationErrors.general && (
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid #ef4444',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
            }}>
              <ExclamationTriangleIcon style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
              <div>
                <h3 style={{ color: '#991b1b', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                  Có lỗi xảy ra
                </h3>
                <p style={{ color: '#b91c1c', margin: 0 }}>
                  {validationErrors.general}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Resident Selection */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.75rem'
                  }}>
                    <UserIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                    Người cao tuổi *
                  </label>
                  <select
                    value={formData.residentId}
                    onChange={(e) => handleInputChange('residentId', e.target.value)}
                    className={`form-select ${validationErrors.residentId ? 'error' : ''}`}
                    disabled={residents.length === 0}
                  >
                    <option value="">
                      {residents.length === 0 
                        ? (user?.role === 'staff' 
                            ? 'Chưa được phân công cư dân nào' 
                            : 'Chưa có cư dân nào trong hệ thống')
                        : 'Chọn người cao tuổi'
                      }
                    </option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Phòng {roomNumbers[resident.id] || 'Chưa cập nhật'}
                      </option>
                    ))}
                  </select>
                  {validationErrors.residentId && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      {validationErrors.residentId}
                    </p>
                  )}
                </div>

                {/* Vital Signs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {/* Blood Pressure */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      <HeartIconSolid style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#dc2626' }} />
                      Huyết áp (mmHg) *
                    </label>
                    <input
                      type="text"
                      value={formData.bloodPressure}
                      onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                      placeholder="Ví dụ: 120/80"
                      className={`form-input ${validationErrors.bloodPressure ? 'error' : ''}`}
                    />
                    {validationErrors.bloodPressure && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {validationErrors.bloodPressure}
                      </p>
                    )}
                  </div>

                  {/* Heart Rate */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      <HeartIconSolid style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#059669' }} />
                      Nhịp tim (bpm) *
                    </label>
                    <input
                      type="number"
                      value={formData.heartRate || ''}
                      onChange={(e) => handleInputChange('heartRate', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="60-100"
                      min="30"
                      max="200"
                      className={`form-input ${validationErrors.heartRate ? 'error' : ''}`}
                    />
                    {validationErrors.heartRate && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {validationErrors.heartRate}
                      </p>
                    )}
                  </div>

                  {/* Temperature */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      <FireIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#ea580c' }} />
                      Nhiệt độ (°C) *
                    </label>
                    <input
                      type="number"
                      value={formData.temperature || ''}
                      onChange={(e) => handleInputChange('temperature', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="36.5-37.5"
                      min="30"
                      max="45"
                      step="0.1"
                      className={`form-input ${validationErrors.temperature ? 'error' : ''}`}
                    />
                    {validationErrors.temperature && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {validationErrors.temperature}
                      </p>
                    )}
                  </div>

                  {/* Oxygen Saturation */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      <CloudIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#2563eb' }} />
                      SpO2 (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.oxygenSaturation || ''}
                      onChange={(e) => handleInputChange('oxygenSaturation', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="95-100"
                      min="70"
                      max="100"
                      className={`form-input ${validationErrors.oxygenSaturation ? 'error' : ''}`}
                    />
                    {validationErrors.oxygenSaturation && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {validationErrors.oxygenSaturation}
                      </p>
                    )}
                  </div>

                  {/* Respiratory Rate */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      <HandRaisedIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#059669' }} />
                      Nhịp thở (lần/phút)
                    </label>
                    <input
                      type="number"
                      value={formData.respiratoryRate || ''}
                      onChange={(e) => handleInputChange('respiratoryRate', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="12-20"
                      min="8"
                      max="40"
                      className={`form-input ${validationErrors.respiratoryRate ? 'error' : ''}`}
                    />
                    {validationErrors.respiratoryRate && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {validationErrors.respiratoryRate}
                      </p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '0.75rem'
                    }}>
                      <ScaleIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#7c3aed' }} />
                      Cân nặng (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="50-80"
                      min="20"
                      max="200"
                      step="0.1"
                      className={`form-input ${validationErrors.weight ? 'error' : ''}`}
                    />
                    {validationErrors.weight && (
                      <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {validationErrors.weight}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.75rem'
                  }}>
                    <BeakerIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem', color: '#059669' }} />
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Ghi chú thêm về tình trạng sức khỏe..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => router.push('/staff/vital-signs')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: isSubmitting || submitSuccess 
                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isSubmitting || submitSuccess ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isSubmitting || submitSuccess ? 0.6 : 1
                    }}
                  >
                    {isSubmitting ? 'Đang lưu...' : submitSuccess ? 'Đã lưu!' : 'Lưu chỉ số'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 