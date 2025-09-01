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
  HandRaisedIcon,
  PencilIcon
} from '@heroicons/react/24/solid';

import { vitalSignsAPI, staffAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI, bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
            Cập nhật chỉ số sức khỏe thành công!
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Dữ liệu chỉ số sinh hiệu đã được cập nhật thành công vào hệ thống.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-medium">
                Dữ liệu đã được cập nhật an toàn
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

const ErrorModal = ({ 
  isOpen, 
  onClose, 
  errors 
}: { 
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
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-800 m-0">
            Có lỗi xảy ra!
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Không thể cập nhật chỉ số sức khỏe. Vui lòng kiểm tra lại thông tin:
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
            {Object.entries(errors).map(([field, message]) => (
              <div key={field} className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">
                  <strong>{getFieldLabel(field)}:</strong> {message}
                </p>
              </div>
            ))}
            {Object.keys(errors).length === 0 && (
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                <p className="text-red-700 text-sm">
                  Có lỗi không xác định xảy ra. Vui lòng thử lại.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 <strong>Gợi ý:</strong> Kiểm tra lại các thông tin bắt buộc và định dạng dữ liệu.
              <br />
              Nếu lỗi vẫn tiếp tục, vui lòng liên hệ admin hoặc thử lại sau.
            </p>
          </div>
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

const MedicalWarning = ({ vitalSigns }: { vitalSigns: VitalSigns }) => {
  const warnings: string[] = [];
  
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
  }
  
  if (vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 95) {
    warnings.push('⚠️ Nồng độ oxy thấp (<95%) - cần theo dõi');
  }
  
  if (warnings.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
        <h3 className="text-sm font-semibold text-yellow-800">
          Cảnh báo y khoa
        </h3>
      </div>
      <ul className="space-y-1">
        {warnings.map((warning, index) => (
          <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
            <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
            {warning}
          </li>
        ))}
      </ul>
    </div>
  );
};

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

export default function EditVitalSignsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [vitalSignId, setVitalSignId] = useState<string>('');
  const [residents, setResidents] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalErrors, setModalErrors] = useState<{ [key: string]: string }>({});
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Function to check if form data has changed from original
  const checkForChanges = (currentData: VitalSigns) => {
    if (!originalData) return false;
    
    return (
      currentData.bloodPressure !== (originalData.blood_pressure || originalData.bloodPressure || '') ||
      currentData.heartRate !== (originalData.heart_rate || originalData.heartRate) ||
      currentData.temperature !== originalData.temperature ||
      currentData.oxygenSaturation !== (originalData.oxygen_level || originalData.oxygen_saturation || originalData.oxygenSaturation) ||
      currentData.respiratoryRate !== (originalData.respiratory_rate || originalData.respiratoryRate) ||
      currentData.weight !== originalData.weight ||
      currentData.notes !== (originalData.notes || '')
    );
  };

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

  useEffect(() => {
    const getVitalSignId = async () => {
      const { id } = await params;
      setVitalSignId(id);
    };
    getVitalSignId();
  }, [params]);

  useEffect(() => {
    const fetchVitalSign = async () => {
      if (!vitalSignId) return;
      
      setLoadingData(true);
      try {
        const vitalSign = await vitalSignsAPI.getById(vitalSignId);
        setOriginalData(vitalSign);
        
        setFormData({
          residentId: vitalSign.resident_id || '',
          bloodPressure: vitalSign.blood_pressure || vitalSign.bloodPressure || '',
          heartRate: vitalSign.heart_rate || vitalSign.heartRate,
          temperature: vitalSign.temperature,
          oxygenSaturation: vitalSign.oxygen_level || vitalSign.oxygen_saturation || vitalSign.oxygenSaturation,
          respiratoryRate: vitalSign.respiratory_rate || vitalSign.respiratoryRate,
          weight: vitalSign.weight,
          notes: vitalSign.notes || '',
        });
      } catch (error) {
        setModalErrors({ general: 'Không thể tải dữ liệu chỉ số sức khỏe' });
        setShowErrorModal(true);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchVitalSign();
  }, [vitalSignId]);

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
        setResidents([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    if (user) {
      fetchResidents();
    }
  }, [user]);

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

  const validateForm = (data: VitalSigns) => {
    const errors: { [key: string]: string } = {};
    
    // Remove residentId validation since it's not changeable
    
    if (data.temperature !== undefined && data.temperature !== null && !isNaN(Number(data.temperature))) {
      const temp = Number(data.temperature);
      if (temp < 35.0 || temp > 40.0) {
        errors.temperature = 'Nhiệt độ phải từ 35.0°C đến 40.0°C (tiêu chuẩn y khoa)';
      }
    }
    
    if (data.heartRate !== undefined && data.heartRate !== null && !isNaN(Number(data.heartRate))) {
      const hr = Number(data.heartRate);
      if (hr < 50 || hr > 120) {
        errors.heartRate = 'Nhịp tim phải từ 50 đến 120 bpm (tiêu chuẩn y khoa cho người cao tuổi)';
      }
    }
    
    if (data.bloodPressure && data.bloodPressure.trim() !== '') {
      if (!/^[0-9]{2,3}\/[0-9]{2,3}$/.test(data.bloodPressure)) {
        errors.bloodPressure = 'Huyết áp phải đúng định dạng (ví dụ: 120/80)';
      } else {
        const [systolic, diastolic] = data.bloodPressure.split('/').map(Number);
        
        if (systolic < 90 || systolic > 200) {
          errors.bloodPressure = 'Huyết áp tâm thu phải từ 90-200 mmHg';
        }
        
        if (diastolic < 50 || diastolic > 120) {
          errors.bloodPressure = 'Huyết áp tâm trương phải từ 50-120 mmHg';
        }
        
        if (systolic <= diastolic) {
          errors.bloodPressure = 'Huyết áp tâm thu phải lớn hơn tâm trương';
        }
      }
    }
    
    if (data.oxygenSaturation !== undefined && data.oxygenSaturation !== null && !isNaN(Number(data.oxygenSaturation))) {
      const spo2 = Number(data.oxygenSaturation);
      if (spo2 < 90 || spo2 > 100) {
        errors.oxygenSaturation = 'Nồng độ oxy phải từ 90% đến 100%';
      }
    }
    
    if (data.respiratoryRate !== undefined && data.respiratoryRate !== null && !isNaN(Number(data.respiratoryRate))) {
      const rr = Number(data.respiratoryRate);
      if (rr < 12 || rr > 25) {
        errors.respiratoryRate = 'Nhịp thở phải từ 12 đến 25 lần/phút (tiêu chuẩn y khoa cho người cao tuổi)';
      }
    }
    
    if (data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))) {
      const weight = Number(data.weight);
      if (weight < 20 || weight > 200) {
        errors.weight = 'Cân nặng phải từ 20 đến 200 kg';
      }
    }
    
    return errors;
  };

  const handleInputChange = (field: keyof VitalSigns, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Check if there are any changes
    setHasChanges(checkForChanges(newFormData));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      setShowErrorModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const apiData: any = {
        resident_id: formData.residentId,
        notes: formData.notes || '',
      };
      
      if (formData.temperature !== undefined && formData.temperature !== null && !isNaN(Number(formData.temperature))) {
        apiData.temperature = Number(formData.temperature);
      }
      if (formData.heartRate !== undefined && formData.heartRate !== null && !isNaN(Number(formData.heartRate))) {
        apiData.heart_rate = Number(formData.heartRate);
      }
      if (formData.bloodPressure && formData.bloodPressure.trim() !== '') {
        apiData.blood_pressure = formData.bloodPressure.trim();
      }
      if (formData.respiratoryRate !== undefined && formData.respiratoryRate !== null && !isNaN(Number(formData.respiratoryRate))) {
        apiData.respiratory_rate = Number(formData.respiratoryRate);
      }
      if (formData.oxygenSaturation !== undefined && formData.oxygenSaturation !== null && !isNaN(Number(formData.oxygenSaturation))) {
        apiData.oxygen_level = Number(formData.oxygenSaturation);
      }
      if (formData.weight !== undefined && formData.weight !== null && !isNaN(Number(formData.weight))) {
        apiData.weight = Number(formData.weight);
      }
      
      await vitalSignsAPI.update(vitalSignId, apiData);
      
      setSubmitSuccess(true);
      setShowSuccessModal(true);
      
      setTimeout(() => {
        router.push('/staff/vital-signs');
      }, 2000);
      
    } catch (error: any) {
      
      let errorMessage = 'Có lỗi xảy ra khi cập nhật chỉ số sức khỏe';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setModalErrors({ general: errorMessage });
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/staff/vital-signs');
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.back()}
                    className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                    title="Quay lại trang trước"
                  >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 flex items-center justify-center shadow-lg">
                    <PencilIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-2">
                      Chỉnh Sửa Chỉ Số Sức Khỏe
                    </h1>
                    <p className="text-gray-500">
                      Cập nhật thông tin chỉ số sinh hiệu của người cao tuổi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <MedicalWarning vitalSigns={formData} />
              
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-red-500" />
                  Người cao tuổi
                </label>
                <select
                  value={formData.residentId}
                  className="w-full p-4 border rounded-xl text-lg outline-none transition-all border-gray-300 bg-gray-100 cursor-not-allowed"
                  disabled={true}
                >
                  <option value={formData.residentId}>
                    {residents.find(r => r.id === formData.residentId)?.name || 'Đang tải...'} - Phòng {roomNumbers[formData.residentId] || 'Chưa hoàn tất đăng kí'}
                  </option>
                </select>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  Không thể thay đổi người cao tuổi khi chỉnh sửa chỉ số sức khỏe
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                    Huyết áp (mmHg)
                  </label>
                  <input
                    type="text"
                    value={formData.bloodPressure}
                    onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                    placeholder="120/80"
                    className={`w-full p-4 border rounded-xl text-lg outline-none transition-all focus:ring-4 ${
                      validationErrors.bloodPressure 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-100'
                    }`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.bloodPressure && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {validationErrors.bloodPressure}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <HeartIconSolid className="w-5 h-5 text-green-500" />
                    Nhịp tim (bpm)
                  </label>
                  <input
                    type="number"
                    value={formData.heartRate || ''}
                    onChange={(e) => handleInputChange('heartRate', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="72"
                    min="50"
                    max="120"
                    step="1"
                    className={`w-full p-4 border rounded-xl text-lg outline-none transition-all focus:ring-4 ${
                      validationErrors.heartRate 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-100'
                    }`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.heartRate && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {validationErrors.heartRate}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FireIcon className="w-5 h-5 text-orange-500" />
                    Nhiệt độ (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.temperature || ''}
                    onChange={(e) => handleInputChange('temperature', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="36.5"
                    min="35.0"
                    max="40.0"
                    step="0.1"
                    className={`w-full p-4 border rounded-xl text-lg outline-none transition-all focus:ring-4 ${
                      validationErrors.temperature 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-100'
                    }`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.temperature && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {validationErrors.temperature}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CloudIcon className="w-5 h-5 text-blue-500" />
                    Nồng độ oxy (%)
                  </label>
                  <input
                    type="number"
                    value={formData.oxygenSaturation || ''}
                    onChange={(e) => handleInputChange('oxygenSaturation', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="98"
                    min="90"
                    max="100"
                    step="1"
                    className={`w-full p-4 border rounded-xl text-lg outline-none transition-all focus:ring-4 ${
                      validationErrors.oxygenSaturation 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-100'
                    }`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.oxygenSaturation && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {validationErrors.oxygenSaturation}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <HandRaisedIcon className="w-5 h-5 text-purple-500" />
                    Nhịp thở (lần/phút)
                  </label>
                  <input
                    type="number"
                    value={formData.respiratoryRate || ''}
                    onChange={(e) => handleInputChange('respiratoryRate', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="16"
                    min="12"
                    max="25"
                    step="1"
                    className={`w-full p-4 border rounded-xl text-lg outline-none transition-all focus:ring-4 ${
                      validationErrors.respiratoryRate 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-100'
                    }`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.respiratoryRate && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {validationErrors.respiratoryRate}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ScaleIcon className="w-5 h-5 text-green-500" />
                    Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange('weight', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="65"
                    min="20"
                    max="200"
                    step="0.1"
                    className={`w-full p-4 border rounded-xl text-lg outline-none transition-all focus:ring-4 ${
                      validationErrors.weight 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-100'
                    }`}
                    disabled={isSubmitting}
                  />
                  {validationErrors.weight && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {validationErrors.weight}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BeakerIcon className="w-6 h-6 text-blue-500" />
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Ghi chú về tình trạng sức khỏe, thuốc đang dùng, hoặc các triệu chứng đặc biệt..."
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-xl text-lg outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gray-500 text-white border-none rounded-xl text-lg font-semibold cursor-pointer transition-all hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
                {hasChanges && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-xl text-lg font-semibold cursor-pointer transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <PencilIcon className="w-5 h-5" />
                        Cập nhật chỉ số
                      </>
                    )}
                  </button>
                )}
                {!hasChanges && (
                  <div className="px-8 py-4 bg-gray-100 text-gray-500 border-none rounded-xl text-lg font-semibold flex items-center gap-2">
                    <PencilIcon className="w-5 h-5" />
                    Chưa có thay đổi
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
 
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
      <ErrorModal 
        isOpen={showErrorModal} 
        onClose={() => setShowErrorModal(false)} 
        errors={modalErrors} 
      />
    </>
  );
}
