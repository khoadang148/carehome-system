"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAssignmentsAPI, staffAPI, residentAPI, carePlansAPI, roomsAPI } from '@/lib/api';

export default function NewStaffAssignmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    staff_id: '',
    resident_ids: [] as string[],
    end_date: '',
    notes: '',
    responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Check permissions
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load data
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [staffData, residentsData, assignmentsData] = await Promise.all([
          staffAPI.getAll(),
          residentAPI.getAll(),
          staffAssignmentsAPI.getAll(),
        ]);
        
        setStaffList(Array.isArray(staffData) ? staffData : []);
        setResidents(Array.isArray(residentsData) ? residentsData : []);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        
        // Lấy số phòng cho từng resident
        const residentsArray = Array.isArray(residentsData) ? residentsData : [];
        residentsArray.forEach(async (resident: any) => {
          try {
            const assignments = await carePlansAPI.getByResidentId(resident._id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
            const roomId = assignment?.assigned_room_id;
            if (roomId) {
              const room = await roomsAPI.getById(roomId);
              setRoomNumbers(prev => ({ ...prev, [resident._id]: room?.room_number || 'Chưa cập nhật' }));
            } else {
              setRoomNumbers(prev => ({ ...prev, [resident._id]: 'Chưa cập nhật' }));
            }
          } catch {
            setRoomNumbers(prev => ({ ...prev, [resident._id]: 'Chưa cập nhật' }));
          }
        });
        
        setError('');
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        console.error('Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Handle create assignment
  const handleCreate = async () => {
    if (!formData.staff_id || formData.resident_ids.length === 0) {
      alert('Vui lòng chọn nhân viên và ít nhất một cư dân');
      return;
    }

    setSubmitting(true);
    try {
      // Tạo nhiều assignment cho từng resident
      const newAssignments = await Promise.all(
        formData.resident_ids.map(residentId => 
          staffAssignmentsAPI.create({
            staff_id: formData.staff_id,
            resident_id: residentId,
            end_date: formData.end_date || undefined,
            notes: formData.notes,
            responsibilities: formData.responsibilities,
          })
        )
      );
      
      // Hiển thị modal thành công
      setSuccessData({
        count: newAssignments.length,
        staff: selectedStaff,
        residents: selectedResidents,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo phân công. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/admin/staff-assignments');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      staff_id: '',
      resident_ids: [],
      end_date: '',
      notes: '',
      responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
  };

  // Get available residents (not assigned to any staff)
  const getAvailableResidents = () => {
    return residents.filter(resident => {
      // Ẩn những resident đã được phân công cho bất kỳ staff nào (bao gồm cả staff hiện tại)
      const isAssignedToAnyStaff = assignments.some(
        assignment => 
          assignment.resident_id._id === resident._id && 
          assignment.status === 'active'
      );
      return !isAssignedToAnyStaff;
    });
  };

  // Get filtered residents based on search term
  const getFilteredResidents = () => {
    const availableResidents = getAvailableResidents();
    if (!searchTerm) return availableResidents;
    
    return availableResidents.filter(resident =>
      resident.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (roomNumbers[resident._id] && roomNumbers[resident._id].toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Get selected staff info
  const selectedStaff = staffList.find(staff => staff._id === formData.staff_id);

  // Get selected residents info
  const selectedResidents = residents.filter(resident => 
    formData.resident_ids.includes(resident._id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/admin/staff-assignments"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Tạo phân công mới
                </h1>
                <p className="text-sm text-gray-500 mt-1">Phân công nhân viên phụ trách cư dân</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetForm}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md font-medium"
              >
                Làm mới
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !formData.staff_id || formData.resident_ids.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-5 h-5 mr-3" />
                    Tạo phân công
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlusIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  Thông tin phân công
                </h2>
                
                <div className="space-y-8">
                  {/* Staff Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nhân viên phụ trách <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.staff_id}
                      onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200 text-lg"
                    >
                      <option value="">Chọn nhân viên</option>
                      {staffList.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.full_name} - {staff.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Residents Selection */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Cư dân được phân công <span className="text-red-500">*</span>
                      <span className="text-sm font-normal text-gray-500 ml-2">(Có thể chọn nhiều)</span>
                    </label>
                    
                    {/* Search and Filter */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm kiếm cư dân theo tên hoặc số phòng..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-all duration-200 text-lg"
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                      {searchTerm && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Tìm thấy {getFilteredResidents().length} cư dân phù hợp
                        </p>
                      )}
                    </div>

                    {/* Residents Grid */}
                    <div className="border-2 border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto bg-white shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getFilteredResidents().map((resident) => {
                          const isSelected = formData.resident_ids.includes(resident._id);
                          return (
                            <div
                              key={resident._id}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    resident_ids: formData.resident_ids.filter(id => id !== resident._id)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    resident_ids: [...formData.resident_ids, resident._id]
                                  });
                                }
                              }}
                              className={`
                                p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]
                                ${isSelected 
                                  ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg ring-4 ring-green-100' 
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-200
                                    ${isSelected 
                                      ? 'border-green-500 bg-green-500 shadow-md' 
                                      : 'border-gray-300 bg-white'
                                    }
                                  `}>
                                    {isSelected && (
                                      <CheckIcon className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className={`font-semibold text-lg ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                      {resident.full_name}
                                    </p>
                                    <p className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                                      Phòng: {roomNumbers[resident._id] || 'Chưa cập nhật'}
                                    </p>
                                  </div>
                                </div>
                                <div className={`
                                  w-3 h-3 rounded-full transition-all duration-200
                                  ${isSelected ? 'bg-green-500 shadow-md' : 'bg-gray-300'}
                                `} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {getFilteredResidents().length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          {searchTerm ? (
                            <>
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <p className="text-lg font-medium mb-2">Không tìm thấy cư dân nào phù hợp</p>
                              <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserPlusIcon className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-lg font-medium mb-2">Không có cư dân nào khả dụng</p>
                              <p className="text-sm">Tất cả cư dân đã được phân công cho nhân viên khác</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Count */}
                    {formData.resident_ids.length > 0 && (
                      <div className="mt-4 flex items-center justify-between bg-white rounded-xl p-4 border-2 border-green-200">
                        <p className="text-sm text-gray-600 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-2 text-green-500" />
                          Đã chọn: <span className="font-semibold text-green-600 ml-1">{formData.resident_ids.length}</span> cư dân
                        </p>
                        <button
                          onClick={() => setFormData({ ...formData, resident_ids: [] })}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ngày kết thúc phân công
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all duration-200 text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Để trống nếu không có ngày kết thúc cụ thể
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ghi chú phân công
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 focus:outline-none transition-all duration-200 text-lg resize-none"
                      placeholder="Ghi chú về phân công, yêu cầu đặc biệt, v.v..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  Xem trước phân công
                </h2>
                
                <div className="space-y-6">
                  {/* Selected Staff */}
                  {selectedStaff && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Nhân viên được chọn
                      </h3>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {selectedStaff.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900 text-lg">{selectedStaff.full_name}</p>
                          <p className="text-sm text-blue-700">{selectedStaff.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Residents */}
                  {selectedResidents.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-green-900 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-2" />
                          Cư dân được chọn ({selectedResidents.length})
                        </h3>
                        <button
                          onClick={() => setFormData({ ...formData, resident_ids: [] })}
                          className="text-xs text-green-600 hover:text-green-800 transition-colors font-medium"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedResidents.map((resident) => (
                          <div 
                            key={resident._id} 
                            className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200 shadow-sm"
                          >
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-sm"></div>
                              <div>
                                <p className="text-sm font-semibold text-green-900">{resident.full_name}</p>
                                <p className="text-xs text-green-700">Phòng {roomNumbers[resident._id] || 'Chưa cập nhật'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setFormData({
                                ...formData,
                                resident_ids: formData.resident_ids.filter(id => id !== resident._id)
                              })}
                              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors"
                              title="Bỏ chọn cư dân này"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Trách nhiệm được giao
                    </h3>
                    <div className="space-y-3">
                      {formData.responsibilities.map((responsibility) => (
                        <div key={responsibility} className="flex items-center">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <CheckIcon className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {responsibility === 'vital_signs' && 'Đo đạc chỉ số sức khỏe'}
                            {responsibility === 'care_notes' && ' Ghi chú chăm sóc'}
                            {responsibility === 'activities' && ' Quản lý hoạt động'}
                            {responsibility === 'photos' && 'Đăng ảnh hoạt động'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Tóm tắt
                    </h3>
                    <div className="text-sm text-yellow-800 space-y-2">
                      <p className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Sẽ tạo <span className="font-bold text-yellow-900">{formData.resident_ids.length}</span> phân công
                      </p>
                      <p className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Nhân viên: <span className="font-semibold text-yellow-900">{selectedStaff?.full_name || 'Chưa chọn'}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Trạng thái: <span className="font-semibold text-green-600">Hoạt động</span>
                      </p>
                      {formData.end_date && (
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          Kết thúc: <span className="font-semibold text-yellow-900">{new Date(formData.end_date).toLocaleDateString('vi-VN')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </div>
              
              {/* Success Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Tạo phân công thành công!
              </h2>
              
              {/* Success Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Số lượng phân công:</span>
                    <span className="font-bold text-green-600 text-lg">{successData.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Nhân viên:</span>
                    <span className="font-semibold text-gray-900">{successData.staff?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cư dân:</span>
                    <span className="font-semibold text-gray-900">{successData.residents.length} người</span>
                  </div>
                </div>
              </div>
              
              {/* Success Message */}
              <p className="text-gray-600 mb-8">
                Phân công đã được tạo thành công và nhân viên có thể bắt đầu thực hiện trách nhiệm của mình.
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSuccessClose}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Xem danh sách phân công
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 