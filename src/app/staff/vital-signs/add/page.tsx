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

// Error Modal Component
const ErrorModal = ({ isOpen, onClose, errors }: { 
  isOpen: boolean; 
  onClose: () => void; 
  errors: { [key: string]: string } 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: '#fee2e2',
            borderRadius: '50%',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#991b1b',
            margin: 0
          }}>
            Có lỗi xảy ra
          </h2>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {Object.keys(errors).length > 0 && (
            <>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Vui lòng kiểm tra và sửa các lỗi sau:
              </p>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field} style={{
                    padding: '0.75rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    color: '#991b1b',
                    fontSize: '0.875rem'
                  }}>
                    {field === 'general' ? (
                      <span>{message}</span>
                    ) : (
                      <span><strong>{getFieldLabel(field)}:</strong> {message}</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {errors.general && (
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#991b1b',
              fontSize: '0.875rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                Lỗi hệ thống:
              </p>
              <p style={{ margin: 0 }}>
                {errors.general}
              </p>
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                fontSize: '0.75rem', 
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Nếu lỗi vẫn tiếp tục, vui lòng liên hệ admin hoặc thử lại sau.
              </p>
            </div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get field labels
const getFieldLabel = (field: string): string => {
  const labels: { [key: string]: string } = {
    residentId: 'Người cao tuổi',
    bloodPressure: 'Huyết áp',
    heartRate: 'Nhịp tim',
    temperature: 'Nhiệt độ',
    oxygenSaturation: 'Nồng độ oxy',
    respiratoryRate: 'Nhịp thở',
    weight: 'Cân nặng',
    notes: 'Ghi chú'
  };
  return labels[field] || field;
};

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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ [key: string]: string }>({});
  
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

  // Validation based on MongoDB schema
  const validateForm = (data: VitalSigns) => {
    const errors: { [key: string]: string } = {};
    
    // Required fields
    if (!data.residentId) {
      errors.residentId = 'Vui lòng chọn người cao tuổi';
    }
    
    // Temperature validation (30-45°C)
    if (data.temperature !== undefined && data.temperature !== null && !isNaN(Number(data.temperature))) {
      const temp = Number(data.temperature);
      if (temp < 30 || temp > 45) {
        errors.temperature = 'Nhiệt độ phải từ 30°C đến 45°C';
      }
    }
    
    // Heart rate validation (30-200 bpm)
    if (data.heartRate !== undefined && data.heartRate !== null && !isNaN(Number(data.heartRate))) {
      const hr = Number(data.heartRate);
      if (hr < 30 || hr > 200) {
        errors.heartRate = 'Nhịp tim phải từ 30 đến 200 bpm';
      }
    }
    
    // Blood pressure validation (format: XXX/YYY or XX/YY)
    if (data.bloodPressure && data.bloodPressure.trim() !== '') {
      if (!/^[0-9]{2,3}\/[0-9]{2,3}$/.test(data.bloodPressure)) {
        errors.bloodPressure = 'Huyết áp phải đúng định dạng (ví dụ: 120/80)';
      }
    }
    
    // Respiratory rate validation (5-60 breaths/min)
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      const rr = Number(data.respiratoryRate);
      if (rr < 5 || rr > 60) {
        errors.respiratoryRate = 'Nhịp thở phải từ 5 đến 60 lần/phút';
      }
    }
    
    // Oxygen level validation (70-100%)
    if (data.oxygenSaturation !== undefined && data.oxygenSaturation !== null && !isNaN(Number(data.oxygenSaturation))) {
      const o2 = Number(data.oxygenSaturation);
      if (o2 < 70 || o2 > 100) {
        errors.oxygenSaturation = 'Nồng độ oxy phải từ 70% đến 100%';
      }
    }
    
    // Weight validation (20-200 kg)
    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      const weight = Number(data.weight);
      if (weight < 20 || weight > 200) {
        errors.weight = 'Cân nặng phải từ 20kg đến 200kg';
      }
    }
    
    // Respiratory rate validation (5-60 breaths/min) - if provided
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      const rr = Number(data.respiratoryRate);
      if (rr < 5 || rr > 60) {
        errors.respiratoryRate = 'Nhịp thở phải từ 5 đến 60 lần/phút';
      }
    }
    
    // Notes validation - if provided, should not be too long
    if (data.notes && data.notes.trim() !== '') {
      if (data.notes.trim().length > 500) {
        errors.notes = 'Ghi chú không được quá 500 ký tự';
      }
    }
    
    return errors;
  };

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

  // Update transformToApiFormat to use correct API field names (snake_case)
  const transformToApiFormat = (data: VitalSigns) => {
    const apiData: any = {
      resident_id: data.residentId,
      blood_pressure: data.bloodPressure,
      heart_rate: data.heartRate,
      temperature: data.temperature,
      oxygen_level: data.oxygenSaturation,
      notes: data.notes || '',
    };

    // Only include optional fields if they have values
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      apiData.respiratory_rate = data.respiratoryRate;
    }
    
    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      apiData.weight = data.weight;
    }

    return apiData;
  };

  const parseApiError = (error: any) => {
    let errorMessage = 'Có lỗi xảy ra khi thêm chỉ số sức khỏe';
    const fieldErrors: { [key: string]: string } = {};

    console.log('=== ERROR PARSING ===');
    console.log('Error object:', error);
    console.log('Error response:', error.response);
    console.log('Error message:', error.message);

    if (error.response?.data) {
      const data = error.response.data;
      console.log('Response data:', data);
      
      // Handle validation errors from backend first
      if (data.error && typeof data.error === 'string') {
        // Check if it's a field-specific error
        if (data.error.includes('blood pressure') || data.error.includes('huyết áp')) {
          fieldErrors.bloodPressure = data.error;
        } else if (data.error.includes('temperature') || data.error.includes('nhiệt độ')) {
          fieldErrors.temperature = data.error;
        } else if (data.error.includes('heart rate') || data.error.includes('nhịp tim')) {
          fieldErrors.heartRate = data.error;
        } else if (data.error.includes('oxygen') || data.error.includes('oxy')) {
          fieldErrors.oxygenSaturation = data.error;
        } else if (data.error.includes('respiratory') || data.error.includes('thở')) {
          fieldErrors.respiratoryRate = data.error;
        } else if (data.error.includes('weight') || data.error.includes('cân nặng')) {
          fieldErrors.weight = data.error;
        } else if (data.error.includes('resident') || data.error.includes('người cao tuổi')) {
          fieldErrors.residentId = data.error;
        } else {
          errorMessage = data.error;
        }
      }
      
      // Handle array of validation errors
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach((err: any) => {
          if (err.field && err.message) {
            fieldErrors[err.field] = err.message;
          }
        });
      }
      
      // Handle message field
      if (data.message && !fieldErrors.bloodPressure && !fieldErrors.temperature && 
          !fieldErrors.heartRate && !fieldErrors.oxygenSaturation && !fieldErrors.respiratoryRate && 
          !fieldErrors.weight && !fieldErrors.residentId) {
        errorMessage = data.message;
      }
      
      // Only use status code errors if no specific errors found
      if (Object.keys(fieldErrors).length === 0 && !errorMessage.includes('huyết áp') && 
          !errorMessage.includes('nhiệt độ') && !errorMessage.includes('nhịp tim') && 
          !errorMessage.includes('oxy') && !errorMessage.includes('thở') && 
          !errorMessage.includes('cân nặng') && !errorMessage.includes('người cao tuổi')) {
        if (data.statusCode === 400) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập.';
        } else if (data.statusCode === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (data.statusCode === 403) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
        } else if (data.statusCode === 500) {
          errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau.';
        }
      }
    } else if (error.message) {
      // Handle validation errors from backend
      if ((error as any).isValidationError && (error as any).field) {
        const field = (error as any).field;
        
        if (field === 'multiple' || field === 'general') {
          // Handle multiple field errors or general validation error
          const errorMessage = error.message;
          if (errorMessage.includes(';')) {
            // Multiple errors separated by semicolon
            const errors = errorMessage.split(';').map(e => e.trim());
            errors.forEach(err => {
              // Try to map field names from Vietnamese to frontend field names
              if (err.includes('Người cao tuổi:')) {
                fieldErrors.residentId = err.replace('Người cao tuổi:', '').trim();
              } else if (err.includes('Nhiệt độ:')) {
                fieldErrors.temperature = err.replace('Nhiệt độ:', '').trim();
              } else if (err.includes('Nhịp tim:')) {
                fieldErrors.heartRate = err.replace('Nhịp tim:', '').trim();
              } else if (err.includes('Huyết áp:')) {
                fieldErrors.bloodPressure = err.replace('Huyết áp:', '').trim();
              } else if (err.includes('Nồng độ oxy:')) {
                fieldErrors.oxygenSaturation = err.replace('Nồng độ oxy:', '').trim();
              } else if (err.includes('Nhịp thở:')) {
                fieldErrors.respiratoryRate = err.replace('Nhịp thở:', '').trim();
              } else if (err.includes('Cân nặng:')) {
                fieldErrors.weight = err.replace('Cân nặng:', '').trim();
              } else if (err.includes('Ghi chú:')) {
                fieldErrors.notes = err.replace('Ghi chú:', '').trim();
              } else {
                // If can't map to specific field, add to general
                if (!fieldErrors.general) fieldErrors.general = '';
                fieldErrors.general += (fieldErrors.general ? '; ' : '') + err;
              }
            });
          } else {
            // Single general error
            fieldErrors.general = errorMessage;
          }
        } else {
          // Single field error
          const fieldMap: { [key: string]: string } = {
            'blood_pressure': 'bloodPressure',
            'heart_rate': 'heartRate',
            'temperature': 'temperature',
            'oxygen_level': 'oxygenSaturation',
            'respiratory_rate': 'respiratoryRate',
            'weight': 'weight',
            'resident_id': 'residentId'
          };
          const frontendField = fieldMap[field] || field;
          fieldErrors[frontendField] = error.message;
        }
      } else {
        // Handle specific error messages from error.message
        if (error.message.includes('blood pressure') || error.message.includes('huyết áp')) {
          fieldErrors.bloodPressure = error.message;
        } else if (error.message.includes('temperature') || error.message.includes('nhiệt độ')) {
          fieldErrors.temperature = error.message;
        } else if (error.message.includes('heart rate') || error.message.includes('nhịp tim')) {
          fieldErrors.heartRate = error.message;
        } else if (error.message.includes('oxygen') || error.message.includes('oxy')) {
          fieldErrors.oxygenSaturation = error.message;
        } else if (error.message.includes('respiratory') || error.message.includes('thở')) {
          fieldErrors.respiratoryRate = error.message;
        } else if (error.message.includes('weight') || error.message.includes('cân nặng')) {
          fieldErrors.weight = error.message;
        } else if (error.message.includes('resident') || error.message.includes('người cao tuổi')) {
          fieldErrors.residentId = error.message;
        } else {
          errorMessage = error.message;
        }
      }
    }

    console.log('Parsed error message:', errorMessage);
    console.log('Parsed field errors:', fieldErrors);

    return { errorMessage, fieldErrors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    console.log('=== VALIDATION DEBUG ===');
    console.log('Form data:', formData);
    const errors = validateForm(formData);
    console.log('Validation errors:', errors);
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors found:', errors);
      setValidationErrors(errors);
      return;
    }

    // Check required fields
    const requiredErrors: { [key: string]: string } = {};
    
    if (!formData.residentId) {
      requiredErrors.residentId = 'Vui lòng chọn người cao tuổi';
    }
    
    if (!formData.bloodPressure || formData.bloodPressure.trim() === '') {
      requiredErrors.bloodPressure = 'Vui lòng nhập huyết áp';
    }
    
    if (formData.heartRate === undefined || formData.heartRate === null || isNaN(Number(formData.heartRate))) {
      requiredErrors.heartRate = 'Vui lòng nhập nhịp tim';
    }
    
    if (formData.temperature === undefined || formData.temperature === null || isNaN(Number(formData.temperature))) {
      requiredErrors.temperature = 'Vui lòng nhập nhiệt độ';
    }
    
    if (formData.oxygenSaturation === undefined || formData.oxygenSaturation === null || isNaN(Number(formData.oxygenSaturation))) {
      requiredErrors.oxygenSaturation = 'Vui lòng nhập nồng độ oxy';
    }
    
    // Make these fields required
    if (formData.respiratoryRate === undefined || formData.respiratoryRate === null || isNaN(Number(formData.respiratoryRate))) {
      requiredErrors.respiratoryRate = 'Vui lòng nhập nhịp thở';
    } else {
      const rr = Number(formData.respiratoryRate);
      if (rr < 5 || rr > 60) {
        requiredErrors.respiratoryRate = 'Nhịp thở phải từ 5 đến 60 lần/phút';
      }
    }
    
    if (formData.weight === undefined || formData.weight === null || isNaN(Number(formData.weight))) {
      requiredErrors.weight = 'Vui lòng nhập cân nặng';
    } else {
      const weight = Number(formData.weight);
      if (weight < 20 || weight > 200) {
        requiredErrors.weight = 'Cân nặng phải từ 20kg đến 200kg';
      }
    }
    
    if (!formData.notes || formData.notes.trim() === '') {
      requiredErrors.notes = 'Vui lòng nhập ghi chú';
    } else if (formData.notes.trim().length > 500) {
      requiredErrors.notes = 'Ghi chú không được quá 500 ký tự';
    }
    
    if (Object.keys(requiredErrors).length > 0) {
      console.log('Required errors found:', requiredErrors);
      setValidationErrors(requiredErrors);
      return;
    }
    // if (!formData.bloodPressure) {
    //   setValidationErrors({ bloodPressure: 'Vui lòng nhập huyết áp' });
    //   return;
    // }

    setIsSubmitting(true);
    setValidationErrors({});
    try {
      console.log('=== SUBMIT DEBUG ===');
      console.log('Form data:', formData);
      console.log('Form data residentId:', formData.residentId);
      console.log('Form data type:', typeof formData.residentId);
      
      const apiData = transformToApiFormat(formData);
      console.log('API data:', apiData);
      console.log('API data resident_id:', apiData.resident_id);
      
      await vitalSignsAPI.create(apiData);
      
      setSubmitSuccess(true);
      
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
      console.log('=== CATCH ERROR ===');
      console.log('Error caught:', error);
      
      // Parse the error to get detailed information
      const { errorMessage, fieldErrors } = parseApiError(error);
      console.log('After parsing - errorMessage:', errorMessage);
      console.log('After parsing - fieldErrors:', fieldErrors);
      
      if (Object.keys(fieldErrors).length > 0) {
        console.log('Setting field errors inline:', fieldErrors);
        setValidationErrors(fieldErrors);
      } else {
        console.log('Setting general error in modal:', errorMessage);
        // Show modal for general errors only
        setModalErrors({ general: errorMessage });
        setShowErrorModal(true);
      }
      setSubmitSuccess(false);
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
      <ErrorModal 
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={modalErrors}
      />
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
            border-color: #ef4444 !important;
            border-width: 2px !important;
            background-color: #fef2f2 !important;
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
            border-color: #ef4444 !important;
            border-width: 2px !important;
            background-color: #fef2f2 !important;
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
          
          .form-textarea.error {
            border-color: #ef4444 !important;
            border-width: 2px !important;
            background-color: #fef2f2 !important;
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
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                      Nhịp thở (lần/phút) *
                    </label>
                                      <input
                    type="number"
                    value={formData.respiratoryRate || ''}
                    onChange={(e) => handleInputChange('respiratoryRate', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="12-20"
                    min="5"
                    max="60"
                    className={`form-input ${validationErrors.respiratoryRate ? 'error' : ''}`}
                  />
                  {validationErrors.respiratoryRate && (
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                      Cân nặng (kg) *
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
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
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
                    Ghi chú *
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Ghi chú thêm về tình trạng sức khỏe..."
                    className={`form-textarea ${validationErrors.notes ? 'error' : ''}`}
                    rows={4}
                  />
                  {validationErrors.notes && (
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.5rem', 
                      fontWeight: 500,
                      marginBottom: 0
                    }}>
                      {validationErrors.notes}
                    </p>
                  )}
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