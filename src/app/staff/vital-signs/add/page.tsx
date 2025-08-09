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

import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI, bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Error Modal Component
const ErrorModal = ({ isOpen, onClose, errors }: { 
  isOpen: boolean; 
  onClose: () => void; 
  errors: { [key: string]: string } 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-11/12 shadow-2xl border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-red-100 rounded-full p-3 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-800 m-0">
            Có lỗi xảy ra
          </h2>
        </div>
        
        <div className="mb-6">
          {Object.keys(errors).length > 0 && (
            <>
              <p className="text-gray-600 mb-4">
                Vui lòng kiểm tra và sửa các lỗi sau:
              </p>
              <ul className="space-y-2">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field} className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <p className="font-semibold mb-2 m-0">
                Lỗi hệ thống:
              </p>
              <p className="m-0">
                {errors.general}
              </p>
              <p className="text-xs text-gray-500 italic mt-2 mb-0">
                Nếu lỗi vẫn tiếp tục, vui lòng liên hệ admin hoặc thử lại sau.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-red-600"
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
          const data = await staffAssignmentsAPI.getMyAssignments();
          const assignmentsData = Array.isArray(data) ? data : [];
          
          mapped = assignmentsData
            .filter((assignment: any) => assignment.status === 'active')
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
          const data = await residentAPI.getAll();
          const residentsData = Array.isArray(data) ? data : [];
          
          mapped = residentsData.map((resident: any) => ({
            id: resident._id,
            name: resident.full_name || '',
            avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
          }));
        }
        
        setResidents(mapped);
        
        // Get room numbers for each resident
        mapped.forEach(async (resident: any) => {
          try {
            const assignments = await bedAssignmentsAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
            const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
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

    if (error.response?.data) {
      const data = error.response.data;
      
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
      setValidationErrors(requiredErrors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});
    try {
      const apiData = transformToApiFormat(formData);
      
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
      // Parse the error to get detailed information
      const { errorMessage, fieldErrors } = parseApiError(error);
      
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
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
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/staff/vital-signs')}
            className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer mb-4 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 flex items-center justify-center shadow-lg">
                <HeartIconSolid className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-2">
                  Thêm Chỉ Số Sức Khỏe Mới
                </h1>
                <p className="text-gray-500">
                  Ghi nhận các thông số sinh lý quan trọng của người cao tuổi
                </p>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="bg-gradient-to-r from-green-100 to-green-200 border border-green-500 rounded-2xl p-6 mb-8 flex items-center gap-4 shadow-lg">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-green-800 font-semibold mb-1">
                  Thêm chỉ số sức khỏe thành công!
                </h3>
                <p className="text-green-700">
                  Dữ liệu đã được lưu vào hệ thống. Đang chuyển về trang danh sách...
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Resident Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Người cao tuổi *
                  </label>
                  <select
                    value={formData.residentId}
                    onChange={(e) => handleInputChange('residentId', e.target.value)}
                    className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                      validationErrors.residentId ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                    }`}
                    disabled={residents.length === 0}
                  >
                    <option value="">
                      {residents.length === 0 
                        ? (user?.role === 'staff' 
                            ? 'Chưa được phân công người cao tuổi nào' 
                            : 'Chưa có người cao tuổi nào trong hệ thống')
                        : 'Chọn người cao tuổi'
                      }
                    </option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Phòng {roomNumbers[resident.id] || 'Chưa hoàn tất đăng kí'}
                      </option>
                    ))}
                  </select>
                  {validationErrors.residentId && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {validationErrors.residentId}
                    </p>
                  )}
                </div>

                {/* Vital Signs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Blood Pressure */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <HeartIconSolid className="w-4 h-4 inline mr-2 text-red-600" />
                      Huyết áp (mmHg) *
                    </label>
                    <input
                      type="text"
                      value={formData.bloodPressure}
                      onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                      placeholder="Ví dụ: 120/80"
                      className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                        validationErrors.bloodPressure ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                      }`}
                    />
                    {validationErrors.bloodPressure && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {validationErrors.bloodPressure}
                      </p>
                    )}
                  </div>

                  {/* Heart Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <HeartIconSolid className="w-4 h-4 inline mr-2 text-green-600" />
                      Nhịp tim (bpm) *
                    </label>
                    <input
                      type="number"
                      value={formData.heartRate || ''}
                      onChange={(e) => handleInputChange('heartRate', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="60-100"
                      min="30"
                      max="200"
                      className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                        validationErrors.heartRate ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                      }`}
                    />
                    {validationErrors.heartRate && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {validationErrors.heartRate}
                      </p>
                    )}
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <FireIcon className="w-4 h-4 inline mr-2 text-orange-600" />
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
                      className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                        validationErrors.temperature ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                      }`}
                    />
                    {validationErrors.temperature && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {validationErrors.temperature}
                      </p>
                    )}
                  </div>

                  {/* Oxygen Saturation */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <CloudIcon className="w-4 h-4 inline mr-2 text-blue-600" />
                      SpO2 (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.oxygenSaturation || ''}
                      onChange={(e) => handleInputChange('oxygenSaturation', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="95-100"
                      min="70"
                      max="100"
                      className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                        validationErrors.oxygenSaturation ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                      }`}
                    />
                    {validationErrors.oxygenSaturation && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {validationErrors.oxygenSaturation}
                      </p>
                    )}
                  </div>

                  {/* Respiratory Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <HandRaisedIcon className="w-4 h-4 inline mr-2 text-green-600" />
                      Nhịp thở (lần/phút) *
                    </label>
                    <input
                      type="number"
                      value={formData.respiratoryRate || ''}
                      onChange={(e) => handleInputChange('respiratoryRate', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="12-20"
                      min="5"
                      max="60"
                      className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                        validationErrors.respiratoryRate ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                      }`}
                    />
                    {validationErrors.respiratoryRate && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {validationErrors.respiratoryRate}
                      </p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <ScaleIcon className="w-4 h-4 inline mr-2 text-purple-600" />
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
                      className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 ${
                        validationErrors.weight ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                      }`}
                    />
                    {validationErrors.weight && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        {validationErrors.weight}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <BeakerIcon className="w-4 h-4 inline mr-2 text-green-600" />
                    Ghi chú *
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Ghi chú thêm về tình trạng sức khỏe..."
                    className={`w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 resize-vertical min-h-[100px] ${
                      validationErrors.notes ? 'border-red-500 bg-red-50 ring-4 ring-red-100' : ''
                    }`}
                    rows={4}
                  />
                  {validationErrors.notes && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {validationErrors.notes}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => router.push('/staff/vital-signs')}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    className={`px-6 py-3 text-white border-none rounded-lg text-sm font-semibold transition-all ${
                      isSubmitting || submitSuccess
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:scale-105'
                    }`}
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