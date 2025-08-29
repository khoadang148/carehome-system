"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ArrowLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { carePlansAPI, carePlanAssignmentsAPI, residentAPI, userAPI, roomsAPI, bedAssignmentsAPI } from '@/lib/api';

const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return '/default-avatar.svg';
  
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;
  
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [relatives, setRelatives] = useState<any[]>([]);
  const [selectedRelative, setSelectedRelative] = useState<any>(null);
  const [residentCarePlans, setResidentCarePlans] = useState<any[]>([]);
  const [residentCarePlanDetail, setResidentCarePlanDetail] = useState<any>(null);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [loadingCarePlanDetail, setLoadingCarePlanDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedNumber, setBedNumber] = useState<string>('Chưa phân giường');
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomPrice, setRoomPrice] = useState<number>(0);
  const [expandedServices, setExpandedServices] = useState<{ [key: number]: boolean }>({});

  const residentId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'family') {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const loadRelatives = async () => {
      try {
        setLoading(true);
        const response = await residentAPI.getByFamilyMemberId(user?.id || '');
        const relativesData = Array.isArray(response) ? response : [];
        setRelatives(relativesData);
        
        const selected = relativesData.find((r: any) => r._id === residentId);
        if (selected) {
          setSelectedRelative(selected);
        } else if (relativesData.length > 0) {
          setSelectedRelative(relativesData[0]);
        }
      } catch (error) {
        console.error('Error loading relatives:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadRelatives();
    }
  }, [user?.id, residentId]);

  useEffect(() => {
    const loadCarePlans = async () => {
      if (!selectedRelative?._id) return;

      try {
        const response = await carePlanAssignmentsAPI.getByResidentId(selectedRelative._id);
        setResidentCarePlans(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error loading care plans:', error);
      }
    };

    loadCarePlans();
  }, [selectedRelative?._id]);

  useEffect(() => {
    const loadCarePlanDetail = async () => {
      if (!selectedRelative?._id || residentCarePlans.length === 0) return;

      try {
        setLoadingCarePlanDetail(true);
        
        const allAssignments = await carePlanAssignmentsAPI.getByResidentId(selectedRelative._id);
        setCarePlanAssignments(Array.isArray(allAssignments) ? allAssignments : []);
        
        const allCarePlanIds: any[] = [];
        if (Array.isArray(allAssignments)) {
          allAssignments.forEach((assignment: any) => {
            if (Array.isArray(assignment.care_plan_ids)) {
              assignment.care_plan_ids.forEach((plan: any) => {
                const planId = plan._id || plan;
                if (!allCarePlanIds.find(p => (p._id || p) === planId)) {
                  allCarePlanIds.push(plan);
                }
              });
            }
          });
        }
        
        if (allCarePlanIds.length > 0) {
          const carePlanPromises = allCarePlanIds.map(async (plan: any) => {
            const planId = plan._id || plan;
            try {
              const planData = await carePlansAPI.getById(planId);
              return planData;
            } catch (err) {
              return plan; 
            }
          });
          
          const carePlanData = await Promise.all(carePlanPromises);
          setCarePlanDetails(carePlanData);
        } else {
          setCarePlanDetails([]);
        }
        
        if (allAssignments.length > 0) {
          setResidentCarePlanDetail(allAssignments[0]);
          
          const assignmentWithRoomCost = allAssignments.find((assignment: any) => 
            assignment.room_monthly_cost && assignment.room_monthly_cost > 0
          );
          if (assignmentWithRoomCost) {
            setRoomPrice(assignmentWithRoomCost.room_monthly_cost);
          }
        }
      } catch (error) {
        console.error('Error loading care plan detail:', error);
      } finally {
        setLoadingCarePlanDetail(false);
      }
    };

    loadCarePlanDetail();
  }, [selectedRelative?._id, residentCarePlans]);

  useEffect(() => {
    if (!selectedRelative?._id) {
      setRoomNumber('Chưa hoàn tất đăng kí');
      setBedNumber('Chưa phân giường');
      setRoomPrice(0);
      return;
    }
    setRoomLoading(true);
    bedAssignmentsAPI.getByResidentId(selectedRelative._id)
      .then((assignments: any[]) => {
        const assignment = Array.isArray(assignments) ? assignments.find(a => a.bed_id?.room_id) : null;
        if (assignment?.bed_id?.room_id) {
          if (typeof assignment.bed_id.room_id === 'object' && assignment.bed_id.room_id.room_number) {
            setRoomNumber(assignment.bed_id.room_id.room_number);
            if (assignment.bed_id.room_id.monthly_price) {
              setRoomPrice(assignment.bed_id.room_id.monthly_price);
            }
          } else {
            const roomId = assignment.bed_id.room_id._id || assignment.bed_id.room_id;
            if (roomId) {
              return roomsAPI.getById(roomId)
                .then((room: any) => {
                  setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
                  setRoomPrice(room?.monthly_price || 0);
                })
                .catch(() => {
                  setRoomNumber('Chưa hoàn tất đăng kí');
                  setRoomPrice(0);
                });
            } else {
              setRoomNumber('Chưa hoàn tất đăng kí');
              setRoomPrice(0);
            }
          }
          
          if (assignment.bed_id) {
            if (typeof assignment.bed_id === 'object' && assignment.bed_id.bed_number) {
              setBedNumber(assignment.bed_id.bed_number);
            } else {
              const bedId = typeof assignment.bed_id === 'object' && assignment.bed_id?._id ? 
                assignment.bed_id._id : assignment.bed_id;
              setBedNumber(bedId || 'Chưa phân giường');
            }
          } else {
            setBedNumber('Chưa phân giường');
          }
        } else {
          return carePlanAssignmentsAPI.getByResidentId(selectedRelative._id)
            .then((careAssignments: any[]) => {
              const careAssignment = Array.isArray(careAssignments) ? careAssignments.find(a => a.bed_id?.room_id || a.assigned_room_id) : null;
              const roomId = careAssignment?.bed_id?.room_id || careAssignment?.assigned_room_id;
              const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
              if (roomIdString) {
                return roomsAPI.getById(roomIdString)
                  .then((room: any) => {
                    setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
                    setRoomPrice(room?.monthly_price || 0);
                  })
                  .catch(() => {
                    setRoomNumber('Chưa hoàn tất đăng kí');
                    setRoomPrice(0);
                  });
              } else {
                setRoomNumber('Chưa hoàn tất đăng kí');
                setRoomPrice(0);
              }
              
              if (careAssignment?.bed_id) {
                if (typeof careAssignment.bed_id === 'object' && careAssignment.bed_id.bed_number) {
                  setBedNumber(careAssignment.bed_id.bed_number);
                } else {
                  const bedId = typeof careAssignment.bed_id === 'object' && careAssignment.bed_id?._id ? 
                    careAssignment.bed_id._id : careAssignment.bed_id;
                  setBedNumber(bedId || 'Chưa phân giường');
                }
              } else {
                setBedNumber('Chưa phân giường');
              }
            })
            .catch(() => {
              setRoomNumber('Chưa hoàn tất đăng kí');
              setBedNumber('Chưa phân giường');
              setRoomPrice(0);
            });
        }
      })
      .catch(() => {
        setRoomNumber('Chưa hoàn tất đăng kí');
        setBedNumber('Chưa phân giường');
        setRoomPrice(0);
      })
      .finally(() => setRoomLoading(false));
  }, [selectedRelative?._id]);

  useEffect(() => {
    if (carePlanAssignments.length > 0 && roomPrice === 0) {
      const assignmentWithRoomCost = carePlanAssignments.find((assignment: any) => 
        assignment.room_monthly_cost && assignment.room_monthly_cost > 0
      );
      if (assignmentWithRoomCost) {
        setRoomPrice(assignmentWithRoomCost.room_monthly_cost);
      }
    }
  }, [carePlanAssignments, roomPrice]);

  useEffect(() => {
    if (carePlanAssignments.length === 0) {
      setRoomPrice(0);
    }
  }, [selectedRelative?._id, carePlanAssignments.length]);

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'from-green-500 to-emerald-500';
      case 'pending':
        return 'from-yellow-500 to-amber-500';
      case 'inactive':
      case 'rejected':
        return 'from-red-500 to-rose-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  

  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getAssignmentForCarePlan = (carePlanId: string) => {
    if (!Array.isArray(carePlanAssignments)) return null;
    
    return carePlanAssignments.find((assignment: any) => {
      if (Array.isArray(assignment.care_plan_ids)) {
        return assignment.care_plan_ids.some((plan: any) => {
          const planId = plan._id || plan;
          return planId === carePlanId;
        });
      }
      return false;
    });
  };

  const calculateTotalServiceCost = () => {
    if (!Array.isArray(carePlanDetails)) return 0;
    
    return carePlanDetails.reduce((total, carePlan) => {
      return total + (carePlan.monthly_price || 0);
    }, 0);
  };

  const getDisplayRoomPrice = () => {
    if (roomPrice > 0) return roomPrice;
    
    const totalServiceCost = calculateTotalServiceCost();
    if (totalServiceCost > 0) {
      return Math.round(totalServiceCost * 0.7);
    }
    
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!selectedRelative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy thông tin</h2>
          <p className="text-gray-600 mb-4">Không thể tìm thấy thông tin người thân</p>
          <button
            onClick={() => router.push('/family/services')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-8">
          <button
              onClick={() => router.push('/family/services')}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  Chi tiết dịch vụ
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Thông tin gói dịch vụ đã đăng ký
                </span>
              </div>
            </div>
          </div>

          {relatives.length > 1 && (
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
                <UserIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <label className="font-bold text-gray-800 text-lg tracking-tight mr-1 whitespace-nowrap">
                  Chọn người thân:
                </label>
                <select
                  value={selectedRelative._id}
                  onChange={(e) => {
                    const selected = relatives.find(r => r._id === e.target.value);
                    if (selected) {
                      setSelectedRelative(selected);
                      router.push(`/family/services/${selected._id}`);
                    }
                  }}
                  className="py-2 px-4 rounded-xl border-2 border-blue-200 text-base bg-white text-gray-800 font-semibold min-w-32 shadow-sm outline-none transition-all duration-200 cursor-pointer focus:border-blue-500 focus:shadow-lg focus:shadow-blue-100"
                  aria-label="Chọn người thân để xem thông tin dịch vụ"
                >
                  <option value="" disabled className="text-gray-500 bg-white">-- Chọn người thân --</option>
                  {relatives.map((relative) => (
                    <option key={relative._id} value={relative._id} className="text-gray-800 bg-white hover:bg-blue-50">
                      {relative.full_name || relative.name || 'Không có tên'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-6">
              <div className="text-center mb-6">
                
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg">
                  <img
                    src={getAvatarUrl(selectedRelative.avatar)}
                    alt={`Ảnh đại diện của ${selectedRelative.full_name || selectedRelative.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-700 font-medium text-sm mb-2">Tên người cao tuổi:</p>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedRelative.full_name || selectedRelative.name || 'Không có tên'}
                </h2>
              </div>
               
                              <div className="space-y-4">
                 <div>
                   <p className="text-gray-700 font-medium text-sm mb-2">Ngày sinh:</p>
                   <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                     <CalendarIcon className="w-5 h-5 text-blue-600" />
                     <span className="text-gray-900 font-medium">
                       {selectedRelative.date_of_birth || selectedRelative.dateOfBirth ? (
                         (() => {
                           const birthDate = new Date(selectedRelative.date_of_birth || selectedRelative.dateOfBirth);
                           const age = new Date().getFullYear() - birthDate.getFullYear();
                           const formattedDate = birthDate.toLocaleDateString('vi-VN', {
                             day: '2-digit',
                             month: '2-digit',
                             year: 'numeric'
                           });
                           return `${formattedDate} (${age} tuổi)`;
                         })()
                       ) : 'N/A'}
                     </span>
                   </div>
                 </div>
                 <div>
                   <p className="text-gray-700 font-medium text-sm mb-2">Số phòng:</p>
                   <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                     <HomeIcon className="w-5 h-5 text-green-600" />
                     <span className="text-gray-900 font-medium">
                       {roomLoading ? 'Đang tải...' : roomNumber}
                     </span>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Gói dịch vụ đã đăng ký</h3>
                    <p className="text-blue-100">Thông tin chi tiết về gói dịch vụ đang sử dụng</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingCarePlanDetail ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin dịch vụ...</p>
                  </div>
                ) : residentCarePlanDetail ? (
                  <div className="space-y-6">
                   

                     <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                       <div className="flex items-center space-x-3 mb-4">
                         <div className="bg-blue-100 p-2 rounded-lg">
                           <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                         </div>
                         <div>
                           <h4 className="font-bold text-gray-900 text-lg">Tổng chi phí dịch vụ</h4>
                           <p className="text-gray-600 text-sm">Chi phí hàng tháng bao gồm phòng và dịch vụ</p>
                         </div>
                       </div>
                       <div className="text-center">
                         <p className="text-3xl font-bold text-blue-600 mb-1">
                           {formatCurrency(getDisplayRoomPrice() + calculateTotalServiceCost())}
                         </p>
                         <p className="text-gray-600 text-sm mb-4">Mỗi tháng</p>
                         <div className="bg-white rounded-lg p-4 border border-blue-100">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="text-center">
                               <p className="text-gray-600 text-sm">Tiền phòng</p>
                               <p className="text-lg font-bold text-gray-900">
                                 {formatCurrency(getDisplayRoomPrice())}
                               </p>
                             </div>
                             <div className="text-center">
                               <p className="text-gray-600 text-sm">Tiền dịch vụ</p>
                               <p className="text-lg font-bold text-gray-900">
                                 {formatCurrency(calculateTotalServiceCost())}
                               </p>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                       <div className="flex items-center space-x-3 mb-4">
                         <div className="bg-blue-100 p-2 rounded-lg">
                           <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                         </div>
                         <div>
                           <h4 className="font-bold text-gray-900 text-lg">Gói dịch vụ đã đăng ký</h4>
                           <p className="text-gray-600 text-sm">Chi tiết các dịch vụ đang sử dụng</p>
                         </div>
                         <div className="ml-4">
                           <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                             Tổng: {carePlanDetails.length} gói dịch vụ
                           </span>
                         </div>
                       </div>
                       
                       <div className="space-y-4">
                         {carePlanDetails.map((carePlan: any, index: number) => {
                           const carePlanAssignment = getAssignmentForCarePlan(carePlan._id);
                           return (
                           <div key={index} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-1">
                             <div className="flex items-start justify-between mb-4">
                               <div className="flex-1">
                                 <h5 className="font-bold text-gray-900 text-lg mb-1">{carePlan.plan_name}</h5>
                                 <p className="text-gray-600 text-sm leading-relaxed">{carePlan.description}</p>
                               </div>
                               <div className="text-right ml-4">
                                 <div className="flex items-center space-x-1 mb-1">
                                   <span className="text-gray-500 text-xs">Giá:</span>
                                   <span className="text-lg font-bold text-blue-600">
                                     {formatCurrency(carePlan.monthly_price || 0)}
                                   </span>
                                 </div>
                                 <p className="text-gray-500 text-xs">mỗi tháng</p>
                               </div>
                             </div>
                             
                             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-3 border border-green-100">
                               <div className="grid grid-cols-2 gap-4">
                                 <div className="text-center">
                                   <div className="flex items-center justify-center space-x-1 mb-1">
                                     <ClockIcon className="w-4 h-4 text-green-600" />
                                     <span className="text-green-700 text-xs font-medium">Ngày bắt đầu</span>
                                   </div>
                                   <p className="text-sm font-semibold text-gray-900">
                                     {carePlanAssignment?.start_date ? formatDate(carePlanAssignment.start_date) : 'N/A'}
                                   </p>
                                 </div>
                                 <div className="text-center">
                                   <div className="flex items-center justify-center space-x-1 mb-1">
                                     <CalendarIcon className="w-4 h-4 text-purple-600" />
                                     <span className="text-purple-700 text-xs font-medium">Ngày kết thúc</span>
                                   </div>
                                   <p className="text-sm font-semibold text-gray-900">
                                     {carePlanAssignment?.end_date ? formatDate(carePlanAssignment.end_date) : 'Không có thời hạn'}
                                   </p>
                                 </div>
                               </div>
                             </div>
                             
                             
                             <div className="border-t border-gray-100 pt-3">
                               <p className="text-gray-700 text-sm font-medium mb-2">Dịch vụ bao gồm:</p>
                               <div className="flex flex-wrap gap-2">
                                 {carePlan.services_included?.slice(0, expandedServices[index] ? undefined : 4).map((service: string, serviceIndex: number) => (
                                   <span key={serviceIndex} className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                     {service}
                                   </span>
                                 ))}
                                                                   {carePlan.services_included?.length > 4 && !expandedServices[index] && (
                                    <button
                                      onClick={() => toggleServiceExpansion(index)}
                                      className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium hover:bg-blue-200 transition-colors cursor-pointer flex items-center space-x-1"
                                      aria-label={`Xem thêm ${carePlan.services_included.length - 4} dịch vụ khác của ${carePlan.plan_name}`}
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
                                      className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200 font-medium hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-1"
                                      aria-label={`Thu gọn danh sách dịch vụ của ${carePlan.plan_name}`}
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
                         );
                       })}
                         {carePlanDetails.length === 0 && (
                           <div className="text-center py-8">
                             <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                             <p className="text-gray-500 font-medium">Chưa có gói dịch vụ nào</p>
                             <p className="text-gray-400 text-sm mt-1">Hãy đăng ký dịch vụ để bắt đầu</p>
                           </div>
                         )}
                       </div>
                     </div>



                       <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                         <div className="flex items-center space-x-3 mb-4">
                           <div className="bg-green-100 p-2 rounded-lg">
                             <HomeIcon className="w-6 h-6 text-green-600" />
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-900 text-lg">Phòng & Giường</h4>
                             <p className="text-gray-600 text-sm">Vị trí lưu trú hiện tại</p>
                           </div>
                         </div>
                                                   <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="bg-white rounded-lg p-3 border border-green-100">
                                <p className="text-gray-600 text-sm mb-1">Phòng</p>
                                                                 <p className="text-xl font-bold text-green-600">
                                   {roomLoading ? 'Đang tải...' : roomNumber}
                                 </p>
                               </div>
                             </div>
                             <div className="text-center">
                               <div className="bg-white rounded-lg p-3 border border-green-100">
                                 <p className="text-gray-600 text-sm mb-1">Giường</p>
                                 <p className="text-xl font-bold text-green-600">
                                   {roomLoading ? 'Đang tải...' : bedNumber}
                                 </p>
                              </div>
                            </div>
                          </div>
                       </div>

                    

                   </div>
                 ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có gói dịch vụ</h3>
                                         <p className="text-gray-600 mb-4">
                       {selectedRelative.full_name || selectedRelative.name || 'Người thân'} chưa đăng ký gói dịch vụ nào
                     </p>
                    <button
                      onClick={() => router.push('/family/services')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Chuyển đến trang đăng ký dịch vụ mới"
                    >
                      Đăng ký dịch vụ mới
                    </button>
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