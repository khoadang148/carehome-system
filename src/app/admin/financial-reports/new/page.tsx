'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { residentAPI, staffAPI, billsAPI, carePlansAPI, roomsAPI, bedAssignmentsAPI, carePlanAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';
import { getCompletedResidents } from '@/lib/utils/resident-status';
import { clientStorage } from '@/lib/utils/clientStorage';
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
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [due_date, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [billingDetails, setBillingDetails] = useState<any>(null);
  const [existingBills, setExistingBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Quick helper: concurrency limiter
  const withConcurrency = async <T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> => {
    const results: R[] = new Array(items.length) as R[];
    let idx = 0;
    const workers: Promise<void>[] = [];
    const run = async () => {
      while (idx < items.length) {
        const current = idx++;
        try {
          results[current] = await worker(items[current], current);
        } catch (e) {
          // @ts-ignore
          results[current] = null;
        }
      }
    };
    for (let i = 0; i < Math.max(1, limit); i++) workers.push(run());
    await Promise.all(workers);
    return results;
  };

  const fetchResidentsWithRooms = async () => {
    try {
      // 1) Show cached list immediately (if any)
      try {
        const cachedRaw = clientStorage.getItem('billingValidResidentsCache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached?.data) && cached?.data.length > 0) {
            setResidents(cached.data);
            setFilteredResidents(cached.data);
          }
        }
      } catch {}

      // 2) Recompute in background: fetch core lists in parallel
      const [allResidents, billsData] = await Promise.all([
        // residentAPI.getAll is already cached in lib/api.ts
        residentAPI.getAll().catch(() => []),
        billsAPI.getAll().catch(() => []),
      ]);
      setExistingBills(billsData);

      // Pre-filter by active status to reduce work
      const activeResidents = (allResidents || []).filter((r: any) => String(r?.status || '').toLowerCase() === 'active');

      // 3) Validate active service for each resident with limited concurrency
      const evaluated = await withConcurrency<any, any>(activeResidents, 6, async (resident) => {
        try {
          const assignments = await carePlanAssignmentsAPI.getByResidentId(resident._id);
          const now = new Date();
          const hasValidAssignment = Array.isArray(assignments) && assignments.some((a: any) => {
            const notExpired = !a?.end_date || new Date(a.end_date) >= now;
            const notCancelled = !['cancelled', 'completed', 'expired'].includes(String(a?.status || '').toLowerCase());
            const isActive = a?.status === 'active' || !a?.status;
            return notExpired && notCancelled && isActive;
          });
          if (!hasValidAssignment) return null;

          const hasExistingBills = billsData.some((bill: any) => bill.resident_id === resident._id || bill.resident_id?._id === resident._id);
          return {
            ...resident,
            room_number: resident.roomNumber || 'Chưa hoàn tất đăng ký',
            hasExistingBills,
            isNewResident: !hasExistingBills,
          };
        } catch {
          return null;
        }
      });

      const validResidents = evaluated.filter(Boolean);
      setResidents(validResidents);
      setFilteredResidents(validResidents);

      // 4) Cache for instant open next time (TTL ~ 60s)
      try {
        clientStorage.setItem('billingValidResidentsCache', JSON.stringify({ ts: Date.now(), data: validResidents }));
      } catch {}

      setLastUpdate(new Date());
    } catch (error) {
      // Keep any cached state if present
      if (!residents.length) {
        setResidents([]);
        setFilteredResidents([]);
      }
    } finally {
      setLoadingResidents(false);
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    setLoadingResidents(true);
    setLoadingBills(true);

    // Kick off fetch; cached data (if any) will render instantly
    fetchResidentsWithRooms();
    staffAPI.getAll().then(setStaffs);

    if (user && (user.role === 'staff' || user.role === 'admin')) {
      setStaffId(user.id);
    }

    const setDefaultDueDate = () => {
      const now = new Date();
      // Mặc định là ngày 5 tháng tiếp theo (cho resident cũ)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
      const yyyy = nextMonth.getFullYear();
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const dd = String(nextMonth.getDate()).padStart(2, '0');
      const defaultDueDate = `${yyyy}-${mm}-${dd}`;
      setDueDate(defaultDueDate);

      const month = nextMonth.getMonth() + 1;
      const year = nextMonth.getFullYear();
      setTitle(`Hóa đơn tháng ${month}/${year} cho tất cả dịch vụ`);
      setNotes(`Chưa thanh toán cho tất cả dịch vụ và phòng tháng ${month}/${year}`);
    };

    setDefaultDueDate();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loadingResidents && !loadingBills) {
        fetchResidentsWithRooms();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loadingResidents, loadingBills]);

  useEffect(() => {
    if (!residentSearchTerm.trim()) {
      setFilteredResidents(residents);
      return;
    }

    const searchTerm = residentSearchTerm.toLowerCase();
    const filtered = residents.filter(r =>
      r?.full_name?.toLowerCase().includes(searchTerm) ||
      r?.phone?.includes(searchTerm)
    );
    setFilteredResidents(filtered);
  }, [residentSearchTerm, residents]);

  useEffect(() => {
    if (resident_id) {
      setLoadingAssignments(true);

      const fetchCurrentAssignment = async () => {
        try {
          const assignments = await carePlanAssignmentsAPI.getByResidentId(resident_id);

          if (Array.isArray(assignments) && assignments.length > 0) {
            const now = new Date();
            const activeAssignment = assignments.find((a: any) => {
              const notExpired = !a?.end_date || new Date(a.end_date) >= now;
              const notCancelled = !['cancelled', 'completed', 'expired'].includes(String(a?.status || '').toLowerCase());
              const isActive = a?.status === 'active' || !a?.status;

              return notExpired && notCancelled && isActive;
            });

            if (activeAssignment) {
              setCurrentAssignmentId(activeAssignment._id);

              const selectedResident = residents.find(r => r._id === resident_id);
              const isNewResident = selectedResident?.isNewResident;

              // Lấy thông tin phòng trực tiếp
              let roomInfo: any = null;
              try {
                // Thử lấy từ bed assignments trước
                const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident_id);
                const bedAssignment = bedAssignments.find((a: any) => a.bed_id?.room_id);
                
                if (bedAssignment?.bed_id?.room_id) {
                  const roomData = bedAssignment.bed_id.room_id;
                  if (typeof roomData === 'object' && roomData.room_number) {
                    roomInfo = roomData;
                  } else {
                    const roomId = roomData._id || roomData;
                    if (roomId) {
                      const room = await roomsAPI.getById(roomId);
                      roomInfo = room;
                    }
                  }
                } else {
                  // Thử lấy từ care plan assignment
                  const roomId = activeAssignment?.bed_id?.room_id || activeAssignment?.assigned_room_id;
                  if (roomId) {
                    const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
                    if (roomIdString) {
                      const room = await roomsAPI.getById(roomIdString);
                      roomInfo = room;
                    }
                  }
                }

                // Lấy giá phòng từ room_types nếu có roomInfo
                if (roomInfo && roomInfo.room_type) {
                  try {
                    const { roomTypesAPI } = await import('@/lib/api');
                    const roomTypes = await roomTypesAPI.getAll();
                    const roomType = roomTypes.find((type: any) => type.room_type === roomInfo.room_type);
                    
                    if (roomType && roomType.monthly_price) {
                      roomInfo.monthly_price = roomType.monthly_price;
                    }
                  } catch (error) {
                    console.error('Error fetching room type price:', error);
                  }
                }
              } catch (error) {
                console.error('Error fetching room info:', error);
              }

              if (isNewResident) {
                billsAPI.calculateTotal(resident_id)
                  .then(totalCalculation => {
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const remainingDays = lastDayOfMonth - now.getDate() + 1;

                    // Cộng thêm tiền phòng vào tổng
                    const roomPrice = roomInfo?.monthly_price || 0;
                    const totalWithRoom = totalCalculation.totalAmount + roomPrice;

                    // Công thức đúng: (giá tổng các gói chăm sóc + tiền phòng) / 30 + (giá tổng các gói chăm sóc + tiền phòng)
                    const dailyRate = totalWithRoom / 30;
                    const remainingDaysAmount = dailyRate * remainingDays; // Hóa đơn tháng hiện tại (còn lại)
                    const fullMonthAmount = totalWithRoom; // Tiền cọc tháng tiếp theo (đầy đủ)
                    const totalAmount = remainingDaysAmount + fullMonthAmount; // Tổng = Hóa đơn + Tiền cọc

                    setAmount(totalAmount.toString());
                    setBillingDetails({
                      ...totalCalculation,
                      roomInfo, // Thêm thông tin phòng
                      isNewResident: true,
                      remainingDays,
                      remainingDaysAmount,
                      fullMonthAmount,
                      totalAmount,
                      roomPrice, // Thêm giá phòng riêng
                      totalWithRoom, // Thêm tổng bao gồm phòng (dịch vụ + phòng)
                      // Thêm thông tin chi tiết để hiển thị
                      serviceCost: totalCalculation.totalAmount,
                      roomCost: roomPrice,
                      totalServiceAndRoom: totalWithRoom
                    });

                    // Resident mới: hạn thanh toán là cuối tháng hiện tại
                    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
                    const yyyy = endOfCurrentMonth.getFullYear();
                    const mm = String(endOfCurrentMonth.getMonth() + 1).padStart(2, '0');
                    const dd = String(endOfCurrentMonth.getDate()).padStart(2, '0');
                    setDueDate(`${yyyy}-${mm}-${dd}`);

                    const currentMonthName = now.toLocaleDateString('vi-VN', { month: 'long' });
                    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
                    const nextMonthName = nextMonth.toLocaleDateString('vi-VN', { month: 'long' });

                    setTitle(`Hóa đơn ${currentMonthName} (${remainingDays} ngày) + Tiền cọc ${nextMonthName}`);
                    setNotes(`Hóa đơn tháng ${currentMonthName} cho ${remainingDays} ngày còn lại + tiền cọc tháng ${nextMonthName}. Bao gồm tiền phòng và tất cả dịch vụ đã đăng ký.`);
                  })
                  .catch((error) => {
                    setAmount('');
                    setBillingDetails(null);
                    setTitle('');
                    setNotes('');
                  })
                  .finally(() => setLoadingAssignments(false));
              } else {
                billsAPI.calculateTotal(resident_id)
                  .then(totalCalculation => {
                    // Đối với resident cũ, kiểm tra xem totalCalculation đã bao gồm phòng chưa
                    const roomPrice = roomInfo?.monthly_price || 0;
                    
                    // Kiểm tra xem totalCalculation đã bao gồm phòng chưa
                    const hasRoomInTotal = totalCalculation.roomDetails && totalCalculation.totalRoomCost > 0;
                    
                    // Nếu đã có phòng trong total, sử dụng trực tiếp
                    // Nếu chưa có, cộng thêm tiền phòng
                    const finalAmount = hasRoomInTotal ? totalCalculation.totalAmount : (totalCalculation.totalAmount + roomPrice);

                    setAmount(finalAmount.toString());
                    setBillingDetails({
                      ...totalCalculation,
                      roomInfo, // Thêm thông tin phòng
                      roomPrice, // Thêm giá phòng riêng
                      totalWithRoom: finalAmount, // Sử dụng finalAmount
                      hasRoomIncluded: hasRoomInTotal // Flag để biết đã bao gồm phòng chưa
                    });
                    const month = due_date ? new Date(due_date).getMonth() + 1 : '';
                    const year = due_date ? new Date(due_date).getFullYear() : '';
                    setTitle(`Hóa đơn tháng ${month}/${year} cho tất cả dịch vụ`);
                    setNotes(`Chưa thanh toán cho tất cả dịch vụ và phòng tháng ${month}/${year}`);
                  })
                  .catch((error) => {
                    setAmount('');
                    setBillingDetails(null);
                    setTitle('');
                    setNotes('');
                  })
                  .finally(() => setLoadingAssignments(false));
              }
            } else {
              setCurrentAssignmentId('');
              setAmount('0');
              setBillingDetails(null);
              setTitle('');
              setNotes('');
              setLoadingAssignments(false);
            }
          } else {
            setCurrentAssignmentId('');
            setAmount('0');
            setBillingDetails(null);
            setTitle('');
            setNotes('');
            setLoadingAssignments(false);
          }
        } catch (error) {
          setCurrentAssignmentId('');
          setAmount('0');
          setBillingDetails(null);
          setTitle('');
          setNotes('');
          setLoadingAssignments(false);
        }
      };

      fetchCurrentAssignment();
    } else {
      setAmount('');
      setBillingDetails(null);
      setTitle('');
      setNotes('');
      setCurrentAssignmentId('');
    }
  }, [resident_id, due_date]);

  useEffect(() => {
    if (resident_id && due_date) {
      const month = new Date(due_date).getMonth() + 1;
      const year = new Date(due_date).getFullYear();
      setTitle(`Hóa đơn tháng ${month}/${year} cho tất cả dịch vụ`);
      setNotes(`Chưa thanh toán cho tất cả dịch vụ và phòng tháng ${month}/${year}`);
    }
  }, [due_date, resident_id]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!resident_id) {
      errors.resident_id = 'Vui lòng chọn người cao tuổi';
    }

    if (!currentAssignmentId) {
      errors.care_plan_assignment_id = 'Không tìm thấy gói dịch vụ hiện tại cho người cao tuổi này';
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

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (!currentAssignmentId) {
        setError('Không tìm thấy gói dịch vụ hiện tại cho người cao tuổi này. Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }

      await billsAPI.create({
        resident_id,
        care_plan_assignment_id: currentAssignmentId,
        staff_id,
        amount: Number(amount),
        due_date: due_date ? new Date(due_date).toISOString() : '',
        title,
        notes
      });

      setShowSuccessModal(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 60);

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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="rounded-2xl shadow bg-gradient-to-r from-blue-200 to-indigo-200 px-8 py-8 mb-8 flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <button
                onClick={() => router.push('/admin/financial-reports')}
                className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Tạo hóa đơn</h1>
                  <p className="text-gray-600 text-base">Nhập thông tin hóa đơn cho người cao tuổi</p>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b-2 border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  Thông tin cơ bản
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Người cao tuổi <span className="text-red-500">*</span>
                    </label>

                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Tìm kiếm người cao tuổi theo tên..."
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

                    <div className="relative">
                      <select
                        value={resident_id}
                        onChange={e => {
                          setResidentId(e.target.value);
                          setValidationErrors(prev => ({ ...prev, resident_id: undefined }));
                          if (e.target.value) {
                            setResidentSearchTerm('');
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors.resident_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        <option value="">Chọn người cao tuổi</option>
                        {residents.length === 0 && !loadingResidents && (
                          <option value="" disabled>Không có người cao tuổi nào</option>
                        )}
                        {(filteredResidents.length > 0 ? filteredResidents : residents).map(r => {
                          const isNewResident = r?.isNewResident;
                          return (
                            <option key={r?._id} value={r?._id}>
                              {r?.full_name} {isNewResident ? '(MỚI)' : ''}
                            </option>
                          );
                        })}
                      </select>

                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Hiển thị: {filteredResidents.length > 0 ? filteredResidents.length : residents.length} / {residents.length} người cao tuổi
                      </div>

                      {!loadingBills && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-600 font-medium">
                              {residents.filter(r => r?.isNewResident).length} người cao tuổi mới
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-600 font-medium">
                              {residents.filter(r => !r?.isNewResident).length} người cao tuổi hiện có
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {validationErrors.resident_id && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationErrors.resident_id}
                      </p>
                    )}

                    {resident_id && residents.find(r => r._id === resident_id)?.isNewResident && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">
                              Người cao tuổi mới hoàn tất đăng ký
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Đây là hóa đơn đầu tiên cho người cao tuổi này. Hệ thống sẽ tự động tính toán tất cả dịch vụ và phòng.
                            </p>
                          </div>
                        </div>
                      </div>
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

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b-2 border-green-100">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="w-5 h-5 text-green-600" />
                  </div>
                  Thông tin dịch vụ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Tổng dịch vụ
                    </label>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            {billingDetails?.isNewResident ? 'Hóa đơn + tiền cọc' : 'Tổng tất cả gói dịch vụ'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {billingDetails?.isNewResident ? 'Hóa đơn tháng hiện tại + tiền cọc' : 'Bao gồm dịch vụ và phòng'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {loadingAssignments ? 'Đang tính...' : (billingDetails?.isNewResident ? 
                              formatDisplayCurrency(
                                // Hóa đơn tháng hiện tại
                                ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0) +
                                // + Tiền cọc tháng tiếp theo
                                ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))
                              ) : 
                              (amount ? formatDisplayCurrency(Number(amount)) : '0 ₫')
                            )}
                          </p>
                          
                        </div>
                      </div>
                    </div>
                    {!resident_id && (
                      <p className="text-gray-500 text-sm mt-2">Vui lòng chọn người cao tuổi để tính tổng tiền</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      Chi tiết
                    </label>
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 max-h-96 overflow-y-auto shadow-sm">
                      {loadingAssignments ? (
                        <div className="text-center py-4">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Đang tính toán...</p>
                        </div>
                      ) : billingDetails ? (
                        <div className="space-y-6">
                          {billingDetails.isNewResident && (
                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                                <span className="text-base font-bold text-green-800">Hóa đơn + Tiền cọc</span>
                              </div>
                              <div className="text-sm text-green-700 space-y-2 pl-2">
                                <p className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  Hóa đơn tháng hiện tại ({billingDetails.remainingDays} ngày)
                                </p>
                                <p className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                  + Tiền cọc tháng tiếp theo
                                </p>
                                <p className="flex items-center gap-2 font-semibold">
                                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                  Tổng: {formatDisplayCurrency(
                                      // Hóa đơn tháng hiện tại
                                      ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0) +
                                      // + Tiền cọc tháng tiếp theo
                                      ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))
                                    )}
                                </p>
                              </div>
                            </div>
                          )}

                          {billingDetails.serviceDetails && billingDetails.serviceDetails.length > 0 && (
                            <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <h4 className="text-base font-bold text-blue-900">Gói dịch vụ</h4>
                              </div>
                              <div className="space-y-3">
                                {billingDetails.serviceDetails.map((service: any, index: number) => (
                                  <div key={index} className="p-4 bg-white rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 break-words">{service.plan_name}</p>
                                        <p className="text-xs text-gray-600 mt-1 break-words">{service.description}</p>
                                      </div>
                                      <div className="flex-shrink-0">
                                        <p className="text-sm font-bold text-blue-600 whitespace-nowrap">
                                          {formatDisplayCurrency(service.monthly_price)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-4 border-t-2 border-blue-200 bg-white rounded-lg p-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-blue-900">Tổng tiền dịch vụ:</span>
                                  <span className="font-bold text-blue-600 text-base">
                                    {formatDisplayCurrency(billingDetails.totalServiceCost)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {billingDetails.roomInfo && (
                            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                  </svg>
                                </div>
                                <h4 className="text-base font-bold text-green-900">Thông tin phòng</h4>
                                
                              </div>
                              <div className="p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 break-words">
                                      Phòng {billingDetails.roomInfo.room_number}
                                    </p>
                                    
                                  </div>
                                  <div className="flex-shrink-0">
                                    <p className="text-sm font-bold text-green-600 whitespace-nowrap">
                                      {billingDetails.roomInfo.monthly_price ? 
                                        formatDisplayCurrency(billingDetails.roomInfo.monthly_price) : 
                                        'Chưa có giá'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t-2 border-green-200 bg-white rounded-lg p-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-green-900">Tiền phòng</span>
                                  <span className="font-bold text-green-600 text-base">
                                    {billingDetails.roomInfo.monthly_price ? 
                                      formatDisplayCurrency(billingDetails.roomInfo.monthly_price) : 
                                      'Chưa có giá'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Fallback: Hiển thị thông tin phòng từ billingDetails.roomDetails nếu không có roomInfo */}
                          {!billingDetails.roomInfo && billingDetails.roomDetails && (
                            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                  </svg>
                                </div>
                                <h4 className="text-base font-bold text-green-900">Thông tin phòng</h4>
                              </div>
                              <div className="p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 break-words">
                                      Phòng {billingDetails.roomDetails.room_number}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <p className="text-sm font-bold text-green-600 whitespace-nowrap">
                                      {formatDisplayCurrency(billingDetails.roomDetails.monthly_price)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t-2 border-green-200 bg-white rounded-lg p-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-green-900">Tổng tiền phòng:</span>
                                  <span className="font-bold text-green-600 text-base">
                                    {formatDisplayCurrency(billingDetails.totalRoomCost)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {billingDetails.isNewResident && (
                            <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <h4 className="text-base font-bold text-purple-900">Chi tiết tính tiền</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 shadow-sm">
                                  <span className="text-sm text-gray-700 flex-1 min-w-0 break-words">Tiền cơ bản mỗi tháng (dịch vụ + phòng):</span>
                                  <span className="text-sm font-bold text-blue-600 flex-shrink-0 whitespace-nowrap">
                                    {formatDisplayCurrency((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between gap-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-200 shadow-sm">
                                  <span className="text-sm text-gray-700 flex-1 min-w-0 break-words">Hóa đơn tháng hiện tại ({billingDetails.remainingDays} ngày):</span>
                                  <span className="text-sm font-bold text-orange-600 flex-shrink-0 whitespace-nowrap">
                                    {formatDisplayCurrency(((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0))}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200 shadow-sm">
                                  <span className="text-sm text-gray-700 flex-1 min-w-0 break-words">+ Tiền cọc tháng tiếp theo:</span>
                                  <span className="text-sm font-bold text-green-600 flex-shrink-0 whitespace-nowrap">
                                  {formatDisplayCurrency((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between gap-3 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200 shadow-sm">
                                  <span className="text-sm text-gray-700 flex-1 min-w-0 break-words font-semibold">TỔNG CỘNG (HÓA ĐƠN + TIỀN CỌC):</span>
                                  <span className="text-sm font-bold text-indigo-600 flex-shrink-0 whitespace-nowrap">
                                    {formatDisplayCurrency(
                                      // Hóa đơn tháng hiện tại
                                      ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0) +
                                      // + Tiền cọc tháng tiếp theo
                                      ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                              </div>
                              <span className="text-base font-bold text-indigo-900">
                                {billingDetails.isNewResident ? 'TỔNG CỘNG (HÓA ĐƠN + TIỀN CỌC)' : 'TỔNG CỘNG'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-indigo-600">
                                {billingDetails.isNewResident ? 
                                  formatDisplayCurrency(
                                    // Hóa đơn tháng hiện tại
                                    ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0) +
                                    // + Tiền cọc tháng tiếp theo
                                    ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))
                                  ) : 
                                  (billingDetails.totalWithRoom ? 
                                    formatDisplayCurrency(billingDetails.totalWithRoom) : 
                                    formatDisplayCurrency(billingDetails.totalAmount)
                                  )
                                }
                              </span>
                            </div>
                            <p className="text-sm text-indigo-700 mt-2 font-medium">
                              {billingDetails.isNewResident ? 'Bao gồm hóa đơn tháng hiện tại + tiền cọc' : 'Tổng tất cả dịch vụ và phòng'}
                            </p>
                            {billingDetails.roomPrice && billingDetails.roomPrice > 0 && (
                              <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                                <div className="text-xs text-indigo-600">
                                  {billingDetails.isNewResident ? (
                                    <>
                                      
                                      <p>• Hóa đơn tháng hiện tại: {formatDisplayCurrency(((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0))}</p>
                                      <p>• Tiền cọc tháng tiếp theo: {formatDisplayCurrency((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))}</p>
                                      <p className="font-semibold">• TỔNG: {formatDisplayCurrency(
                                        // Hóa đơn tháng hiện tại
                                        ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0)) / 30 * (billingDetails.remainingDays || 0) +
                                        // + Tiền cọc tháng tiếp theo
                                        ((billingDetails.totalServiceCost || 0) + (billingDetails.roomPrice || 0))
                                      )}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p>• Dịch vụ (gói chăm sóc): {formatDisplayCurrency(billingDetails.totalServiceCost)}</p>
                                      <p>• Phòng: {formatDisplayCurrency(billingDetails.roomPrice)}</p>
                                      <p className="font-semibold">• Tổng: {formatDisplayCurrency(billingDetails.totalWithRoom)}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">Chưa có thông tin chi tiết</p>
                          <p className="text-xs text-gray-400 mt-1">Vui lòng chọn người cao tuổi</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b-2 border-purple-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                  </div>
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
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                      autoComplete="off"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      minDate={new Date()}
                    />
                    <div className="mt-3 flex items-center gap-3 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {resident_id && residents.find(r => r._id === resident_id)?.isNewResident 
                          ? 'Hạn thanh toán là cuối tháng hiện tại' 
                          : 'Hạn thanh toán là ngày 5 tháng tiếp theo'}
                      </span>
                    </div>
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
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
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

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-center gap-4 shadow-sm">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-8 border-t-2 border-gray-200 bg-gray-50 rounded-xl p-6 mt-8">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingResidents || residents.length === 0 || loadingAssignments || !amount || !staff_id || !currentAssignmentId}
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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl transform transition-all duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tạo hóa đơn thành công!</h3>
            <p className="text-gray-600 mb-6">Hóa đơn đã được tạo và lưu vào hệ thống thành công.</p>

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
