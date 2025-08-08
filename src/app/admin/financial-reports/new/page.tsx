'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { residentAPI, staffAPI, billsAPI, carePlansAPI, roomsAPI, bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { filterOfficialResidents } from '@/lib/utils/resident-status';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  ArrowLeftIcon,
  UserIcon, 
  CreditCardIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface ValidationErrors {
  resident_id?: string;
  care_plan_assignment_id?: string;
  staff_id?: string;
  amount?: string;
  due_date?: string;
  title?: string;
}

export default function NewBillPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [residentSearchTerm, setResidentSearchTerm] = useState('');
  const [resident_id, setResidentId] = useState('');
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [care_plan_assignment_id, setCarePlanAssignmentId] = useState('');
  const [staff_id, setStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [due_date, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progress, setProgress] = useState(0);



  // Fetch residents with room information
  useEffect(() => {
    setLoadingResidents(true);
    
    const fetchResidentsWithRooms = async () => {
      try {
        const residentsData = await residentAPI.getAll();
        
        // Chỉ lấy cư dân chính thức (có phòng và giường)
        const officialResidents = await filterOfficialResidents(residentsData);
        console.log('Official residents for financial reports:', officialResidents);
        
        // Sử dụng thông tin phòng từ filterOfficialResidents
        const residentsWithRooms = officialResidents.map((resident: any) => {
          return {
            ...resident,
            room_number: resident.roomNumber || 'Chưa hoàn tất đăng ký'
          };
        });
        
        setResidents(residentsWithRooms);
        setFilteredResidents(residentsWithRooms);
      } catch (error) {
        console.error('Error fetching residents:', error);
        setResidents([]);
        setFilteredResidents([]);
      } finally {
        setLoadingResidents(false);
      }
    };
    
    fetchResidentsWithRooms();
    
    staffAPI.getAll().then(setStaffs);
    
    // Auto-select current user as staff if role is staff or admin
    if (user && (user.role === 'staff' || user.role === 'admin')) {
      setStaffId(user.id);
    }
  }, [user]);

  // Filter residents based on search term
  useEffect(() => {
    if (!residentSearchTerm.trim()) {
      setFilteredResidents(residents);
      return;
    }

    const searchTerm = residentSearchTerm.toLowerCase();
    const filtered = residents.filter(r => 
      r?.full_name?.toLowerCase().includes(searchTerm) ||
      r?.room_number?.toString().includes(searchTerm) ||
      r?.room?.room_number?.toString().includes(searchTerm) ||
      r?.phone?.includes(searchTerm)
    );
    setFilteredResidents(filtered);
  }, [residentSearchTerm, residents]);

  // Fetch care plan assignments when resident changes
  useEffect(() => {
    if (resident_id) {
      setLoadingAssignments(true);
      carePlansAPI.getByResidentId(resident_id)
        .then(data => {
          const assignments = Array.isArray(data) ? data : [];
          // Lọc chỉ những assignment còn hạn (active và chưa hết hạn)
          const activeAssignments = assignments.filter((assignment: any) => {
            // Kiểm tra status phải là 'active'
            if (assignment.status !== 'active') return false;
            
            // Kiểm tra end_date phải còn trong tương lai
            if (assignment.end_date) {
              const endDate = new Date(assignment.end_date);
              const now = new Date();
              return endDate > now;
            }
            
            // Nếu không có end_date, coi như còn hạn
            return true;
          });
          
          setCarePlanAssignments(activeAssignments);
        })
        .catch(() => setCarePlanAssignments([]))
        .finally(() => setLoadingAssignments(false));
      setCarePlanAssignmentId('');
      setAmount('');
    } else {
      setCarePlanAssignments([]);
      setCarePlanAssignmentId('');
      setAmount('');
    }
  }, [resident_id]);

  // Set amount when care plan assignment changes
  useEffect(() => {
    if (care_plan_assignment_id) {
      const assignment = carePlanAssignments.find((a: any) => a._id === care_plan_assignment_id);
      setAmount(assignment ? assignment.total_monthly_cost?.toString() : '');
      // Gợi ý title/notes tự động
      if (assignment) {
        const planName = assignment.care_plan_ids && assignment.care_plan_ids[0]?.plan_name ? assignment.care_plan_ids[0].plan_name : '';
        const month = due_date ? new Date(due_date).getMonth() + 1 : '';
        const year = due_date ? new Date(due_date).getFullYear() : '';
        setTitle(`Hóa đơn tháng ${month}/${year} cho gói chăm sóc ${planName}`);
        setNotes(`Chưa thanh toán cho ${planName}${assignment.room_type ? ' + phòng ' + assignment.room_type : ''} tháng ${month}/${year}`);
      } else {
        setTitle('');
        setNotes('');
      }
    } else {
      setAmount('');
      setTitle('');
      setNotes('');
    }
  }, [care_plan_assignment_id, carePlanAssignments, due_date]);

  // Update title/notes when due_date changes
  useEffect(() => {
    if (care_plan_assignment_id && due_date) {
      const assignment = carePlanAssignments.find((a: any) => a._id === care_plan_assignment_id);
      const planName = assignment?.care_plan_ids && assignment.care_plan_ids[0]?.plan_name ? assignment.care_plan_ids[0].plan_name : '';
      const month = new Date(due_date).getMonth() + 1;
      const year = new Date(due_date).getFullYear();
      setTitle(`Hóa đơn tháng ${month}/${year} cho gói chăm sóc ${planName}`);
      setNotes(`Chưa thanh toán cho ${planName}${assignment?.room_type ? ' + phòng ' + assignment.room_type : ''} tháng ${month}/${year}`);
    }
  }, [due_date]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!resident_id) {
      errors.resident_id = 'Vui lòng chọn cư dân';
    }

    if (!care_plan_assignment_id) {
      errors.care_plan_assignment_id = 'Vui lòng chọn gói chăm sóc';
    } else {
      // Kiểm tra thêm xem gói chăm sóc có còn hạn không
      const selectedAssignment = carePlanAssignments.find((a: any) => a._id === care_plan_assignment_id);
      if (selectedAssignment) {
        if (selectedAssignment.status !== 'active') {
          errors.care_plan_assignment_id = 'Gói chăm sóc không còn hoạt động';
        } else if (selectedAssignment.end_date) {
          const endDate = new Date(selectedAssignment.end_date);
          const now = new Date();
          if (endDate <= now) {
            errors.care_plan_assignment_id = 'Gói chăm sóc đã hết hạn';
          }
        }
      }
    }

    if (!staff_id) {
      errors.staff_id = 'Không thể xác định nhân viên hiện tại';
    }

    if (!amount || Number(amount) <= 0) {
      errors.amount = 'Số tiền phải lớn hơn 0';
    }

    if (!due_date) {
      errors.due_date = 'Vui lòng chọn ngày đến hạn';
    } else {
      const selectedDate = new Date(due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.due_date = 'Ngày đến hạn không thể trong quá khứ';
      }
    }

    if (!title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề hóa đơn';
    } else if (title.trim().length < 10) {
      errors.title = 'Tiêu đề phải có ít nhất 10 ký tự';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await billsAPI.create({
        resident_id,
        care_plan_assignment_id,
        staff_id,
        amount: Number(amount),
        due_date: due_date ? new Date(due_date).toISOString() : '',
        title,
        notes
      });
      
      // Hiển thị modal thành công
      setShowSuccessModal(true);
      setProgress(0);
      
      // Animate progress bar
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 60);
      
      // Tự động chuyển hướng sau 3 giây
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/admin/financial-reports');
      }, 3000);
      
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tạo hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/admin/financial-reports');
  };

      return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header - improved professional look */}
            <div className="rounded-2xl shadow bg-gradient-to-r from-blue-200 to-indigo-200 px-8 py-8 mb-8 flex flex-col md:flex-row md:items-center md:gap-6">
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <button
                  onClick={() => router.back()}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-lg shadow transition-all duration-150 flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ChartBarIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Tạo hóa đơn mới</h1>
                    <p className="text-gray-600 text-base">Nhập thông tin hóa đơn cho cư dân</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Thông tin hóa đơn</h2>
                <p className="text-blue-100 text-sm mt-1">Vui lòng điền đầy đủ thông tin bên dưới</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Thông tin cơ bản
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Cư dân <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Search Input */}
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Tìm kiếm cư dân theo tên hoặc số phòng..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={residentSearchTerm}
                        onChange={(e) => {
                          const searchTerm = e.target.value;
                          setResidentSearchTerm(searchTerm);
                        }}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Resident Selection */}
                    <div className="relative">
                      <select 
                        value={resident_id} 
                        onChange={e => {
                          setResidentId(e.target.value);
                          setValidationErrors(prev => ({ ...prev, resident_id: undefined }));
                          // Reset search when resident is selected
                          if (e.target.value) {
                            setResidentSearchTerm('');
                          }
                        }} 
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.resident_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Chọn cư dân</option>
                        {residents.length === 0 && !loadingResidents && (
                          <option value="" disabled>Không có cư dân nào</option>
                        )}
                        {(filteredResidents.length > 0 ? filteredResidents : residents).map(r => {
                          const roomInfo = r?.room_number || r?.room?.room_number || 'Chưa phân phòng';
                          return (
                            <option key={r?._id} value={r?._id}>
                              {r?.full_name} - Phòng {roomInfo}
                            </option>
                          );
                        })}
                      </select>
                      
                      {/* Resident Count Info */}
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Hiển thị: {filteredResidents.length > 0 ? filteredResidents.length : residents.length} / {residents.length} cư dân
                      </div>
                    </div>
                    
                    {validationErrors.resident_id && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationErrors.resident_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Nhân viên tạo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={staffs.find(s => s?._id === staff_id)?.full_name || user?.name || 'Đang tải...'} 
                        readOnly 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Tự động chọn nhân viên hiện tại"
                      />

                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      Tự động chọn tài khoản đang đăng nhập
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Service Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                  Thông tin dịch vụ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Gói chăm sóc <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={care_plan_assignment_id} 
                      onChange={e => {
                        setCarePlanAssignmentId(e.target.value);
                        setValidationErrors(prev => ({ ...prev, care_plan_assignment_id: undefined }));
                      }} 
                      disabled={!resident_id || loadingAssignments}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.care_plan_assignment_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      } ${(!resident_id || loadingAssignments) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{loadingAssignments ? 'Đang tải...' : 'Chọn gói chăm sóc'}</option>
                      {carePlanAssignments.length === 0 && !loadingAssignments && (
                        <option value="" disabled>Không có gói chăm sóc còn hạn</option>
                      )}
                      {carePlanAssignments.map(cp => {
                        const planName = cp?.care_plan_ids && cp.care_plan_ids[0]?.plan_name ? cp.care_plan_ids[0].plan_name : 'Gói chăm sóc';
                        const cost = cp?.total_monthly_cost ? ` - ${Number(cp.total_monthly_cost).toLocaleString('vi-VN')} đ/tháng` : '';
                        const endDate = cp?.end_date ? new Date(cp.end_date) : null;
                        const endDateStr = endDate ? ` (Hết hạn: ${endDate.toLocaleDateString('vi-VN')})` : '';
                        
                        return (
                          <option key={cp?._id} value={cp?._id}>
                            {planName}{cost}{endDateStr}
                          </option>
                        );
                      })}
                    </select>
                    {validationErrors.care_plan_assignment_id && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationErrors.care_plan_assignment_id}
                      </p>
                    )}
                    {carePlanAssignments.length === 0 && !loadingAssignments && resident_id && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                          <p className="text-amber-800 text-sm font-medium">
                            Không có gói chăm sóc còn hạn cho cư dân này
                          </p>
                        </div>
                        <p className="text-amber-700 text-xs mt-1">
                          Chỉ có thể tạo hóa đơn cho các gói dịch vụ đang hoạt động và chưa hết hạn.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Số tiền <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={amount} 
                        readOnly 
                        className={`w-full px-4 py-3 border rounded-xl bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          validationErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Tự động từ gói chăm sóc"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                        VNĐ
                      </div>
                    </div>
                    {validationErrors.amount && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationErrors.amount}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Bill Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  Chi tiết hóa đơn
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Ngày đến hạn <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={due_date ? (() => {
                        const [y, m, d] = due_date.split('-');
                        if (y && m && d) return new Date(Number(y), Number(m) - 1, Number(d));
                        return null;
                      })() : null}
                      onChange={date => {
                        if (date instanceof Date && !isNaN(date.getTime())) {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          setDueDate(`${yyyy}-${mm}-${dd}`);
                          setValidationErrors(prev => ({ ...prev, due_date: undefined }));
                        } else {
                          setDueDate('');
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="dd/mm/yyyy"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      autoComplete="off"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      minDate={new Date()}
                    />
                    {validationErrors.due_date && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationErrors.due_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => {
                        setTitle(e.target.value);
                        setValidationErrors(prev => ({ ...prev, title: undefined }));
                      }} 
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="Hóa đơn tháng 2/2024 cho gói chăm sóc cao cấp"
                    />
                    {validationErrors.title && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationErrors.title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    Ghi chú
                  </label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
                    placeholder="Chưa thanh toán cho gói cao cấp + phòng 2 giường tháng 2/2024"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={loading || loadingResidents || residents.length === 0 || loadingAssignments || carePlanAssignments.length === 0 || !staff_id}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Tạo hóa đơn
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl transform transition-all duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tạo hóa đơn thành công!</h3>
            <p className="text-gray-600 mb-6">Hóa đơn đã được tạo và lưu vào hệ thống thành công.</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">Tự động chuyển hướng sau 3 giây...</p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Đóng ngay
              </button>
              <button
                onClick={() => router.push('admin/financial-reports')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Xem hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 