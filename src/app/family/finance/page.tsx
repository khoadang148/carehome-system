"use client";

import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  BanknotesIcon,
  DocumentPlusIcon,
  EyeIcon,
  CheckCircleIcon,
  BuildingLibraryIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

import { billsAPI, paymentAPI } from '@/lib/api';
import Select from 'react-select';
import { userAPI } from "@/lib/api";
import { residentAPI } from "@/lib/api";
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';

export default function FinancePage() {


  const [selectedResident, setSelectedResident] = useState(0);
  const [familyFinancialData, setFamilyFinancialData] = useState<any[]>([]);

  const router = useRouter();
  const { user } = useAuth();


  useEffect(() => {
    const fetchResidentsAndBills = async (familyMemberId: string) => {
      try {
        const residents = await residentAPI.getByFamilyMemberId(familyMemberId);

        if (!Array.isArray(residents)) {

          setFamilyFinancialData([]);
          return;
        }
        const billsData = await Promise.all(residents.map(async (resident: any) => {
          let bills = [];
          try {
            bills = await billsAPI.getByResidentId(resident._id);

          } catch (e) {

            bills = [];
          }
          const payments = Array.isArray(bills) ? bills.map((bill: any, idx: number) => ({
            id: bill._id || idx,
            description: bill.care_plan_snapshot?.planName || bill.notes || 'Hóa đơn dịch vụ',
            amount: bill.amount,
            dueDate: bill.due_date,
            paidDate: bill.paid_date,
            status: bill.status === 'paid' ? 'paid' : (bill.status === 'unpaid' ? 'pending' : bill.status),
            method: bill.payment_method || '',
            createdAt: bill.createdAt,
            updatedAt: bill.updatedAt,
            notes: bill.notes,
            care_plan_snapshot: bill.care_plan_snapshot,
          })) : [];
          return {
            id: resident._id,
            residentName: resident.full_name || resident.fullName || resident.name,
            avatar: resident.avatar ? userAPI.getAvatarUrl(resident.avatar) : '/default-avatar.svg',
            relationship: resident.relationship || resident.emergency_contact?.relationship || resident.emergencyContact?.relationship || 'Chưa rõ',
            payments,
            totalPaid: payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
            totalDue: payments.filter((p: any) => p.status !== 'paid').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          };
        }));
        setFamilyFinancialData(billsData);
      } catch (err) {
        setFamilyFinancialData([]);
      }
    };

    if (user?.role === 'family') {
      if (user.id) {
        fetchResidentsAndBills(user.id);
      }
    }
  }, [user]);

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

  const handleViewInvoice = (payment: any) => {
    router.push(`/family/finance/invoice/${payment.id}`);
  };

  const handlePayOnline = async (payment: any) => {
    try {
      const data = await paymentAPI.createPayment(payment.id);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Không lấy được link thanh toán online. Vui lòng thử lại.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
    }
  };

  const getPaymentStatus = (payment: any) => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    
    // Reset time to start of day for accurate date comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const gracePeriodEnd = new Date(dueDateStart.getTime() + 5 * 24 * 60 * 60 * 1000);

    if (payment.status === 'paid') return 'paid';
    if (payment.status === 'processing') return 'processing';
    if (todayStart > gracePeriodEnd) return 'overdue';
    if (todayStart > dueDateStart) return 'grace_period';
    return 'pending';
  };


  if (user?.role === 'family') {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="max-w-[1300px] mx-auto px-4 py-6 relative z-[1]">

          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 mb-6 shadow-md border border-white/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(22,163,74,0.25)]">
                  <BanknotesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold m-0 bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent tracking-tight leading-tight">Thông tin tài chính</h1>
                  <p className="text-sm text-slate-500 mt-0.5 font-medium">Theo dõi chi phí chăm sóc người thân</p>
                 
                </div>
              </div>
            </div>
          </div>


          {familyFinancialData.length > 1 && (
            <div className="mb-10 max-w-full bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-xl border border-white/20 backdrop-blur">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold m-0 bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent tracking-tight">Chọn người thân để xem thông tin hóa đơn thanh toán</h3>
                </div>
              </div>

              <Select
                options={familyFinancialData.map((r, idx) => ({
                  value: idx,
                  label: r.residentName || 'Chưa rõ',
                  avatar: r.avatar ? userAPI.getAvatarUrl(r.avatar) : '/default-avatar.svg',
                  roomNumber: r.room || 'Chưa hoàn tất đăng kí',
                  relationship: r.relationship || r.emergency_contact?.relationship || r.emergencyContact?.relationship || 'Chưa rõ'
                }))}
                value={(() => {
                  const r = familyFinancialData[selectedResident];
                  return r ? {
                    value: selectedResident,
                    label: r.residentName || 'Chưa rõ',
                    avatar: r.avatar ? userAPI.getAvatarUrl(r.avatar) : '/default-avatar.svg',
                    roomNumber: r.room || 'Chưa hoàn tất đăng kí',
                    relationship: r.relationship || r.emergency_contact?.relationship || r.emergencyContact?.relationship || 'Chưa rõ'
                  } : null;
                })()}
                onChange={opt => {
                  if (typeof opt?.value === 'number') setSelectedResident(opt.value);
                }}
                formatOptionLabel={formatOptionLabel}
                isSearchable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: '1rem',
                    minHeight: 70,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    boxShadow: state.isFocused
                      ? '0 0 0 3px rgba(139, 92, 246, 0.1), 0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                      : '0 4px 12px rgba(0, 0, 0, 0.05)',
                    borderColor: state.isFocused ? '#8b5cf6' : '#e5e7eb',
                    borderWidth: state.isFocused ? '2px' : '1px',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    transition: 'all 0.2s ease',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isSelected
                      ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
                      : state.isFocused
                        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                        : '#fff',
                    color: state.isSelected ? '#7c3aed' : '#111827',
                    cursor: 'pointer',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    paddingLeft: '1.5rem',
                    paddingRight: '1.5rem',
                    fontSize: '1.125rem',
                    fontWeight: state.isSelected ? 700 : 600,
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(4px)'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '1rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden'
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: '0.5rem'
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#7c3aed',
                    fontWeight: 700
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9ca3af',
                    fontWeight: 500
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: '#8b5cf6',
                    '&:hover': {
                      color: '#7c3aed'
                    }
                  }),
                  indicatorSeparator: (base) => ({
                    ...base,
                    backgroundColor: '#e5e7eb'
                  })
                }}
                placeholder='Chọn người thân...'
              />
            </div>
          )}


          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 shadow-md border border-white/30">
            <h3 className="text-base font-semibold text-slate-900 mb-5">Lịch sử thanh toán - {familyFinancialData[selectedResident]?.residentName}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-br from-slate-800 to-slate-700 border-b-2 border-slate-900 shadow">
                    <th className="text-left py-4 px-3 text-sm font-bold text-white w-[25%] uppercase tracking-wider border-r border-white/10">Mô tả dịch vụ</th>
                    <th className="text-center py-4 px-3 text-sm font-bold text-white w-[12%] uppercase tracking-wider border-r border-white/10">Số tiền</th>
                    <th className="text-center py-4 px-3 text-sm font-bold text-white w-[12%] uppercase tracking-wider border-r border-white/10">Hạn thanh toán</th>
                    <th className="text-center py-4 px-3 text-sm font-bold text-white w-[12%] uppercase tracking-wider border-r border-white/10">Phương thức</th>
                    <th className="text-center py-4 px-3 text-sm font-bold text-white w-[15%] uppercase tracking-wider border-r border-white/10">Trạng thái</th>
                    <th className="text-center py-4 px-3 text-sm font-bold text-white w-[24%] uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(familyFinancialData[selectedResident]?.payments) && familyFinancialData[selectedResident].payments.length > 0
                    ? familyFinancialData[selectedResident].payments
                      .sort((a: any, b: any) => {
                        const statusA = getPaymentStatus(a);
                        const statusB = getPaymentStatus(b);
                        const statusPriority = {
                          'overdue': 1,
                          'grace_period': 2,
                          'pending': 3,
                          'processing': 4,
                          'paid': 5
                        };
                        if (statusPriority[statusA] !== statusPriority[statusB]) {
                          return statusPriority[statusA] - statusPriority[statusB];
                        }
                        const dateA = new Date(a.dueDate || a.date);
                        const dateB = new Date(b.dueDate || b.date);
                        if (statusA === 'paid') {
                          return dateB.getTime() - dateA.getTime();
                        } else {
                          return dateA.getTime() - dateB.getTime();
                        }
                      })
                      .map((payment: any) => (
                        <tr key={payment.id} className="border-b border-gray-100">
                          <td className="py-4 px-3 text-sm text-slate-900">{payment.description}</td>
                          <td className="py-4 px-3 text-sm font-semibold text-slate-900 text-center">{formatCurrency(payment.amount)}</td>
                          <td className="py-4 px-3 text-sm text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-slate-900 font-medium">
                                {new Date(payment.dueDate || payment.date).toLocaleDateString('vi-VN')}
                              </span>
                              {payment.dueDate && (() => {
                                const today = new Date();
                                const dueDate = new Date(payment.dueDate);
                                
                                // Reset time to start of day for accurate date comparison
                                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                
                                const isOverdue = dueDateStart < todayStart && payment.status !== 'paid';
                                const daysOverdue = isOverdue ? Math.ceil((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                
                                return isOverdue ? (
                                  <div className="text-[0.65rem] text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-md border border-red-200 w-fit inline-flex items-center gap-1">
                                    Quá hạn {daysOverdue} ngày
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-sm text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                              <BuildingLibraryIcon className="w-3.5 h-3.5" />
                              Chuyển khoản
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            {(() => {
                              const status = getPaymentStatus(payment);
                              const statusConfig = {
                                paid: {
                                  text: 'Đã thanh toán',
                                  label: 'Đã thanh toán',
                                  bg: '#e6f9ed',
                                  color: '#16a34a',
                                  border: '#bbf7d0',
                                  icon: null
                                },
                                processing: {
                                  text: 'Đang xử lý',
                                  label: 'Đang xử lý',
                                  bg: '#f3f0fd',
                                  color: '#7c3aed',
                                  border: '#ede9fe',
                                  icon: null
                                },
                                pending: {
                                  text: 'Chờ thanh toán',
                                  label: 'Chờ thanh toán',
                                  bg: '#fff7ed',
                                  color: '#ea580c',
                                  border: '#fed7aa',
                                  icon: null
                                },
                                grace_period: {
                                  text: 'Gia hạn',
                                  label: 'Gia hạn',
                                  bg: '#fefbe9',
                                  color: '#b45309',
                                  border: '#fde68a',
                                  icon: null
                                },
                                overdue: {
                                  text: 'Quá hạn',
                                  label: 'Quá hạn',
                                  bg: '#fff1f2',
                                  color: '#e11d48',
                                  border: '#fecdd3',
                                  icon: (
                                    <svg style={{ width: '1em', height: '1em', marginRight: 4, verticalAlign: '-0.15em' }} fill="none" stroke="#e11d48" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#e11d48" strokeWidth="2" /><path stroke="#e11d48" strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
                                  )
                                }
                              };

                              return (
                                <div className="flex justify-center">
                                  <span className="inline-flex items-center gap-1 px-[0.7rem] py-[0.18rem] rounded-[0.8rem] text-[0.92rem] font-medium whitespace-nowrap shadow-sm tracking-[0.01em] leading-[1.32]" style={{ background: statusConfig[status].bg, color: statusConfig[status].color, border: `1px solid ${statusConfig[status].border}` }}>
                                    {statusConfig[status].icon}
                                    {statusConfig[status].label}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                            {(() => {
                              const status = getPaymentStatus(payment);

                              if (status === 'paid') {
                                return (
                                  <div className="flex flex-col gap-1.5 items-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-md text-xs font-semibold border border-green-500/30">
                                      <CheckCircleIcon className="w-3.5 h-3.5" />
                                      Hoàn thành
                                    </div>
                                    <button onClick={() => handleViewInvoice(payment)} className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-all min-w-[90px] hover:-translate-y-0.5">
                                      <EyeIcon className="w-3.5 h-3.5" />
                                      Xem chi tiết
                                    </button>
                                  </div>
                                );
                              }

                              if (status === 'processing') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-md text-xs font-semibold">
                                    <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
                                    Đang xử lý
                                  </span>
                                );
                              }

                              if (status === 'pending' || status === 'grace_period' || status === 'overdue') {
                                const isUrgent = status === 'overdue';
                                const isWarning = status === 'grace_period';

                                return (
                                  <div className="flex flex-col gap-1.5 items-center">
                                    <button onClick={() => handlePayOnline(payment)} className={`${isUrgent ? 'from-red-600 to-red-700' : isWarning ? 'from-orange-600 to-orange-700' : 'from-green-600 to-green-700'} mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br text-white rounded-md text-xs font-semibold cursor-pointer transition-all min-w-[90px] hover:-translate-y-0.5`}>
                                      <BanknotesIcon className="w-3.5 h-3.5" />
                                      {isUrgent ? 'Thanh toán' : 'Thanh toán'}
                                    </button>
                                    <button onClick={() => handleViewInvoice(payment)} className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-md text-xs font-semibold cursor-pointer transition-all min-w-[90px] hover:-translate-y-0.5">
                                      <EyeIcon className="w-3.5 h-3.5" />
                                      Xem chi tiết
                                    </button>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </td>
                        </tr>
                      ))
                    : (
                      <tr>
                        <td colSpan={6} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <DocumentPlusIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có hóa đơn nào</h3>
                              <p className="text-sm text-gray-500 m-0">Hiện tại chưa có hóa đơn nào được tạo cho người thân này</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const formatCurrency = (amount: number) => {
  // Use display currency for UI, but keep actual amount for calculations
  return formatDisplayCurrency(amount);
};

interface ResidentOption {
  value: number;
  label: string;
  avatar: string;
  roomNumber: string;
  relationship: string;
}

const formatOptionLabel = (option: ResidentOption) => (
  <div className="flex items-center gap-[14px]">
    <img
      src={option.avatar && option.avatar.trim() !== '' ? option.avatar : '/default-avatar.svg'}
      alt={option.label}
      className="w-12 h-12 rounded-full object-cover bg-gray-100"
      onError={(e) => {
        e.currentTarget.src = '/default-avatar.svg';
      }}
    />
    <div>
      <div className="font-bold text-[20px]">{option.label}</div>
    </div>
  </div>
);