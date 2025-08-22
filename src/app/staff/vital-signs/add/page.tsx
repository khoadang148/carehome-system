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

// Success Modal Component
const SuccessModal = ({ isOpen, onClose }: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-11/12 shadow-2xl border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-green-100 rounded-full p-3 flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-green-800 m-0">
            Thêm chỉ số sức khỏe thành công!
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Dữ liệu chỉ số sinh hiệu đã được lưu thành công vào hệ thống.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">
                Dữ liệu đã được lưu an toàn
              </p>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">
                Có thể xem trong danh sách chỉ số sức khỏe
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">
                Hệ thống sẽ chuyển về trang danh sách
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-green-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-green-600 hover:shadow-lg"
          >
            Xem danh sách
          </button>
        </div>
      </div>
    </div>
  );
};

// Medical Warning Component
const MedicalWarning = ({ vitalSigns }: { vitalSigns: VitalSigns }) => {
  const warnings: string[] = [];
  
  // Check for medical warnings
  if (vitalSigns.temperature && vitalSigns.temperature > 37.8) {
    warnings.push('⚠️ Nhiệt độ cao (>37.8°C) - cần theo dõi sát');
  }
  
  if (vitalSigns.heartRate) {
    const hr = Number(vitalSigns.heartRate);
    if (hr < 60 || hr > 100) {
      warnings.push('⚠️ Nhịp tim bất thường - cần theo dõi');
    }
  }
  
  if (vitalSigns.bloodPressure) {
    const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
    if (systolic >= 140 || diastolic >= 90) {
      warnings.push('⚠️ Huyết áp cao - cần theo dõi');
    }
    if (systolic < 100 || diastolic < 60) {
      warnings.push('⚠️ Huyết áp thấp - cần theo dõi');
    }
  }
  
  if (vitalSigns.respiratoryRate) {
    const rr = Number(vitalSigns.respiratoryRate);
    if (rr < 16 || rr > 20) {
      warnings.push('⚠️ Nhịp thở bất thường - cần theo dõi');
    }
  }
  
  if (vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 95) {
    warnings.push('⚠️ Nồng độ oxy thấp - cần theo dõi sát');
  }
  
  if (vitalSigns.weight) {
    const weight = Number(vitalSigns.weight);
    if (weight < 40 || weight > 120) {
      warnings.push('⚠️ Cân nặng bất thường - cần đánh giá dinh dưỡng');
    }
  }
  
  if (warnings.length === 0) return null;
  
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-yellow-100 rounded-full p-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
        </div>
        <h3 className="text-yellow-800 font-semibold text-lg">
          Cảnh báo Y khoa
        </h3>
      </div>
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <p key={index} className="text-yellow-700 text-sm font-medium">
            {warning}
          </p>
        ))}
      </div>
      <p className="text-yellow-600 text-xs italic mt-3">
        * Các giá trị này vẫn có thể được lưu nhưng cần theo dõi đặc biệt
      </p>
    </div>
  );
};

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  // Validation based on medical standards for elderly patients
  const validateForm = (data: VitalSigns) => {
    const errors: { [key: string]: string } = {};
    
    // Required fields
    if (!data.residentId) {
      errors.residentId = 'Vui lòng chọn người cao tuổi';
    }
    
    // Temperature validation - Medical standard for elderly (35.0-40.0°C)
    if (data.temperature !== undefined && data.temperature !== null && !isNaN(Number(data.temperature))) {
      const temp = Number(data.temperature);
      if (temp < 35.0 || temp > 40.0) {
        errors.temperature = 'Nhiệt độ phải từ 35.0°C đến 40.0°C (tiêu chuẩn y khoa)';
      }
      // Warning for fever in elderly (>37.8°C)
      if (temp > 37.8) {
        console.warn('Nhiệt độ cao - cần theo dõi sát');
      }
    }
    
    // Heart rate validation - Medical standard for elderly (50-120 bpm)
    if (data.heartRate !== undefined && data.heartRate !== null && !isNaN(Number(data.heartRate))) {
      const hr = Number(data.heartRate);
      if (hr < 50 || hr > 120) {
        errors.heartRate = 'Nhịp tim phải từ 50 đến 120 bpm (tiêu chuẩn y khoa cho người cao tuổi)';
      }
      // Warning for abnormal heart rates
      if (hr < 60 || hr > 100) {
        console.warn('Nhịp tim bất thường - cần theo dõi');
      }
    }
    
    // Blood pressure validation - Medical standard format and ranges
    if (data.bloodPressure && data.bloodPressure.trim() !== '') {
      // Format validation: XXX/YYY or XX/YY
      if (!/^[0-9]{2,3}\/[0-9]{2,3}$/.test(data.bloodPressure)) {
        errors.bloodPressure = 'Huyết áp phải đúng định dạng (ví dụ: 120/80)';
      } else {
        // Range validation for elderly
        const [systolic, diastolic] = data.bloodPressure.split('/').map(Number);
        
        // Systolic pressure validation (90-200 mmHg for elderly)
        if (systolic < 90 || systolic > 200) {
          errors.bloodPressure = 'Huyết áp tâm thu phải từ 90-200 mmHg';
        }
        
        // Diastolic pressure validation (50-120 mmHg for elderly)
        if (diastolic < 50 || diastolic > 120) {
          errors.bloodPressure = 'Huyết áp tâm trương phải từ 50-120 mmHg';
        }
        
        // Systolic should be higher than diastolic
        if (systolic <= diastolic) {
          errors.bloodPressure = 'Huyết áp tâm thu phải cao hơn tâm trương';
        }
        
        // Warning for hypertension in elderly
        if (systolic >= 140 || diastolic >= 90) {
          console.warn('Huyết áp cao - cần theo dõi');
        }
        
        // Warning for hypotension in elderly
        if (systolic < 100 || diastolic < 60) {
          console.warn('Huyết áp thấp - cần theo dõi');
        }
      }
    }
    
    // Respiratory rate validation - Medical standard for elderly (12-25 breaths/min)
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      const rr = Number(data.respiratoryRate);
      if (rr < 12 || rr > 25) {
        errors.respiratoryRate = 'Nhịp thở phải từ 12 đến 25 lần/phút (tiêu chuẩn y khoa cho người cao tuổi)';
      }
      // Warning for abnormal respiratory rates
      if (rr < 16 || rr > 20) {
        console.warn('Nhịp thở bất thường - cần theo dõi');
      }
    }
    
    // Oxygen saturation validation - Medical standard (95-100% normal, 90-94% acceptable for elderly)
    if (data.oxygenSaturation !== undefined && data.oxygenSaturation !== null && !isNaN(Number(data.oxygenSaturation))) {
      const o2 = Number(data.oxygenSaturation);
      if (o2 < 90 || o2 > 100) {
        errors.oxygenSaturation = 'Nồng độ oxy phải từ 90% đến 100% (tiêu chuẩn y khoa)';
      }
      // Check for reasonable decimal precision (max 1 decimal place)
      const decimalPlaces = o2.toString().split('.')[1]?.length || 0;
      if (decimalPlaces > 1) {
        errors.oxygenSaturation = 'Nồng độ oxy chỉ được nhập tối đa 1 chữ số thập phân (ví dụ: 98.5)';
      }
      // Warning for low oxygen saturation
      if (o2 < 95) {
        console.warn('Nồng độ oxy thấp - cần theo dõi sát');
      }
    }
    
    // Weight validation - Realistic range for elderly (30-150 kg)
    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      const weight = Number(data.weight);
      if (weight < 30 || weight > 150) {
        errors.weight = 'Cân nặng phải từ 30kg đến 150kg (phù hợp với người cao tuổi)';
      }
      // Warning for extreme weights
      if (weight < 40 || weight > 120) {
        console.warn('Cân nặng bất thường - cần đánh giá dinh dưỡng');
      }
    }
    
    // Notes validation - Medical documentation standards
    if (data.notes && data.notes.trim() !== '') {
      if (data.notes.trim().length > 1000) {
        errors.notes = 'Ghi chú không được quá 1000 ký tự (tiêu chuẩn ghi chép y khoa)';
      }
      if (data.notes.trim().length < 5) {
        errors.notes = 'Ghi chú phải có ít nhất 5 ký tự để mô tả đầy đủ';
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
        // Check if it's a field-specific error and translate to Vietnamese
        if (data.error.includes('blood pressure') || data.error.includes('huyết áp')) {
          fieldErrors.bloodPressure = data.error.includes('blood pressure') ? 
            'Huyết áp không hợp lệ. Vui lòng kiểm tra lại định dạng (ví dụ: 120/80)' : data.error;
        } else if (data.error.includes('temperature') || data.error.includes('nhiệt độ')) {
          fieldErrors.temperature = data.error.includes('temperature') ? 
            'Nhiệt độ không hợp lệ. Vui lòng nhập giá trị từ 35.0°C đến 40.0°C' : data.error;
        } else if (data.error.includes('heart rate') || data.error.includes('nhịp tim')) {
          fieldErrors.heartRate = data.error.includes('heart rate') ? 
            'Nhịp tim không hợp lệ. Vui lòng nhập giá trị từ 50 đến 120 bpm' : data.error;
        } else if (data.error.includes('oxygen') || data.error.includes('oxy')) {
          fieldErrors.oxygenSaturation = data.error.includes('oxygen') ? 
            'Nồng độ oxy không hợp lệ. Vui lòng nhập giá trị từ 90% đến 100%' : data.error;
        } else if (data.error.includes('respiratory') || data.error.includes('thở')) {
          fieldErrors.respiratoryRate = data.error.includes('respiratory') ? 
            'Nhịp thở không hợp lệ. Vui lòng nhập giá trị từ 12 đến 25 lần/phút' : data.error;
        } else if (data.error.includes('weight') || data.error.includes('cân nặng')) {
          fieldErrors.weight = data.error.includes('weight') ? 
            'Cân nặng không hợp lệ. Vui lòng nhập giá trị từ 30kg đến 150kg' : data.error;
        } else if (data.error.includes('resident') || data.error.includes('người cao tuổi')) {
          fieldErrors.residentId = data.error.includes('resident') ? 
            'Vui lòng chọn người cao tuổi' : data.error;
        } else {
          // Translate common English error messages to Vietnamese
          const translatedError = data.error
            .replace('Please enter a valid value', 'Vui lòng nhập giá trị hợp lệ')
            .replace('The two nearest valid values are', 'Hai giá trị hợp lệ gần nhất là')
            .replace('Please enter a valid value. The two nearest valid values are', 'Vui lòng nhập giá trị hợp lệ. Hai giá trị hợp lệ gần nhất là')
            .replace('Invalid input', 'Dữ liệu đầu vào không hợp lệ')
            .replace('Required field', 'Trường bắt buộc')
            .replace('must be a number', 'phải là số')
            .replace('must be greater than', 'phải lớn hơn')
            .replace('must be less than', 'phải nhỏ hơn')
            .replace('must be between', 'phải nằm trong khoảng')
            .replace('must be an integer', 'phải là số nguyên')
            .replace('decimal places', 'chữ số thập phân')
            .replace('maximum', 'tối đa')
            .replace('minimum', 'tối thiểu')
            .replace('value', 'giá trị')
            .replace('values', 'giá trị');
          errorMessage = translatedError;
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
        // Handle specific error messages from error.message and translate to Vietnamese
        if (error.message.includes('blood pressure') || error.message.includes('huyết áp')) {
          fieldErrors.bloodPressure = error.message.includes('blood pressure') ? 
            'Huyết áp không hợp lệ. Vui lòng kiểm tra lại định dạng (ví dụ: 120/80)' : error.message;
        } else if (error.message.includes('temperature') || error.message.includes('nhiệt độ')) {
          fieldErrors.temperature = error.message.includes('temperature') ? 
            'Nhiệt độ không hợp lệ. Vui lòng nhập giá trị từ 35.0°C đến 40.0°C' : error.message;
        } else if (error.message.includes('heart rate') || error.message.includes('nhịp tim')) {
          fieldErrors.heartRate = error.message.includes('heart rate') ? 
            'Nhịp tim không hợp lệ. Vui lòng nhập giá trị từ 50 đến 120 bpm' : error.message;
        } else if (error.message.includes('oxygen') || error.message.includes('oxy')) {
          fieldErrors.oxygenSaturation = error.message.includes('oxygen') ? 
            'Nồng độ oxy không hợp lệ. Vui lòng nhập giá trị từ 90% đến 100%' : error.message;
        } else if (error.message.includes('respiratory') || error.message.includes('thở')) {
          fieldErrors.respiratoryRate = error.message.includes('respiratory') ? 
            'Nhịp thở không hợp lệ. Vui lòng nhập giá trị từ 12 đến 25 lần/phút' : error.message;
        } else if (error.message.includes('weight') || error.message.includes('cân nặng')) {
          fieldErrors.weight = error.message.includes('weight') ? 
            'Cân nặng không hợp lệ. Vui lòng nhập giá trị từ 30kg đến 150kg' : error.message;
        } else if (error.message.includes('resident') || error.message.includes('người cao tuổi')) {
          fieldErrors.residentId = error.message.includes('resident') ? 
            'Vui lòng chọn người cao tuổi' : error.message;
        } else {
          // Translate common English error messages to Vietnamese
          const translatedError = error.message
            .replace('Please enter a valid value', 'Vui lòng nhập giá trị hợp lệ')
            .replace('The two nearest valid values are', 'Hai giá trị hợp lệ gần nhất là')
            .replace('Please enter a valid value. The two nearest valid values are', 'Vui lòng nhập giá trị hợp lệ. Hai giá trị hợp lệ gần nhất là')
            .replace('Invalid input', 'Dữ liệu đầu vào không hợp lệ')
            .replace('Required field', 'Trường bắt buộc')
            .replace('must be a number', 'phải là số')
            .replace('must be greater than', 'phải lớn hơn')
            .replace('must be less than', 'phải nhỏ hơn')
            .replace('must be between', 'phải nằm trong khoảng')
            .replace('must be an integer', 'phải là số nguyên')
            .replace('decimal places', 'chữ số thập phân')
            .replace('maximum', 'tối đa')
            .replace('minimum', 'tối thiểu')
            .replace('value', 'giá trị')
            .replace('values', 'giá trị');
          errorMessage = translatedError;
        }
      }
    }

    return { errorMessage, fieldErrors };
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSubmitSuccess(false);
    // Redirect back to vital signs page
    router.push('/staff/vital-signs');
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
    
    // Make these fields required with medical standards
    if (formData.respiratoryRate === undefined || formData.respiratoryRate === null || isNaN(Number(formData.respiratoryRate))) {
      requiredErrors.respiratoryRate = 'Vui lòng nhập nhịp thở';
    } else {
      const rr = Number(formData.respiratoryRate);
      if (rr < 12 || rr > 25) {
        requiredErrors.respiratoryRate = 'Nhịp thở phải từ 12 đến 25 lần/phút (tiêu chuẩn y khoa cho người cao tuổi)';
      }
    }
    
    if (formData.weight === undefined || formData.weight === null || isNaN(Number(formData.weight))) {
      requiredErrors.weight = 'Vui lòng nhập cân nặng';
    } else {
      const weight = Number(formData.weight);
      if (weight < 30 || weight > 150) {
        requiredErrors.weight = 'Cân nặng phải từ 30kg đến 150kg (phù hợp với người cao tuổi)';
      }
    }
    
    if (!formData.notes || formData.notes.trim() === '') {
      requiredErrors.notes = 'Vui lòng nhập ghi chú';
    } else if (formData.notes.trim().length > 1000) {
      requiredErrors.notes = 'Ghi chú không được quá 1000 ký tự (tiêu chuẩn ghi chép y khoa)';
    } else if (formData.notes.trim().length < 5) {
      requiredErrors.notes = 'Ghi chú phải có ít nhất 5 ký tự để mô tả đầy đủ';
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
      setShowSuccessModal(true);
      
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
      
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
        <div className="max-w-4xl mx-auto">
          

          {/* Header */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex items-center gap-4">
              <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại "
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
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



          {/* Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {/* Medical Warnings */}
            <MedicalWarning vitalSigns={formData} />
            
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
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4" />
                    Hướng dẫn đo chỉ số sinh hiệu
                  </h3>
                  <div className="text-blue-700 text-sm space-y-1">
                    <p>• <strong>Nhiệt độ:</strong> Đo ở nách hoặc miệng, bình thường 36.5-37.5°C</p>
                    <p>• <strong>Nhịp tim:</strong> Đếm trong 1 phút, bình thường 60-100 bpm</p>
                    <p>• <strong>Huyết áp:</strong> Đo ở tư thế ngồi, nghỉ 5 phút trước khi đo</p>
                    <p>• <strong>SpO2:</strong> Đo bằng máy đo oxy, bình thường ≥95% (có thể nhập số thập phân)</p>
                    <p>• <strong>Nhịp thở:</strong> Đếm trong 1 phút, bình thường 16-20 lần/phút</p>
                    <p>• <strong>Cân nặng:</strong> Đo bằng cân điện tử, ghi chính xác đến 0.1kg</p>
                  </div>
                </div>
                
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
                      placeholder="ví dụ: 80"
                      min="50"
                      max="120"
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
                      placeholder="ví dụ: 36"
                      min="35.0"
                      max="40.0"
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
                      placeholder="95-100 (bình thường)"
                      min="90"
                      max="100"
                      step="0.1"
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
                      placeholder="ví dụ: 16"
                      min="12"
                      max="25"
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
                      placeholder="ví dụ: 50"
                      min="30"
                      max="150"
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
                    disabled={isSubmitting}
                    className={`px-6 py-3 text-white border-none rounded-lg text-sm font-semibold transition-all ${
                      isSubmitting
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu chỉ số'}
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