"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

type MedicalRecordFormData = {
  residentId: string;
  recordType: string;
  date: string;
  doctor: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  followUp: string;
  notes: string;
  priority: string;
  status: string;
  vitalSigns?: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
  };
  allergies?: string;
  familyHistory?: string;
};

const recordTypes = [
  { value: 'Ghi chú y tế', label: 'Ghi chú y tế', icon: '📝' },
  { value: 'Kê đơn thuốc', label: 'Kê đơn thuốc', icon: '💊' },
  { value: 'Báo cáo xét nghiệm', label: 'Báo cáo xét nghiệm', icon: '🧪' },
  { value: 'Kiểm tra sức khỏe', label: 'Kiểm tra sức khỏe', icon: '🩺' },
  { value: 'Khám định kỳ', label: 'Khám định kỳ', icon: '📅' },
  { value: 'Cấp cứu', label: 'Cấp cứu', icon: '🚨' },
  { value: 'Tư vấn chuyên khoa', label: 'Tư vấn chuyên khoa', icon: '👨‍⚕️' }
];

const doctors = [
  { value: 'Dr. Nguyễn Văn A', label: 'Dr. Nguyễn Văn A', specialty: 'Nội tổng quát' },
  { value: 'Dr. Trần Thị B', label: 'Dr. Trần Thị B', specialty: 'Tim mạch' },
  { value: 'Dr. Lê Văn C', label: 'Dr. Lê Văn C', specialty: 'Thần kinh' },
  { value: 'Dr. Hoàng Thị D', label: 'Dr. Hoàng Thị D', specialty: 'Lão khoa' },
  { value: 'Dr. Phạm Văn E', label: 'Dr. Phạm Văn E', specialty: 'Ngoại tổng quát' }
];

const priorities = [
  { value: 'Thấp', label: 'Thấp', color: 'bg-green-100 text-green-800' },
  { value: 'Trung bình', label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  { value: 'Cao', label: 'Cao', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Khẩn cấp', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
];

const statuses = [
  { value: 'Đang xử lý', label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
  { value: 'Hoàn thành', label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  { value: 'Cần theo dõi', label: 'Cần theo dõi', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Đã hủy', label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' }
];

// Mock residents data for dropdown
const residents = [
  { id: 1, name: 'Nguyễn Văn A', age: 75, room: 'A101' },
  { id: 2, name: 'Trần Thị B', age: 82, room: 'A102' },
  { id: 3, name: 'Lê Văn C', age: 68, room: 'B201' },
  { id: 4, name: 'Hoàng Văn D', age: 79, room: 'B202' },
  { id: 5, name: 'Phạm Thị E', age: 71, room: 'C301' }
];

// Common medical conditions for auto-suggest
const commonSymptoms = [
  'Đau đầu', 'Sốt', 'Ho', 'Khó thở', 'Đau ngực', 'Đau bụng', 'Buồn nôn', 
  'Chóng mặt', 'Mất ngủ', 'Đau khớp', 'Mệt mỏi', 'Không ăn được'
];

// Mock medical records data
const medicalRecordsData = [
  {
    id: 1,
    residentId: 1,
    residentName: 'Nguyễn Văn A',
    recordType: 'Khám định kỳ',
    date: '2024-01-15',
    doctor: 'Dr. Robert Brown',
    symptoms: 'Đau đầu nhẹ, mệt mỏi, khó ngủ',
    diagnosis: 'Tăng huyết áp nhẹ, thiếu vitamin D',
    treatment: 'Điều chỉnh chế độ ăn uống, tăng cường vận động nhẹ, bổ sung vitamin D',
    medications: ['Lisinopril 10mg', 'Vitamin D3 1000IU'],
    followUp: '2024-02-15',
    notes: 'Cần theo dõi huyết áp hàng tuần. Khuyến khích tham gia các hoạt động thể chất nhẹ.',
    priority: 'Trung bình',
    status: 'Hoàn thành',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    residentId: 2,
    residentName: 'Trần Thị B',
    recordType: 'Cấp cứu',
    date: '2024-01-16',
    doctor: 'Dr. Sarah Williams',
    symptoms: 'Khó thở, đau ngực, choáng váng',
    diagnosis: 'Cơn hen suyễn cấp',
    treatment: 'Nebulizer với albuterol, corticosteroid, theo dõi oxy trong máu',
    medications: ['Albuterol inhaler', 'Prednisolone 20mg'],
    followUp: '2024-01-20',
    notes: 'Phản ứng tốt với điều trị. Cần tránh các tác nhân gây dị ứng. Đã hướng dẫn sử dụng inhaler.',
    priority: 'Cao',
    status: 'Cần theo dõi',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    residentId: 3,
    residentName: 'Lê Văn C',
    recordType: 'Báo cáo xét nghiệm',
    date: '2024-01-17',
    doctor: 'Dr. Elizabeth Wilson',
    symptoms: 'Không có triệu chứng đặc biệt',
    diagnosis: 'Kết quả xét nghiệm máu bình thường',
    treatment: 'Duy trì chế độ ăn uống và vận động hiện tại',
    medications: [],
    followUp: '2024-04-17',
    notes: 'Tất cả các chỉ số trong giới hạn bình thường. Tiếp tục theo dõi định kỳ.',
    priority: 'Thấp',
    status: 'Hoàn thành',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 4,
    residentId: 4,
    residentName: 'Hoàng Văn D',
    recordType: 'Tư vấn chuyên khoa',
    date: '2024-01-18',
    doctor: 'Dr. Michael Chen',
    symptoms: 'Đau khớp, cứng khớp buổi sáng, khó di chuyển',
    diagnosis: 'Viêm khớp dạng thấp',
    treatment: 'Vật lý trị liệu, thuốc chống viêm, chế độ ăn chống viêm',
    medications: ['Methotrexate 15mg', 'Folic acid 5mg', 'Ibuprofen 400mg'],
    followUp: '2024-02-18',
    notes: 'Bệnh nhân cần điều trị dài hạn. Theo dõi tác dụng phụ của thuốc. Tham khảo chuyên gia dinh dưỡng.',
    priority: 'Cao',
    status: 'Đang xử lý',
    createdAt: '2024-01-18T11:45:00Z'
  }
];

export default function EditMedicalRecordPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [symptomSuggestions, setSymptomSuggestions] = useState<string[]>([]);
  
  // Get recordId from params directly
  const recordId = params.id;
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    reset,
    setValue,
    watch,
    control,
    trigger
  } = useForm<MedicalRecordFormData>({
    mode: 'onChange'
  });

  const watchedValues = watch();

  // Auto-suggest symptoms
  const handleSymptomsChange = (value: string) => {
    if (value.length > 2) {
      const suggestions = commonSymptoms.filter(symptom => 
        symptom.toLowerCase().includes(value.toLowerCase())
      );
      setSymptomSuggestions(suggestions.slice(0, 5));
    } else {
      setSymptomSuggestions([]);
    }
  };

  // Validation rules
  const validationRules = {
    residentId: {
      required: 'Vui lòng chọn cư dân',
    },
    recordType: {
      required: 'Vui lòng chọn loại hồ sơ',
    },
    date: {
      required: 'Vui lòng chọn ngày khám',
      validate: (value: string) => {
        const selectedDate = new Date(value);
        const today = new Date();
        const maxFutureDate = new Date();
        maxFutureDate.setDate(today.getDate() + 30);
        
        if (selectedDate > maxFutureDate) {
          return 'Ngày khám không được quá 30 ngày từ hôm nay';
        }
        return true;
      }
    },
    doctor: {
      required: 'Vui lòng chọn bác sĩ',
    },
    symptoms: {
      minLength: {
        value: 10,
        message: 'Triệu chứng phải có ít nhất 10 ký tự'
      }
    },
    diagnosis: {
      minLength: {
        value: 5,
        message: 'Chẩn đoán phải có ít nhất 5 ký tự'
      }
    },
    treatment: {
      minLength: {
        value: 10,
        message: 'Phương pháp điều trị phải có ít nhất 10 ký tự'
      }
    }
  };
  
  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const id = parseInt(recordId);
        
        // Check localStorage for medical records data
        let records = medicalRecordsData;
        const savedRecords = localStorage.getItem('nurseryHomeMedicalRecords');
        if (savedRecords) {
          records = JSON.parse(savedRecords);
        }
        
        const foundRecord = records.find(r => r.id === id);
        
        if (foundRecord) {
          setRecord(foundRecord);
          
          // Set form values
          setValue('residentId', foundRecord.residentId.toString());
          setValue('recordType', foundRecord.recordType);
          setValue('date', foundRecord.date);
          setValue('doctor', foundRecord.doctor);
          setValue('symptoms', foundRecord.symptoms || '');
          setValue('diagnosis', foundRecord.diagnosis || '');
          setValue('treatment', foundRecord.treatment || '');
          setValue('medications', foundRecord.medications?.join(', ') || '');
          setValue('followUp', foundRecord.followUp || '');
          setValue('notes', foundRecord.notes || '');
          setValue('priority', foundRecord.priority);
          setValue('status', foundRecord.status);
          
          // Set vital signs if available
          const recordWithVitals = foundRecord as any;
          if (recordWithVitals.vitalSigns) {
            setValue('vitalSigns.bloodPressure', recordWithVitals.vitalSigns.bloodPressure || '');
            setValue('vitalSigns.heartRate', recordWithVitals.vitalSigns.heartRate || '');
            setValue('vitalSigns.temperature', recordWithVitals.vitalSigns.temperature || '');
            setValue('vitalSigns.weight', recordWithVitals.vitalSigns.weight || '');
          }
        } else {
          router.push('/medical');
        }
      } catch (error) {
        console.error('Error fetching medical record:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [recordId, router, setValue]);
  
  const onSubmit = async (data: MedicalRecordFormData) => {
    setIsSubmitting(true);
    
    try {
      // Get existing medical records
      const existingRecords = localStorage.getItem('nurseryHomeMedicalRecords');
      let recordsList = existingRecords ? JSON.parse(existingRecords) : medicalRecordsData;
      
      // Find and update the record
      const recordIndex = recordsList.findIndex((r: any) => r.id === parseInt(recordId));
      
      if (recordIndex !== -1) {
        // Find resident info
        const resident = residents.find(r => r.id === parseInt(data.residentId));
        
        // Update the record
        recordsList[recordIndex] = {
          ...recordsList[recordIndex],
          residentId: parseInt(data.residentId),
          residentName: resident?.name || recordsList[recordIndex].residentName,
          recordType: data.recordType,
          date: data.date,
          doctor: data.doctor,
          symptoms: data.symptoms,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          medications: data.medications ? data.medications.split(',').map(m => m.trim()).filter(m => m) : [],
          followUp: data.followUp,
          notes: data.notes,
          priority: data.priority,
          status: data.status,
          vitalSigns: data.vitalSigns,
          allergies: data.allergies,
          familyHistory: data.familyHistory,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Current User' // In real app, get from auth context
        };
        
        // Save to localStorage
        localStorage.setItem('nurseryHomeMedicalRecords', JSON.stringify(recordsList));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Redirect after delay
        setTimeout(() => {
          setShowSuccessModal(false);
        router.push(`/medical/${recordId}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      alert('Có lỗi xảy ra khi cập nhật hồ sơ y tế. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const isStepValid = await trigger(['residentId', 'recordType', 'date', 'doctor', 'priority']);
    if (isStepValid) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const getStepProgress = () => {
    return (currentStep / 2) * 100;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }
  
  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật thành công!</h3>
          <p className="text-gray-600 mb-4">Hồ sơ y tế đã được cập nhật trong hệ thống.</p>
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/"
            className="mr-4 p-2 rounded-lg hover:bg-white/80 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
        </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chỉnh sửa hồ sơ y tế
            </h1>
            <p className="text-gray-600 mt-1">Cập nhật thông tin chi tiết về ca khám bệnh</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Bước {currentStep} / 2
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(getStepProgress())}% hoàn thành
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>
      </div>
      
        {/* Form Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <UserCircleIcon className="w-8 h-8 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-900">Thông tin cơ bản</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Resident Selection */}
                  <div className="md:col-span-2">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Cư dân *
                </label>
                <select
                      {...register('residentId', validationRules.residentId)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm ${
                        errors.residentId ? 'border-red-500' : 'border-gray-200'
                      }`}
                >
                  <option value="">Chọn cư dân</option>
                  {residents.map(resident => (
                        <option key={resident.id} value={resident.id}>
                          {resident.name} - Tuổi: {resident.age} - Phòng: {resident.room}
                        </option>
                  ))}
                </select>
                {errors.residentId && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.residentId.message}
                      </p>
                )}
              </div>
              
                  {/* Record Type */}
              <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                      Loại hồ sơ *
                </label>
                <select
                      {...register('recordType', validationRules.recordType)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm ${
                        errors.recordType ? 'border-red-500' : 'border-gray-200'
                      }`}
                >
                  <option value="">Chọn loại hồ sơ</option>
                  {recordTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                  ))}
                </select>
                {errors.recordType && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.recordType.message}
                      </p>
                )}
              </div>
              
                  {/* Date */}
              <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <CalendarDaysIcon className="w-4 h-4 mr-2" />
                      Ngày khám *
                </label>
                <input
                  type="date"
                      {...register('date', validationRules.date)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm ${
                        errors.date ? 'border-red-500' : 'border-gray-200'
                      }`}
                />
                {errors.date && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.date.message}
                      </p>
                )}
              </div>
              
                  {/* Doctor */}
              <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Bác sĩ *
                </label>
                <select
                      {...register('doctor', validationRules.doctor)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm ${
                        errors.doctor ? 'border-red-500' : 'border-gray-200'
                      }`}
                >
                  <option value="">Chọn bác sĩ</option>
                  {doctors.map(doctor => (
                        <option key={doctor.value} value={doctor.value}>
                          {doctor.label} - {doctor.specialty}
                        </option>
                  ))}
                </select>
                {errors.doctor && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.doctor.message}
                      </p>
                )}
              </div>
              
                  {/* Priority */}
              <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Mức độ ưu tiên *
                </label>
                <select
                      {...register('priority', { required: 'Vui lòng chọn mức độ ưu tiên' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    >
                  {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                  ))}
                </select>
                  </div>
              </div>
              
                {/* Next Button */}
                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Tiếp theo →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Medical Details */}
            {currentStep === 2 && (
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-purple-600 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-900">Chi tiết y tế</h2>
          </div>
          
                <div className="space-y-6">
                  {/* Symptoms with Auto-suggest */}
          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                  Triệu chứng
                </label>
                    <div className="relative">
                <textarea
                        {...register('symptoms', validationRules.symptoms)}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm resize-none ${
                          errors.symptoms ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Mô tả các triệu chứng quan sát được..."
                        onChange={(e) => {
                          handleSymptomsChange(e.target.value);
                        }}
                      />
                      
                      {/* Auto-suggest dropdown */}
                      {symptomSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                          {symptomSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                const currentValue = watchedValues.symptoms || '';
                                const newValue = currentValue ? `${currentValue}, ${suggestion}` : suggestion;
                                setValue('symptoms', newValue);
                                setSymptomSuggestions([]);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.symptoms && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.symptoms.message}
                      </p>
                    )}
              </div>
              
                  {/* Diagnosis and Treatment in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chẩn đoán
                </label>
                <textarea
                        {...register('diagnosis', validationRules.diagnosis)}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm resize-none ${
                          errors.diagnosis ? 'border-red-500' : 'border-gray-200'
                        }`}
                  placeholder="Chẩn đoán của bác sĩ..."
                      />
                      {errors.diagnosis && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.diagnosis.message}
                        </p>
                      )}
              </div>
              
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phương pháp điều trị
                </label>
                <textarea
                        {...register('treatment', validationRules.treatment)}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm resize-none ${
                          errors.treatment ? 'border-red-500' : 'border-gray-200'
                        }`}
                  placeholder="Mô tả phương pháp điều trị..."
                      />
                      {errors.treatment && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.treatment.message}
                        </p>
                      )}
                    </div>
              </div>
              
                  {/* Additional Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thuốc men
                </label>
                <input
                  type="text"
                  {...register('medications')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        placeholder="VD: Aspirin 100mg, Lisinopril 10mg"
                />
              </div>
              
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                  Lịch tái khám
                </label>
                <input
                  type="date"
                  {...register('followUp')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                />
                    </div>
              </div>
              
                  {/* Vital Signs */}
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Sinh hiệu
                </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <input
                          type="text"
                          {...register('vitalSigns.bloodPressure')}
                          placeholder="Huyết áp (mmHg)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          {...register('vitalSigns.heartRate')}
                          placeholder="Nhịp tim (bpm)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          {...register('vitalSigns.temperature')}
                          placeholder="Nhiệt độ (°C)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          {...register('vitalSigns.weight')}
                          placeholder="Cân nặng (kg)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-sm"
                />
              </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trạng thái
                    </label>
                    <select
                      {...register('status', { required: 'Vui lòng chọn trạng thái' })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Ghi chú bổ sung
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm resize-none"
                      placeholder="Các ghi chú khác..."
                    />
            </div>
          </div>
          
          {/* Form Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    ← Quay lại
                  </button>
                  
                  <div className="flex space-x-4">
            <Link 
              href={`/medical/${recordId}`} 
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <PencilSquareIcon className="w-5 h-5 mr-2" />
                          Cập nhật hồ sơ
                        </>
                      )}
            </button>
          </div>
                </div>
              </div>
            )}
        </form>
        </div>
      </div>
    </div>
  );
} 