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
  HeartIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlansAPI, residentAPI, userAPI, roomsAPI, bedsAPI } from '@/lib/api';

const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return '/default-avatar.svg';
  
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;
  
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

export default function ResidentServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [resident, setResident] = useState<any>(null);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedNumber, setBedNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [bedLoading, setBedLoading] = useState(false);
  const [expandedServices, setExpandedServices] = useState<{ [key: number]: boolean }>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const residentId = React.use(params).id;

  useEffect(() => {
    if (!autoRefreshEnabled || !residentId) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000); 

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, residentId]);

  const refreshData = () => {
    setLastRefresh(new Date());
  };

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
        router.push('/staff/residents');
      } finally {
        setLoading(false);
      }
    };

    if (residentId) {
      loadResident();
    }
  }, [residentId, router, lastRefresh]);

  useEffect(() => {
    const loadCarePlanAssignments = async () => {
      if (!residentId) return;

      try {
        const assignments = await carePlansAPI.getByResidentId(residentId);
        const allAssignments = Array.isArray(assignments) ? assignments : [];
        
        const now = new Date();
        const sortedByStart = [...allAssignments].sort((a: any, b: any) => {
          const da = new Date(a?.start_date || a?.createdAt || 0).getTime();
          const db = new Date(b?.start_date || b?.createdAt || 0).getTime();
          return db - da;
        });
        
        const activeAssignmentOnly = sortedByStart.find((a: any) => {
          const notExpired = !a?.end_date || new Date(a.end_date) >= now;
          const notCancelled = !['cancelled', 'completed', 'expired'].includes(String(a?.status || '').toLowerCase());
          return notExpired && notCancelled;
        });
        
        const currentAssignment = activeAssignmentOnly || sortedByStart[0];
        const validAssignments = currentAssignment ? [currentAssignment] : [];
        
        setCarePlanAssignments(validAssignments);
        
        const allCarePlans: any[] = [];
        for (const assignment of validAssignments) {
          const currentCarePlanIds = assignment.care_plan_ids || [];
          if (currentCarePlanIds.length > 0) {
            const carePlanPromises = currentCarePlanIds.map(async (plan: any) => {
              const planId = plan._id || plan;
              try {
                const planData = await carePlansAPI.getById(planId);
                return { 
                  ...planData, 
                  assignment_id: assignment._id,
                  assignment_start_date: assignment.start_date,
                  assignment_end_date: assignment.end_date
                };
              } catch (err) {
                return { 
                  ...plan, 
                  assignment_id: assignment._id,
                  assignment_start_date: assignment.start_date,
                  assignment_end_date: assignment.end_date
                };
              }
            });
            
            const carePlanData = await Promise.all(carePlanPromises);
            allCarePlans.push(...carePlanData);
          }
        }
        setCarePlanDetails(allCarePlans);
      } catch (error) {
      }
    };

    loadCarePlanAssignments();
  }, [residentId, lastRefresh]);

  useEffect(() => {
    const loadRoomAndBedInfo = async () => {
      if (carePlanAssignments.length === 0) return;

      setRoomLoading(true);
      setBedLoading(true);

      try {
        const firstAssignment = carePlanAssignments[0];
        
        const assignedRoomId = firstAssignment.bed_id?.room_id || firstAssignment.assigned_room_id;
        const roomIdString = typeof assignedRoomId === 'object' && assignedRoomId?._id ? assignedRoomId._id : assignedRoomId;
        if (roomIdString) {
          const room = await roomsAPI.getById(roomIdString);
          setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
        } else {
          setRoomNumber('Chưa hoàn tất đăng kí');
        }

        const assignedBedId = firstAssignment.assigned_bed_id;
        const bedIdString = typeof assignedBedId === 'object' && assignedBedId?._id ? assignedBedId._id : assignedBedId;
        if (bedIdString) {
          const bed = await bedsAPI.getById(bedIdString);
          setBedNumber(bed?.bed_number || 'Chưa hoàn tất đăng kí');
        } else {
          setBedNumber('Chưa hoàn tất đăng kí');
        }
      } catch (error) {
        setRoomNumber('Chưa hoàn tất đăng kí');
        setBedNumber('Chưa hoàn tất đăng kí');
      } finally {
        setRoomLoading(false);
        setBedLoading(false);
      }
    };

    loadRoomAndBedInfo();
  }, [carePlanAssignments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    try {
      const end = new Date(endDate);
      const now = new Date();
      return end < now;
    } catch (error) {
      return false;
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const totalMonthlyCost = carePlanDetails.reduce((total, plan) => total + (plan.monthly_price || 0), 0);
  const roomMonthlyCost = 0; 
  const carePlansMonthlyCost = totalMonthlyCost;

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

  if (!resident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 shadow-lg text-center max-w-md">
          <ExclamationTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Không tìm thấy thông tin
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Người cao tuổi này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/staff/residents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium no-underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-8">
      <div className="max-w-6xl mx-auto">
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
                   
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 m-0">
                Tổng quan gói dịch vụ
              </h2>
              <p className="text-base text-slate-600 mt-1">
                Thông tin chi tiết về tất cả gói dịch vụ đang sử dụng
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>{autoRefreshEnabled ? 'Tự động cập nhật' : 'Tắt cập nhật'}</span>
              </div>
              
              <button
                onClick={refreshData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                title="Làm mới dữ liệu"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Làm mới</span>
              </button>
              
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  autoRefreshEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={autoRefreshEnabled ? 'Tắt tự động cập nhật' : 'Bật tự động cập nhật'}
              >
                {autoRefreshEnabled ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 shadow-lg border border-white/20">
          <div className="grid gap-8">
            
            
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
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-slate-800 m-0">
                            {carePlan.plan_name}
                          </h4>
                          {carePlan.assignment_end_date && (
                            isExpired(carePlan.assignment_end_date) ? (
                              <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full border border-red-200 flex items-center gap-1">
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                Đã hết hạn
                              </span>
                            ) : (
                              (() => {
                                const daysLeft = getDaysUntilExpiry(carePlan.assignment_end_date);
                                if (daysLeft !== null && daysLeft <= 7) {
                                  return (
                                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                                      <ClockIcon className="w-3 h-3" />
                                      Còn {daysLeft} ngày
                                    </span>
                                  );
                                }
                                return null;
                              })()
                            )
                          )}
                        </div>
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
                    
                    <div className={`rounded-xl p-4 mb-6 border ${
                      carePlan.assignment_end_date && isExpired(carePlan.assignment_end_date)
                        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                        : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <ClockIcon className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                              Ngày bắt đầu
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 m-0">
                            {carePlan.assignment_start_date ? formatDate(carePlan.assignment_start_date) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <CalendarIcon className={`w-4 h-4 ${
                              carePlan.assignment_end_date && isExpired(carePlan.assignment_end_date)
                                ? 'text-red-600'
                                : 'text-purple-600'
                            }`} />
                            <span className={`text-xs font-semibold ${
                              carePlan.assignment_end_date && isExpired(carePlan.assignment_end_date)
                                ? 'text-red-700'
                                : 'text-purple-700'
                            }`}>
                              Ngày kết thúc
                            </span>
                          </div>
                          <p className={`text-sm font-semibold m-0 ${
                            carePlan.assignment_end_date && isExpired(carePlan.assignment_end_date)
                              ? 'text-red-800'
                              : 'text-slate-800'
                          }`}>
                            {carePlan.assignment_end_date ? formatDate(carePlan.assignment_end_date) : 'Không có thời hạn'}
                          </p>
                          {carePlan.assignment_end_date && isExpired(carePlan.assignment_end_date) && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              ⚠️ Gói dịch vụ đã hết hạn
                            </p>
                          )}
                          {carePlan.assignment_end_date && !isExpired(carePlan.assignment_end_date) && (() => {
                            const daysLeft = getDaysUntilExpiry(carePlan.assignment_end_date);
                            if (daysLeft !== null && daysLeft <= 7) {
                              return (
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                  ⏰ Còn {daysLeft} ngày nữa sẽ hết hạn
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                    
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

           
          </div>
        </div>
      </div>
    </div>
  );
}
