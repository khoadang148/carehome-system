"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { billsAPI, carePlanAssignmentsAPI, residentAPI, paymentAPI } from '@/lib/api';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

export default function FamilyCreateBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated billing details for first bill (current month remainder + next month deposit)
  const [details, setDetails] = useState<{
    assignment?: any;
    remainingDays: number;
    remainingDaysAmount: number;
    roomMonthlyCost: number;
    servicesMonthlyCost: number;
    monthlyTotal: number; // service + room monthly
    totalAmount: number; // remaining + deposit
    dueDateISO: string; // start_date iso
    title: string;
    notes: string;
  } | null>(null);

  const residentIdFromQuery = searchParams.get('residentId') || '';

  useEffect(() => {
    if (!user) return;
    if (!user.role || user.role !== 'family') {
      router.replace('/');
      return;
    }
  }, [user, router]);

  // Load family-owned residents
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const res = await residentAPI.getByFamilyMemberId(user.id);
        const arr = Array.isArray(res) ? res : (res ? [res] : []);
        
        // Nếu có residentId từ query, load chi tiết resident đó
        if (residentIdFromQuery) {
          const selectedResident = arr.find(r => (r._id || r.id) === residentIdFromQuery);
          if (selectedResident) {
            try {
              // Load chi tiết resident để có đầy đủ thông tin
              const detailedResident = await residentAPI.getById(selectedResident._id || selectedResident.id);
              
              // Cập nhật residents với thông tin chi tiết
              const updatedResidents = arr.map(r => 
                (r._id || r.id) === residentIdFromQuery ? detailedResident : r
              );
              setResidents(updatedResidents);
            } catch (detailError) {
              console.error('Error loading detailed resident:', detailError);
              setResidents(arr);
            }
          } else {
            setResidents(arr);
          }
        } else {
          setResidents(arr);
        }
        
        if (residentIdFromQuery) {
          setSelectedResidentId(residentIdFromQuery);
        }
      } catch (e) {
        setResidents([]);
      }
    };
    load();
  }, [user?.id, residentIdFromQuery]);

  // Compute first bill for the selected resident
  useEffect(() => {
    const compute = async () => {
      setDetails(null);
      setError(null);
      if (!selectedResidentId) return;
      try {
        // Fetch all assignments for resident, then find the accepted one
        const assignments = await carePlanAssignmentsAPI.getByResidentId(selectedResidentId);
        const accepted = Array.isArray(assignments)
          ? assignments.find((a: any) => String(a?.status || '').toLowerCase() === 'completed')
          : null;

        if (!accepted) {
          setError('Chưa tìm thấy gói dịch vụ được duyệt cho người thụ hưởng này.');
          return;
        }

        // Sử dụng UTC để tránh lệch múi giờ
        const now = new Date();
        const currentMonth = now.getUTCMonth();
        const currentYear = now.getUTCFullYear();
        const currentDay = now.getUTCDate();
        
        // Tính số ngày trong tháng hiện tại (UTC)
        const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
        const remainingDays = lastDayOfMonth - currentDay + 1;

        const servicesMonthlyCost = Number(accepted.care_plans_monthly_cost || 0);
        const roomMonthlyCost = Number(accepted.room_monthly_cost || 0);
        const monthlyTotal = Number(accepted.total_monthly_cost || (servicesMonthlyCost + roomMonthlyCost));
        
        // Tính tỷ lệ theo ngày chính xác dựa trên số ngày thực tế của tháng hiện tại
        const dailyRate = monthlyTotal / lastDayOfMonth;
        const remainingDaysAmount = Math.round(dailyRate * remainingDays);
        const depositAmount = Math.round(monthlyTotal);
        const totalAmount = remainingDaysAmount + depositAmount;

        // Xử lý ngày bắt đầu với UTC để tránh lệch múi giờ
        let startDate: Date;
        if (accepted.start_date) {
          // Nếu start_date đã có format ISO, sử dụng trực tiếp
          if (accepted.start_date.includes('T')) {
            startDate = new Date(accepted.start_date);
          } else {
            // Nếu chỉ có date, thêm timezone UTC
            startDate = new Date(accepted.start_date + 'T00:00:00.000Z');
          }
        } else {
          startDate = new Date();
        }
        
        // Đảm bảo date hợp lệ
        if (isNaN(startDate.getTime())) {
          startDate = new Date();
        }
        
        const yyyy = startDate.getUTCFullYear();
        const mm = String(startDate.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(startDate.getUTCDate()).padStart(2, '0');
        const dueISO = `${yyyy}-${mm}-${dd}`;

        // Sử dụng UTC để hiển thị tên tháng chính xác
        const currentMonthName = new Date(Date.UTC(currentYear, currentMonth, 1)).toLocaleDateString('vi-VN', { month: 'long', timeZone: 'UTC' });
        const nextMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
        const nextMonthName = nextMonth.toLocaleDateString('vi-VN', { month: 'long', timeZone: 'UTC' });

        // Debug logging
        console.log('Billing calculation debug:', {
          accepted,
          startDate: accepted.start_date,
          dueISO,
          remainingDays,
          totalAmount
        });

        setDetails({
          assignment: accepted,
          remainingDays,
          remainingDaysAmount,
          roomMonthlyCost,
          servicesMonthlyCost,
          monthlyTotal,
          totalAmount,
          dueDateISO: dueISO,
          title: `Hóa đơn ${currentMonthName} (${remainingDays} ngày) + Tiền cọc ${nextMonthName}`,
          notes: `Hóa đơn tháng ${currentMonthName} cho ${remainingDays} ngày còn lại + tiền cọc tháng ${nextMonthName}. Bao gồm tiền phòng và tất cả dịch vụ đã đăng ký.`,
        });
      } catch (e: any) {
        setError('Không thể tính hóa đơn đầu tiên. Vui lòng thử lại.');
      }
    };
    compute();
  }, [selectedResidentId]);

  const canSubmit = useMemo(() => Boolean(user && user.role === 'family' && selectedResidentId && details && details.totalAmount > 0), [user, selectedResidentId, details]);

  const handleCreateAndPay = async () => {
    if (!canSubmit || !details) return;
    setLoading(true);
    setError(null);
    try {
      const billPayload: any = {
        resident_id: selectedResidentId,
        staff_id: user?.id || '', // backend requires staff_id; use current user id in family flow if accepted by BE
        amount: Math.round(Number(details.totalAmount)),
        due_date: new Date(details.dueDateISO).toISOString(),
        title: details.title,
        notes: details.notes,
        care_plan_assignment_id: details.assignment?._id || null,
      };

      const created = await billsAPI.create(billPayload);
      const createdId = created?._id || created?.id;
      if (!createdId) {
        setError('Tạo hóa đơn thất bại.');
        setLoading(false);
        return;
      }

      // Create payment session and redirect
      try {
        const data = await paymentAPI.createPayment(createdId);
        if (data && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      } catch (e: any) {
        // Fallback: go to invoice details
        router.replace(`/family/finance/invoice/${createdId}`);
        return;
      }

      router.replace(`/family/finance/invoice/${createdId}`);
    } catch (e: any) {
      setError(e?.message || 'Có lỗi xảy ra khi tạo hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-[1200px] mx-auto p-8 relative z-[1]">
        <div className="bg-gradient-to-br from-white to-slate-100 rounded-3xl p-6 mb-8 w-full max-w-[1240px] mx-auto font-sans shadow-[0_12px_30px_rgba(0,0,0,0.05)] backdrop-blur border border-slate-200">
          <div className="flex items-center justify-between gap-10 flex-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <button
                onClick={() => router.push('/services')}
                className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-indigo-100 hover:to-purple-100 text-slate-700 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-200/50 transition-all duration-300"
                title="Quay lại dịch vụ"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="flex items-center gap-5">
                <div className="w-[54px] h-[54px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_6px_18px_rgba(99,102,241,0.25)]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[1.75rem] font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">Xem trước hóa đơn</span>
                  <span className="text-[1.125rem] text-slate-500 font-medium">Kiểm tra thông tin trước khi thanh toán</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">Bước 2/2</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] overflow-hidden border border-white/30 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Thông tin người thụ hưởng</h2>
            <div className="grid grid-cols-1 gap-6">
              {residentIdFromQuery ? (
                // Hiển thị thông tin resident đã chọn từ URL
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Người thụ hưởng</label>
                  <div className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-base font-semibold text-indigo-800 mb-4">
                    {residents.find(r => (r._id || r.id) === selectedResidentId)?.full_name || residents.find(r => (r._id || r.id) === selectedResidentId)?.name || 'Đang tải...'}
                  </div>
                  
                  {/* Thông tin cá nhân của resident */}
                  {(() => {
                    const selectedResident = residents.find(r => (r._id || r.id) === selectedResidentId);
                    if (!selectedResident) return null;
                    
                    // Debug logging để kiểm tra dữ liệu CCCD
                    console.log('Selected resident data:', selectedResident);
                    console.log('CCCD fields:', {
                      cccd_id: selectedResident.cccd_id,
                      cccd: selectedResident.cccd,
                      identity_card: selectedResident.identity_card,
                      citizen_id: selectedResident.citizen_id,
                      id_card: selectedResident.id_card
                    });
                    
                    return (
                      <div className="space-y-4">
                        {/* Thông tin cơ bản */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Thông tin cá nhân
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              <span className="text-xs text-slate-600">Giới tính:</span>
                              <span className="text-sm font-medium text-slate-800">
                                {selectedResident.gender === 'male' ? 'Nam' : selectedResident.gender === 'female' ? 'Nữ' : 'Khác'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className="text-xs text-slate-600">Ngày sinh:</span>
                              <span className="text-sm font-medium text-slate-800">
                                {selectedResident.date_of_birth ? 
                                  new Date(selectedResident.date_of_birth).toLocaleDateString('vi-VN') : 
                                  'Chưa có'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className="text-xs text-slate-600">Số CCCD:</span>
                              <span className="text-sm font-medium text-slate-800">
                                {(() => {
                                  // Thử lấy CCCD từ nhiều trường dữ liệu
                                  const cccd = selectedResident.cccd_id || 
                                             selectedResident.cccd || 
                                             selectedResident.identity_card ||
                                             selectedResident.citizen_id ||
                                             selectedResident.id_card;
                                  
                                  return cccd || 'Chưa có';
                                })()}
                              </span>
                            </div>
                            {selectedResident.admission_date && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs text-slate-600">Ngày nhập viện:</span>
                                <span className="text-sm font-medium text-slate-800">
                                  {new Date(selectedResident.admission_date).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        
                        {/* Thông tin người liên hệ khẩn cấp */}
                        {selectedResident.emergency_contact && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                            <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Người liên hệ khẩn cấp
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-600">Họ tên:</span>
                                <span className="text-sm font-medium text-amber-800">
                                  {selectedResident.emergency_contact.name || 'Chưa có'}
                                </span>
                              </div>
                              {selectedResident.emergency_contact.phone && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-amber-600">Số điện thoại:</span>
                                  <span className="text-sm font-medium text-amber-800">
                                    {selectedResident.emergency_contact.phone}
                                  </span>
                                </div>
                              )}
                              {selectedResident.emergency_contact.email && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-amber-600">Email:</span>
                                  <span className="text-sm font-medium text-amber-800">
                                    {selectedResident.emergency_contact.email}
                                  </span>
                                </div>
                              )}
                              {selectedResident.emergency_contact.relationship && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-amber-600">Mối quan hệ:</span>
                                  <span className="text-sm font-medium text-amber-800">
                                    {selectedResident.emergency_contact.relationship.charAt(0).toUpperCase() + selectedResident.emergency_contact.relationship.slice(1)}
                                  </span>
                                </div>
                              )}
                              {selectedResident.emergency_contact.address && (
                                <div className="flex items-start justify-between">
                                  <span className="text-xs text-amber-600">Địa chỉ:</span>
                                  <span className="text-xs font-medium text-amber-800 text-right max-w-[200px]">
                                    {selectedResident.emergency_contact.address}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                 
                </div>
              ) : (
                // Hiển thị dropdown nếu không có residentId từ URL
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Người thụ hưởng</label>
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  >
                    <option value="">-- Chọn người thụ hưởng --</option>
                    {residents.map((r) => (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        {r.full_name || r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/30">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Xem trước thanh toán</h2>
              {details ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between">
                      <span className="text-sm text-slate-500 font-semibold">Hạn thanh toán</span>
                      <span className="text-sm text-slate-800 font-bold">
                        {(() => {
                          try {
                            // Tạo date object từ ISO string
                            const dueDate = new Date(details.dueDateISO + 'T00:00:00.000Z');
                            
                            // Kiểm tra date hợp lệ
                            if (isNaN(dueDate.getTime())) {
                              return 'Chưa xác định';
                            }
                            
                            // Format theo định dạng Việt Nam
                            return dueDate.toLocaleDateString('vi-VN', { 
                              timeZone: 'UTC',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            });
                          } catch (error) {
                            console.error('Error formatting due date:', error);
                            return 'Chưa xác định';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between">
                      <span className="text-sm text-slate-500 font-semibold">Tổng cộng</span>
                      <span className="text-lg text-emerald-600 font-bold">{formatDisplayCurrency(details.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm text-blue-900 font-semibold mb-2">Chi tiết tính tiền</div>
                    <div className="text-xs text-blue-700 mb-3 bg-blue-100 rounded-lg p-2">
                      <strong>Cách tính:</strong> Tỷ lệ ngày = Chi phí hàng tháng ÷ Số ngày thực tế của tháng × Số ngày sử dụng
                    </div>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>Tiền dịch vụ (gói chăm sóc) / tháng</span>
                        <span className="font-semibold">{formatDisplayCurrency(details.servicesMonthlyCost || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tiền phòng / tháng</span>
                        <span className="font-semibold">{formatDisplayCurrency(details.roomMonthlyCost || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tổng theo tháng</span>
                        <span className="font-semibold">{formatDisplayCurrency(details.monthlyTotal || 0)}</span>
                      </div>
                      <div className="h-px bg-blue-200 my-2" />
                      <div className="flex items-center justify-between">
                        <span>Hóa đơn tháng hiện tại: {details.remainingDays} ngày (từ {new Date().getUTCDate()}/{new Date().getUTCMonth() + 1} đến cuối tháng)</span>
                        <span className="font-semibold">{formatDisplayCurrency(details.remainingDaysAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tiền cọc tháng tiếp theo</span>
                        <span className="font-semibold">{formatDisplayCurrency(details.monthlyTotal)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4 py-2">
                      <span className="text-white font-bold">Tổng cộng</span>
                      <span className="text-white font-bold">{formatDisplayCurrency(details.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>Nội dung: <span className="font-semibold">{details.title}</span></div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                   
                    <button
                      onClick={handleCreateAndPay}
                      disabled={!canSubmit || loading}
                      className={`${!canSubmit || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:scale-105'} px-6 py-3 rounded-xl border-none text-white font-semibold transition-all duration-200 shadow-md`}
                    >
                      {loading ? 'Đang tạo hóa đơn...' : 'Thanh toán'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Hãy chọn người thụ hưởng để xem trước hóa đơn.</div>
              )}

              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


