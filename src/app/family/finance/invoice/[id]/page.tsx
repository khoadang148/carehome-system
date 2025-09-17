"use client";

import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  ArrowLeftIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { billsAPI, paymentAPI } from '@/lib/api';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [derivedDetails, setDerivedDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const invoiceId = params.id as string;

        const invoiceData = await billsAPI.getById(invoiceId);
        setInvoice(invoiceData);

        // Build a derived breakdown if backend didn't store billing_details
        try {
          if (!invoiceData?.billing_details && invoiceData?.care_plan_assignment_id) {
            const cpa = invoiceData.care_plan_assignment_id;
            const carePlans = Array.isArray(cpa?.care_plan_ids) ? cpa.care_plan_ids : [];

            const serviceDetails = carePlans.map((p: any) => ({
              plan_name: p?.plan_name,
              description: p?.description,
              monthly_price: Number(p?.monthly_price) || 0,
            }));
            const totalServiceCost = typeof cpa?.care_plans_monthly_cost === 'number'
              ? cpa.care_plans_monthly_cost
              : serviceDetails.reduce((sum: number, s: any) => sum + (Number(s.monthly_price) || 0), 0);

            const roomDetails = cpa?.assigned_room_id ? {
              room_number: cpa.assigned_room_id?.room_number,
              room_type: cpa.assigned_room_id?.room_type,
              monthly_price: typeof cpa?.room_monthly_cost === 'number' ? cpa.room_monthly_cost : undefined,
            } : undefined;
            const totalRoomCost = typeof cpa?.room_monthly_cost === 'number' ? cpa.room_monthly_cost : (roomDetails?.monthly_price || 0);

            // Detect first-month bill with deposit pattern and compute breakdown similar to admin new bill
            const totalMonthlyCost = typeof cpa?.total_monthly_cost === 'number'
              ? cpa.total_monthly_cost
              : totalServiceCost + totalRoomCost;

            // Heuristic: if title/notes mention deposit or we have start_date in the same month as due_date, treat as new resident bill
            const title: string = String(invoiceData?.title || '').toLowerCase();
            const notes: string = String(invoiceData?.notes || '').toLowerCase();
            const mentionsDeposit = title.includes('cọc') || notes.includes('cọc');
            const startDate = cpa?.start_date ? new Date(cpa.start_date) : null;
            const dueDate = invoiceData?.due_date ? new Date(invoiceData.due_date) : null;
            let isNewResident = false;
            let remainingDays = 0;
            let remainingDaysAmount = 0;
            let fullMonthAmount = 0;
            let totalAmount = Number(invoiceData?.amount) || 0;

            if (startDate && dueDate && startDate.getMonth() === dueDate.getMonth() && startDate.getFullYear() === dueDate.getFullYear()) {
              isNewResident = true;
            }
            if (mentionsDeposit) {
              isNewResident = true;
            }

            if (isNewResident) {
              const lastDayOfMonth = new Date(startDate ? startDate.getFullYear() : dueDate!.getFullYear(), (startDate ? startDate.getMonth() : dueDate!.getMonth()) + 1, 0).getDate();
              const startDay = (startDate || dueDate)!.getDate();
              remainingDays = Math.max(0, lastDayOfMonth - startDay + 1);
              const dailyRate = totalMonthlyCost / 30;
              remainingDaysAmount = Math.round(dailyRate * remainingDays);
              fullMonthAmount = totalMonthlyCost;
              // If backend amount present, prefer it as total; else compute
              totalAmount = Number(invoiceData?.amount) || (remainingDaysAmount + fullMonthAmount);
            }

            setDerivedDetails({
              serviceDetails,
              totalServiceCost,
              roomDetails,
              totalRoomCost,
              totalWithRoom: totalMonthlyCost,
              isNewResident,
              remainingDays,
              remainingDaysAmount,
              fullMonthAmount,
              totalAmount,
            });
          } else {
            setDerivedDetails(null);
          }
        } catch {}
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin hóa đơn');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'bg-green-50', textColor: 'text-green-600', border: 'border-green-200', solidBg: 'bg-green-600', text: 'Đã thanh toán' };
      case 'pending':
        return { bg: 'bg-orange-50', textColor: 'text-orange-600', border: 'border-orange-200', solidBg: 'bg-orange-500', text: 'Chờ thanh toán' };
      case 'overdue':
        return { bg: 'bg-red-50', textColor: 'text-red-600', border: 'border-red-200', solidBg: 'bg-red-600', text: 'Quá hạn' };
      case 'cancelled':
        return { bg: 'bg-gray-100', textColor: 'text-gray-500', border: 'border-gray-300', solidBg: 'bg-gray-500', text: 'Đã hủy' };
      default:
        return { bg: 'bg-gray-100', textColor: 'text-gray-500', border: 'border-gray-300', solidBg: 'bg-gray-500', text: 'Không xác định' };
    }
  };

  const handlePayOnline = async (payment: any) => {
    try {
      const data = await paymentAPI.createPayment(payment._id);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Không lấy được link thanh toán online. Vui lòng thử lại.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 border-[3px] border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 m-0">Đang tải thông tin hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-[30rem]">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentPlusIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-gray-800 mb-2 text-xl">Không tìm thấy hóa đơn</h3>
          <p className="text-gray-500 mb-6">{error || 'Hóa đơn không tồn tại hoặc đã bị xóa'}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-blue-500 text-white rounded-md text-sm font-semibold">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusColor(invoice.status);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-[1200px] mx-auto p-6 relative z-[1]">
        <div className="bg-gradient-to-br from-white to-slate-100 rounded-3xl p-6 mb-8 w-full max-w-[1240px] mx-auto font-sans shadow-[0_12px_30px_rgba(0,0,0,0.05)] backdrop-blur mt-[30px] border border-slate-200">
          <div className="flex items-center justify-between gap-10 flex-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <button
                onClick={() => router.back()}
                className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>

              <div className="flex items-center gap-6">
                <div className="w-[54px] h-[54px] bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_6px_18px_rgba(16,185,129,0.15)]">
                  <BanknotesIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[1.75rem] font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent leading-tight tracking-tight">Chi tiết hóa đơn</span>
                  <span className="text-[1.125rem] text-slate-500 font-medium">Thông tin chi tiết về hóa đơn dịch vụ</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            </div>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/30">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircleIcon className={`${statusConfig.textColor} w-5 h-5`} />
                Trạng thái hóa đơn
              </h2>
              <div className={`flex items-center gap-4 p-4 rounded-lg border ${statusConfig.bg} ${statusConfig.border}`}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white ${statusConfig.solidBg}`}>
                  {invoice.status === 'paid' && <CheckCircleIcon className="w-6 h-6" />}
                  {invoice.status === 'pending' && <ClockIcon className="w-6 h-6" />}
                  {invoice.status === 'overdue' && <ClockIcon className="w-6 h-6" />}
                  {invoice.status === 'cancelled' && <DocumentPlusIcon className="w-6 h-6" />}
                </div>
                <div>
                  <div className={`text-lg font-bold mb-1 ${statusConfig.textColor}`}>{statusConfig.text}</div>
                  <div className="text-sm text-slate-500">
                    {invoice.status === 'paid' && 'Hóa đơn đã được thanh toán thành công'}
                    {invoice.status === 'pending' && 'Hóa đơn đang chờ thanh toán'}
                    {invoice.status === 'overdue' && 'Hóa đơn đã quá hạn thanh toán'}
                    {invoice.status === 'cancelled' && 'Hóa đơn đã bị hủy'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/30">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <DocumentPlusIcon className="w-5 h-5 text-blue-500" />
                Thông tin hóa đơn
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <span className="text-sm text-slate-500 font-semibold">Mã hóa đơn:</span>
                  <span className="text-sm text-slate-800 font-bold">{invoice._id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <span className="text-sm text-slate-500 font-semibold">Mô tả:</span>
                  <span className="text-sm text-slate-800 font-bold text-right max-w-[60%]">
                    {invoice.care_plan_snapshot?.planName || invoice.notes || 'Hóa đơn dịch vụ'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <span className="text-sm text-slate-500 font-semibold">Số tiền:</span>
                  <span className="text-lg text-green-600 font-bold">{formatDisplayCurrency(invoice.amount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/30">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
                Thông tin thanh toán
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                  <span className="text-sm text-slate-500 font-semibold">Hạn thanh toán:</span>
                  <span className="text-sm text-slate-800 font-bold">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                  <span className="text-sm text-slate-500 font-semibold">Ngày thanh toán:</span>
                  <span className="text-sm text-slate-800 font-bold">{invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString('vi-VN') : 'Chưa thanh toán'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                  <span className="text-sm text-slate-500 font-semibold">Phương thức:</span>
                  <span className="text-sm text-slate-800 font-bold">{invoice.payment_method || 'Chuyển khoản ngân hàng'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/30">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BuildingLibraryIcon className="w-5 h-5 text-blue-500" />
                Chi tiết hóa đơn
              </h2>
              <div className="flex flex-col gap-4">
                {(invoice.billing_details?.serviceDetails && invoice.billing_details.serviceDetails.length > 0) ? (
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">Gói dịch vụ:</h3>
                        <div className="flex flex-col gap-2">
                          {invoice.billing_details.serviceDetails.map((service: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-800 mb-1">{service.plan_name}</div>
                                {service.description && (
                                  <div className="text-xs text-slate-500 leading-snug">{service.description}</div>
                                )}
                              </div>
                              <div className="text-sm font-bold text-blue-500 ml-4">{formatDisplayCurrency(service.monthly_price)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-sky-50 rounded-md border border-sky-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">Tổng tiền dịch vụ:</span>
                            <span className="font-bold text-blue-500">{formatDisplayCurrency(invoice.billing_details.totalServiceCost || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ) : derivedDetails?.serviceDetails && derivedDetails.serviceDetails.length > 0 ? (
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">Gói dịch vụ:</h3>
                        <div className="flex flex-col gap-2">
                          {derivedDetails.serviceDetails.map((service: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-800 mb-1">{service.plan_name}</div>
                                {service.description && (
                                  <div className="text-xs text-slate-500 leading-snug">{service.description}</div>
                                )}
                              </div>
                              <div className="text-sm font-bold text-blue-500 ml-4">{formatDisplayCurrency(service.monthly_price)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-sky-50 rounded-md border border-sky-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">Tổng tiền dịch vụ:</span>
                            <span className="font-bold text-blue-500">{formatDisplayCurrency(derivedDetails.totalServiceCost || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">Gói dịch vụ:</h3>
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-slate-800 mb-1">{invoice.care_plan_snapshot?.planName || 'Gói chăm sóc cơ bản'}</div>
                              <div className="text-xs text-slate-500 leading-snug">{invoice.care_plan_snapshot?.description || 'Dịch vụ chăm sóc và hỗ trợ hàng ngày'}</div>
                            </div>
                            <div className="text-sm font-bold text-blue-500 ml-4">{formatDisplayCurrency(invoice.amount * 0.7)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {invoice.billing_details?.roomDetails ? (
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">Thông tin phòng:</h3>
                        <div className="p-3 bg-green-50 rounded-md border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-slate-800 mb-1">Phòng {invoice.billing_details.roomDetails.room_number}</div>
                            </div>
                            <div className="text-sm font-bold text-green-600 ml-4">{formatDisplayCurrency(invoice.billing_details.roomDetails.monthly_price)}</div>
                          </div>
                        </div>
                      </div>
                    ) : derivedDetails?.roomDetails ? (
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">Thông tin phòng:</h3>
                        <div className="p-3 bg-green-50 rounded-md border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-slate-800 mb-1">Phòng {derivedDetails.roomDetails.room_number}</div>
                            </div>
                            {derivedDetails.roomDetails.monthly_price && (
                              <div className="text-sm font-bold text-green-600 ml-4">{formatDisplayCurrency(derivedDetails.roomDetails.monthly_price)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">Thông tin phòng:</h3>
                        <div className="p-3 bg-green-50 rounded-md border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-slate-800 mb-1">Phòng tiêu chuẩn</div>
                              <div className="text-xs text-slate-500 leading-snug">Bao gồm giường, tủ, nhà vệ sinh riêng</div>
                            </div>
                            <div className="text-sm font-bold text-green-600 ml-4">{formatDisplayCurrency(invoice.amount * 0.3)}</div>
                          </div>
                        </div>
                  </div>
                )}

                {/* Totals section */}
                {derivedDetails?.isNewResident ? (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">Hóa đơn tháng hiện tại ({derivedDetails.remainingDays} ngày)</span>
                      <span className="font-bold text-blue-600">{formatDisplayCurrency(derivedDetails.remainingDaysAmount)}</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">+ Tiền cọc tháng tiếp theo</span>
                      <span className="font-bold text-green-600">{formatDisplayCurrency(derivedDetails.fullMonthAmount)}</span>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-200 rounded-lg border-2 border-slate-300">
                      <div className="flex items-center justify-between text-base font-bold">
                        <span className="text-slate-800">TỔNG CỘNG:</span>
                        <span className="text-blue-500 text-lg">{formatDisplayCurrency(derivedDetails.totalAmount || invoice.amount)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-slate-200 rounded-lg border-2 border-slate-300">
                    <div className="flex items-center justify-between text-base font-bold">
                      <span className="text-slate-800">TỔNG CỘNG:</span>
                      <span className="text-blue-500 text-lg">{formatDisplayCurrency(invoice.amount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!invoice.billing_details && invoice.care_plan_snapshot && (
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-md border border-white/30">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-amber-500" />
                  Thông tin gói chăm sóc
                </h2>
                <div className="bg-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-800 font-semibold">Tên gói:</span>
                    <span className="text-sm text-amber-800 font-bold">{invoice.care_plan_snapshot.planName || 'N/A'}</span>
                  </div>
                  {invoice.care_plan_snapshot.description && (
                    <div className="bg-white rounded-md p-3 mt-2">
                      <p className="text-sm text-amber-800 m-0 leading-relaxed">{invoice.care_plan_snapshot.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-md border border-white/30">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <DocumentPlusIcon className="w-5 h-5 text-slate-500" />
                  Ghi chú
                </h2>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-500 m-0 leading-relaxed">{invoice.notes}</p>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/30">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-green-600" />
                Thao tác
              </h2>
              <div className="flex flex-col gap-3">
                <button onClick={() => router.back()} className="px-6 py-[0.875rem] bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl text-white text-base font-semibold shadow-[0_4px_6px_-1px_rgba(100,116,139,0.3)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_12px_-1px_rgba(100,116,139,0.4)]">
                  Quay lại
                </button>
                {invoice.status !== 'paid' && (
                  <button onClick={() => handlePayOnline(invoice)} className="px-6 py-[0.875rem] bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-white text-base font-semibold shadow-[0_4px_6px_-1px_rgba(22,163,74,0.3)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_12px_-1px_rgba(22,163,74,0.4)]">
                    Thanh toán ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}