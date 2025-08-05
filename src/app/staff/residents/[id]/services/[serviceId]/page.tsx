"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ShieldCheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlansAPI, residentAPI, userAPI, roomsAPI, bedsAPI } from '@/lib/api';

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return '/default-avatar.svg';
  
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;
  
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

export default function ResidentServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [resident, setResident] = useState<any>(null);
  const [carePlanAssignment, setCarePlanAssignment] = useState<any>(null);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa cập nhật');
  const [bedNumber, setBedNumber] = useState<string>('Chưa cập nhật');
  const [roomLoading, setRoomLoading] = useState(false);
  const [bedLoading, setBedLoading] = useState(false);
  const [expandedServices, setExpandedServices] = useState<{ [key: number]: boolean }>({});

  // Get IDs from URL params
  const residentId = params.id as string;
  const serviceId = params.serviceId as string;

  // Check access permissions - staff only
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'staff') {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load resident data
  useEffect(() => {
    const loadResident = async () => {
      try {
        setLoading(true);
        const data = await residentAPI.getById(residentId);
        const mapped = {
          id: data._id,
          name: data.full_name,
          age: data.date_of_birth ? (new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()) : '',
          gender: data.gender,
          admissionDate: data.admission_date,
          dischargeDate: data.discharge_date,
          relationship: data.relationship,
          medicalHistory: data.medical_history,
          currentMedications: data.current_medications,
          allergies: data.allergies,
          emergencyContact: data.emergency_contact,
          careLevel: data.care_level,
          avatar: Array.isArray(data.avatar) ? data.avatar[0] : data.avatar || null,
          status: data.status,
          ...data
        };
        setResident(mapped);
      } catch (error) {
        console.error('Error loading resident:', error);
        router.push('/staff/residents');
      } finally {
        setLoading(false);
      }
    };

    if (residentId) {
      loadResident();
    }
  }, [residentId, router]);

  // Load care plan assignment
  useEffect(() => {
    const loadCarePlanAssignment = async () => {
      if (!residentId) return;

      try {
        const assignments = await carePlansAPI.getByResidentId(residentId);
        const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a._id === serviceId) : null;
        
        if (assignment) {
          setCarePlanAssignment(assignment);
          
          // Load care plan details
          if (assignment.care_plan_ids && assignment.care_plan_ids.length > 0) {
            const carePlanPromises = assignment.care_plan_ids.map(async (plan: any) => {
              const planId = plan._id || plan;
              try {
                const planData = await carePlansAPI.getById(planId);
                return planData;
              } catch (err) {
                console.error('Error fetching care plan with ID', planId, ':', err);
                return plan;
              }
            });
            
            const carePlanData = await Promise.all(carePlanPromises);
            setCarePlanDetails(carePlanData);
          }
        }
      } catch (error) {
        console.error('Error loading care plan assignment:', error);
      }
    };

    loadCarePlanAssignment();
  }, [residentId, serviceId]);

  // Load room and bed information
  useEffect(() => {
    const loadRoomAndBedInfo = async () => {
      if (!carePlanAssignment) return;

      setRoomLoading(true);
      setBedLoading(true);

      try {
        // Load room information
        const assignedRoomId = carePlanAssignment.assigned_room_id;
        const roomIdString = typeof assignedRoomId === 'object' && assignedRoomId?._id ? assignedRoomId._id : assignedRoomId;
        if (roomIdString) {
          const room = await roomsAPI.getById(roomIdString);
          setRoomNumber(room?.room_number || 'Chưa cập nhật');
        } else {
          setRoomNumber('Chưa cập nhật');
        }

        // Load bed information
        const assignedBedId = carePlanAssignment.assigned_bed_id;
        const bedIdString = typeof assignedBedId === 'object' && assignedBedId?._id ? assignedBedId._id : assignedBedId;
        if (bedIdString) {
          const bed = await bedsAPI.getById(bedIdString);
          setBedNumber(bed?.bed_number || 'Chưa cập nhật');
        } else {
          setBedNumber('Chưa cập nhật');
        }
      } catch (error) {
        console.error('Error loading room/bed info:', error);
        setRoomNumber('Chưa cập nhật');
        setBedNumber('Chưa cập nhật');
      } finally {
        setRoomLoading(false);
        setBedLoading(false);
      }
    };

    loadRoomAndBedInfo();
  }, [carePlanAssignment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full border-3 border-gray-200 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 m-0">
            Đang tải thông tin dịch vụ...
          </p>
        </div>
      </div>
    );
  }

  if (!resident || !carePlanAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 shadow-lg text-center max-w-md">
          <ExclamationTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Không tìm thấy thông tin
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Dịch vụ này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href={`/staff/residents/${residentId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium no-underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại trang resident
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/staff/residents/${residentId}`}
              className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl text-blue-600 no-underline transition-all duration-200 hover:bg-blue-200"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-gray-200 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {resident.avatar ? (
                    <img
                      src={getAvatarUrl(resident.avatar)}
                      alt={`Avatar của ${resident.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
                        }
                      }}
                    />
                  ) : (
                    <img
                      src="/default-avatar.svg"
                      alt="Default avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
                        }
                      }}
                    />
                  )}
                </div>
                
                {/* Thông tin cơ bản */}
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-slate-600 block mb-1">
                      Tên người cao tuổi:
                    </span>
                    <h1 className="text-3xl font-bold m-0 text-slate-800">
                      {resident.name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {/* Tuổi */}
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-gray-100 rounded-lg px-3 py-1 font-medium">
                      <UserIcon className="w-4 h-4" />
                      <span>Tuổi:</span>
                      <span>{resident.age} tuổi</span>
                    </span>
                    {/* Phòng */}
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-gray-100 rounded-lg px-3 py-1 font-medium">
                      <HomeIcon className="w-4 h-4" />
                      <span>Phòng:</span>
                      <span>{roomLoading ? 'Đang tải...' : roomNumber}</span>
                    </span>
                    {/* Giường */}
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-gray-100 rounded-lg px-3 py-1 font-medium">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Giường:</span>
                      <span>{bedLoading ? 'Đang tải...' : bedNumber}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Page Title */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 m-0">
                Chi tiết gói dịch vụ
              </h2>
              <p className="text-base text-slate-600 mt-1">
                Thông tin chi tiết về gói dịch vụ đang sử dụng
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 shadow-lg border border-white/20">
          <div className="grid gap-8">
            
            {/* Service Cost Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 m-0">
                    Tổng chi phí dịch vụ
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Chi phí hàng tháng bao gồm phòng và dịch vụ
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-5xl font-extrabold text-blue-800 mb-2">
                  {formatCurrency(carePlanAssignment.total_monthly_cost || 0)}
                </p>
                <p className="text-base text-slate-600 mb-6">
                  Mỗi tháng
                </p>
                
                <div className="bg-white/90 rounded-xl p-6 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">
                        Tiền phòng
                      </p>
                      <p className="text-2xl font-bold text-slate-800 m-0">
                        {formatCurrency(carePlanAssignment.room_monthly_cost || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-2">
                        Tiền dịch vụ
                      </p>
                      <p className="text-2xl font-bold text-slate-800 m-0">
                        {formatCurrency(carePlanAssignment.care_plans_monthly_cost || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Packages */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-8 border border-cyan-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 m-0">
                    Gói dịch vụ đã đăng ký
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Chi tiết các dịch vụ đang sử dụng
                  </p>
                </div>
                <div>
                  <span className="bg-cyan-100 text-cyan-800 text-sm font-semibold px-4 py-2 rounded-full border border-cyan-200">
                    Tổng: {carePlanDetails.length} gói dịch vụ
                  </span>
                </div>
              </div>
              
              <div className="grid gap-6">
                {carePlanDetails.map((carePlan: any, index: number) => (
                  <div key={index} className="bg-white/90 rounded-2xl p-6 border border-cyan-200 shadow-md transition-all duration-200 hover:shadow-lg">
                    {/* Header with name and price */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-slate-800 mb-2">
                          {carePlan.plan_name}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed m-0">
                          {carePlan.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-600">
                            Giá:
                          </span>
                          <span className="text-xl font-bold text-cyan-800">
                            {formatCurrency(carePlan.monthly_price || 0)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 m-0">
                          mỗi tháng
                        </p>
                      </div>
                    </div>
                    
                    {/* Time Information */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 mb-6 border border-green-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <ClockIcon className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                              Ngày bắt đầu
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 m-0">
                            {carePlan.start_date ? formatDate(carePlan.start_date) : 
                             carePlanAssignment.start_date ? formatDate(carePlanAssignment.start_date) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-700">
                              Ngày kết thúc
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 m-0">
                            {carePlan.end_date ? formatDate(carePlan.end_date) : 
                             carePlanAssignment.end_date ? formatDate(carePlanAssignment.end_date) : 'Không có thời hạn'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Services Included */}
                    <div className="border-t border-slate-200 pt-6">
                      <p className="text-sm font-semibold text-gray-700 mb-4">
                        Dịch vụ bao gồm:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {carePlan.services_included?.slice(0, expandedServices[index] ? undefined : 4).map((service: string, serviceIndex: number) => (
                          <span key={serviceIndex} className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 text-xs px-4 py-2 rounded-full border border-blue-200 font-medium">
                            {service}
                          </span>
                        ))}
                        {carePlan.services_included?.length > 4 && !expandedServices[index] && (
                          <button
                            onClick={() => toggleServiceExpansion(index)}
                            className="bg-blue-100 text-blue-800 text-xs px-4 py-2 rounded-full border border-blue-200 font-medium cursor-pointer flex items-center gap-1 transition-all duration-200 hover:bg-blue-200"
                          >
                            <span>+{carePlan.services_included.length - 4} dịch vụ khác</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        {carePlan.services_included?.length > 4 && expandedServices[index] && (
                          <button
                            onClick={() => toggleServiceExpansion(index)}
                            className="bg-gray-100 text-gray-700 text-xs px-4 py-2 rounded-full border border-gray-200 font-medium cursor-pointer flex items-center gap-1 transition-all duration-200 hover:bg-gray-200"
                          >
                            <span>Thu gọn danh sách</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {carePlanDetails.length === 0 && (
                  <div className="text-center p-12">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-base font-semibold text-gray-500 mb-2">
                      Chưa có gói dịch vụ nào
                    </p>
                    <p className="text-sm text-gray-400 m-0">
                      Hãy đăng ký dịch vụ để bắt đầu
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Room & Bed Information */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 m-0">
                    Phòng & Giường
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Vị trí lưu trú hiện tại
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-white/90 rounded-xl p-6 border border-green-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Phòng
                    </p>
                    <p className="text-2xl font-bold text-green-600 m-0">
                      {roomLoading ? 'Đang tải...' : roomNumber}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/90 rounded-xl p-6 border border-green-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Giường
                    </p>
                    <p className="text-2xl font-bold text-green-600 m-0">
                      {bedLoading ? 'Đang tải...' : bedNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 