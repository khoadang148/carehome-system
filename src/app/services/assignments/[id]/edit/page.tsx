'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { carePlanAssignmentsAPI } from '@/lib/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CarePlanAssignment {
  id: string;
  status: string;
  start_date?: string;
  end_date?: string;
  care_plan_ids?: any[];
  resident_id?: string;
}

export default function EditCarePlanAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<CarePlanAssignment | null>(null);
  const [status, setStatus] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [startDateDisplay, setStartDateDisplay] = useState<string>('');
  const [endDateDisplay, setEndDateDisplay] = useState<string>('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedCarePlans, setSelectedCarePlans] = useState<string[]>([]);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const data = await carePlanAssignmentsAPI.getById(assignmentId);
        setAssignment(data);

        if (data.care_plan_ids && Array.isArray(data.care_plan_ids)) {
          setCarePlanDetails(data.care_plan_ids);
        }

        const isExpired = isAssignmentExpired(data.end_date);



        if (isExpired && data.status !== 'paused') {
          try {
            await carePlanAssignmentsAPI.update(assignmentId, { status: 'paused' });

            const updatedData = await carePlanAssignmentsAPI.getById(assignmentId);
            setAssignment(updatedData);
            setStatus(updatedData.status || '');

            if (updatedData.care_plan_ids && Array.isArray(updatedData.care_plan_ids)) {
              setCarePlanDetails(updatedData.care_plan_ids);
              const allPlanIds = updatedData.care_plan_ids?.map((plan: any) => plan._id || plan.id) || [];
              setSelectedCarePlans(allPlanIds);
            }
            return;
          } catch (error) {
          }
        }

        setStatus(data.status || '');

        if (isExpired) {
          const allPlanIds = data.care_plan_ids?.map((plan: any) => plan._id || plan.id) || [];
          setSelectedCarePlans(allPlanIds);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải thông tin phân công');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);

    // Allow editing end date for all statuses, not just when expired
    if (newStatus === 'active') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setStartDateDisplay(formatDate(today));
      
      // If assignment is expired, set end date to 6 months from today
      const isExpired = isAssignmentExpired(assignment?.end_date);
      if (isExpired) {
        const sixMonthsFromToday = new Date();
        // Tính đúng: cộng thêm 6 - 1 = 5 tháng, sau đó lấy ngày cuối tháng
        sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 5);
        // Lấy ngày cuối tháng
        const year = sixMonthsFromToday.getFullYear();
        const month = sixMonthsFromToday.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        sixMonthsFromToday.setDate(lastDay);
        const endDateStr = sixMonthsFromToday.toISOString().split('T')[0];
        setEndDate(endDateStr);
        setEndDateDisplay(formatDate(endDateStr));
      }
    } else {
      // For other statuses, clear dates but allow manual editing
      setStartDate('');
      setStartDateDisplay('');
      setEndDate('');
      setEndDateDisplay('');
    }
  };

  const handleCarePlanSelection = (planId: string, checked: boolean) => {
    if (checked) {
      setSelectedCarePlans(prev => [...prev, planId]);
    } else {
      setSelectedCarePlans(prev => prev.filter(id => id !== planId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      setError('Vui lòng chọn trạng thái');
      return;
    }

    const isExpired = isAssignmentExpired(assignment?.end_date);
    if (status === 'active' && isExpired) {
      if (!startDate) {
        setError('Vui lòng chọn ngày bắt đầu mới');
        return;
      }
      if (!endDate) {
        setError('Vui lòng chọn ngày kết thúc mới');
        return;
      }

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime())) {
        setError('Ngày bắt đầu không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
        return;
      }
      if (isNaN(endDateObj.getTime())) {
        setError('Ngày kết thúc không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy');
        return;
      }

      if (startDateObj >= endDateObj) {
        setError(`Ngày bắt đầu (${formatDate(startDate)}) phải trước ngày kết thúc (${formatDate(endDate)})`);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);



      const isExpired = isAssignmentExpired(assignment?.end_date);
      if (status === 'active') {
        const updateData = {
          end_date: endDate,
          start_date: startDate,
          status: 'active'
        };
        await carePlanAssignmentsAPI.update(assignmentId, updateData);
      } else {
        const updateData: any = { status };

        if (endDate) {
          updateData.end_date = endDate;
        }

        await carePlanAssignmentsAPI.update(assignmentId, updateData);
      }
      router.push(`/services/assignments/${assignmentId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/services/assignments/${assignmentId}`);
  };

  const getStatusText = (status: string, endDate?: string) => {
    if (endDate && new Date(endDate) < new Date()) {
      return 'Đã hết hạn';
    }

    const statusMap: { [key: string]: string } = {
      'consulting': 'Đang tư vấn',
      'packages_selected': 'Đã chọn gói',
      'room_assigned': 'Đã phân phòng',
      'payment_completed': 'Đã thanh toán',
      'active': 'Đang hoạt động',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy',
      'paused': 'Tạm dừng',
      'expired': 'Đã hết hạn'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string, endDate?: string) => {
    if (endDate && new Date(endDate) < new Date()) {
      return '#ef4444';
    }

    const colorMap: { [key: string]: string } = {
      'consulting': '#f59e0b',
      'packages_selected': '#3b82f6',
      'room_assigned': '#8b5cf6',
      'payment_completed': '#10b981',
      'active': '#059669',
      'completed': '#6b7280',
      'cancelled': '#ef4444',
      'paused': '#f97316',
      'expired': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isAssignmentExpired = (endDate?: string): boolean => {
    if (!endDate) return false;
    const endDateObj = new Date(endDate);
    return !isNaN(endDateObj.getTime()) && endDateObj < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 m-0">
            Đang tải thông tin phân công...
          </p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 shadow-xl text-center max-w-md">
          <ExclamationCircleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Không tìm thấy phân công
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {error}
          </p>
          <Link
            href="/services/assignments"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg no-underline text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-xl border border-white/20">
          <div className="flex items-center gap-4 mb-6">
          <button
              onClick={() => router.push('/services/assignments')}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <PencilIcon className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-800 m-0">
                    Gia hạn dịch vụ
                  </h1>
                  <p className="text-base text-gray-600 mt-1">
                    Cập nhật trạng thái và thông tin dịch vụ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {assignment && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 mb-8 border border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 m-0">
                  Trạng thái hiện tại
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Thông tin trạng thái dịch vụ hiện tại
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-xl p-6 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      Trạng thái
                    </span>
                  </div>
                  <p className="text-lg font-bold m-0" style={{ color: getStatusColor(assignment.status, assignment.end_date) }}>
                    {getStatusText(assignment.status, assignment.end_date)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      Ngày bắt đầu
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 m-0">
                    {assignment.start_date ? formatDate(assignment.start_date) : 'N/A'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700">
                      Ngày kết thúc
                    </span>
                  </div>
                  <p className="text-lg font-bold m-0" style={{ color: isAssignmentExpired(assignment?.end_date) ? '#ef4444' : '#059669' }}>
                    {assignment.end_date ? formatDate(assignment.end_date) : 'Không có thời hạn'}
                    {isAssignmentExpired(assignment?.end_date) && ' (Đã hết hạn)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 m-0">
                Cập nhật trạng thái
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Thay đổi trạng thái và cấu hình dịch vụ
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-6 text-sm flex items-center gap-2">
              <ExclamationCircleIcon className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Trạng thái mới *
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn trạng thái</option>
                <option value="active">Đang sử dụng</option>
                <option value="cancelled">Đã hủy</option>
                <option value="paused">Tạm dừng</option>
              </select>
            </div>

            {status === 'paused' && carePlanDetails.length > 0 && isAssignmentExpired(assignment?.end_date) && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 mb-8 border border-yellow-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-yellow-800 m-0">
                      Chọn gói dịch vụ để gia hạn
                    </h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      Chọn các gói dịch vụ cần gia hạn (tất cả gói được chọn sẵn nếu assignment đã hết hạn)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {carePlanDetails.map((plan: any, index: number) => {
                    const planId = plan._id || plan.id;
                    const isExpired = assignment?.end_date && new Date(assignment.end_date) < new Date();
                    const isSelected = selectedCarePlans.includes(planId);

                    return (
                      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${isSelected
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white/80 border-yellow-300'
                        }`}>
                        <input
                          type="checkbox"
                          id={`plan-${planId}`}
                          checked={isSelected}
                          onChange={(e) => handleCarePlanSelection(planId, e.target.checked)}
                          className="w-4 h-4 accent-green-500"
                        />
                        <label
                          htmlFor={`plan-${planId}`}
                          className="flex-1 cursor-pointer text-sm text-gray-700 font-medium"
                        >
                          <div className="mb-1">
                            {plan.plan_name || plan.name || plan.description || 'Gói dịch vụ'}
                          </div>
                          <div className={`text-xs font-semibold ${isExpired ? 'text-red-500' : 'text-green-600'
                            }`}>
                            {assignment?.end_date ? (
                              <>
                                Kết thúc: {formatDate(assignment.end_date)}
                                {isExpired && ' (Đã hết hạn)'}
                              </>
                            ) : (
                              'Không có thời hạn'
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(status === 'active') && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-8 border border-green-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-green-800 m-0">
                      {isAssignmentExpired(assignment?.end_date) ? 'Gia hạn dịch vụ' : 'Cập nhật thời gian dịch vụ'}
                    </h4>
                    <p className="text-xs text-green-700 mt-1">
                      {isAssignmentExpired(assignment?.end_date) 
                        ? 'Cập nhật chu kỳ dịch vụ hiện tại với ngày bắt đầu và kết thúc mới'
                        : 'Chỉnh sửa thời gian bắt đầu và kết thúc dịch vụ'
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ngày bắt đầu mới *
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={startDateDisplay}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStartDateDisplay(value);

                          const cleanValue = value.replace(/[^0-9/]/g, '');

                          let formattedValue = cleanValue;
                          if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                            formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                          }
                          if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                            formattedValue = cleanValue.slice(0, 5) + '/' + cleanValue.slice(5);
                          }

                          if (formattedValue.length <= 10) {
                            setStartDateDisplay(formattedValue);

                            if (formattedValue.length === 10) {
                              const parts = formattedValue.split('/');
                              if (parts.length === 3) {
                                const [day, month, year] = parts;
                                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                setStartDate(isoDate);
                              }
                            }
                          }
                        }}
                        placeholder="dd/mm/yyyy"
                        maxLength={10}
                        className="w-full p-4 pr-12 border border-green-200 rounded-xl text-sm bg-white text-gray-900 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer p-2 rounded-lg transition-all duration-200 text-green-600 hover:bg-green-50"
                      >
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                      {showStartDatePicker && (
                        <div className="absolute top-full left-0 z-50 mt-1">
                          <DatePicker
                            selected={startDate ? new Date(startDate) : null}
                            onChange={(date) => {
                              if (date) {
                                const isoDate = date.toISOString().split('T')[0];
                                setStartDate(isoDate);
                                setStartDateDisplay(formatDate(isoDate));
                              }
                              setShowStartDatePicker(false);
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            minDate={new Date()}
                            inline
                            onClickOutside={() => setShowStartDatePicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ngày kết thúc mới *
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={endDateDisplay}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEndDateDisplay(value);

                          const cleanValue = value.replace(/[^0-9/]/g, '');

                          let formattedValue = cleanValue;
                          if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                            formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                          }
                          if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                            formattedValue = cleanValue.slice(0, 5) + '/' + cleanValue.slice(5);
                          }

                          if (formattedValue.length <= 10) {
                            setEndDateDisplay(formattedValue);

                            if (formattedValue.length === 10) {
                              const parts = formattedValue.split('/');
                              if (parts.length === 3) {
                                const [day, month, year] = parts;
                                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                setEndDate(isoDate);
                              }
                            }
                          }
                        }}
                        placeholder="dd/mm/yyyy"
                        maxLength={10}
                        className="w-full p-4 pr-12 border border-green-200 rounded-xl text-sm bg-white text-gray-900 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer p-2 rounded-lg transition-all duration-200 text-green-600 hover:bg-green-50"
                      >
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                      {showEndDatePicker && (
                        <div className="absolute top-full left-0 z-50 mt-1">
                          <DatePicker
                            selected={endDate ? new Date(endDate) : null}
                            onChange={(date) => {
                              if (date) {
                                const isoDate = date.toISOString().split('T')[0];
                                setEndDate(isoDate);
                                setEndDateDisplay(formatDate(isoDate));
                              }
                              setShowEndDatePicker(false);
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="dd/mm/yyyy"
                            minDate={startDate ? new Date(startDate) : new Date()}
                            inline
                            onClickOutside={() => setShowEndDatePicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg text-xs text-green-800">
                  <strong>Thông tin {isAssignmentExpired(assignment?.end_date) ? 'gia hạn' : 'cập nhật'}:</strong> 
                  {isAssignmentExpired(assignment?.end_date) 
                    ? `Tất cả gói dịch vụ hiện tại sẽ được gia hạn từ ${startDate ? formatDate(startDate) : 'ngày bạn chọn'} đến ${endDate ? formatDate(endDate) : 'ngày kết thúc mới'}.`
                    : `Thời gian dịch vụ sẽ được cập nhật từ ${startDate ? formatDate(startDate) : 'ngày bạn chọn'} đến ${endDate ? formatDate(endDate) : 'ngày kết thúc mới'}.`
                  }
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-7 py-3 bg-transparent text-gray-500 border border-gray-300 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || !status || (status === 'active' && (!startDate || !endDate))}
                className={`px-7 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg ${saving || !status || (status === 'active' && (!startDate || !endDate))
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl'
                  }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 