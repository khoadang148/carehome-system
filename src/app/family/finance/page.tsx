"use client";

import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
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

export default function FinancePage() {
  // Add CSS for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [selectedResident, setSelectedResident] = useState(0);
  const [familyFinancialData, setFamilyFinancialData] = useState<any[]>([]);

  const router = useRouter();
  const { user } = useAuth();

  // Fetch residents for family
  useEffect(() => {
    const fetchResidentsAndBills = async (familyMemberId: string) => {
      try {
        const residents = await residentAPI.getByFamilyMemberId(familyMemberId);
        console.log('Residents for finance page:', residents);
        if (!Array.isArray(residents)) {
          console.log('Residents is not an array, setting empty data');
          setFamilyFinancialData([]);
          return;
        }
        // Fetch bills for each resident
        const billsData = await Promise.all(residents.map(async (resident: any) => {
          let bills = [];
          try {
            bills = await billsAPI.getByResidentId(resident._id);
            console.log(`Bills for resident ${resident._id}:`, bills);
          } catch (e) {
            console.log(`Error fetching bills for resident ${resident._id}:`, e);
            bills = [];
          }
          // Map bills to UI payment structure
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



  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'family') {
      router.push('/');
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
    const gracePeriodEnd = new Date(dueDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    
    if (payment.status === 'paid') return 'paid';
    if (payment.status === 'processing') return 'processing';
    if (today > gracePeriodEnd) return 'overdue';
    if (today > dueDate) return 'grace_period';
    return 'pending';
  };
  
  // If user is family, show family finance view
  if (user?.role === 'family') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative'
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />
        <div style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '1.5rem 1rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header Section for Family */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.875rem'}}>
                <div style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                }}>
                  <BanknotesIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '1.5rem', 
                    fontWeight: 700, 
                    margin: 0,
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2
                  }}>
                    Thông tin tài chính
                  </h1>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: '0.125rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Theo dõi chi phí chăm sóc người thân
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Family Member Selector */}
          {familyFinancialData.length > 1 && (
            <div style={{
              marginBottom: '2.5rem',
              maxWidth: 5000,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                  <UsersIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em'
                  }}>
                    Chọn người thân để xem thông tin tài chính
                  </h3>
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

          {/* Payment History for Family */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.25rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h3 style={{fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1.25rem'}}>
              Lịch sử thanh toán - {familyFinancialData[selectedResident]?.residentName}
            </h3>

            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    borderBottom: '2px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    <th style={{
                      textAlign: 'left', 
                      padding: '1.125rem 0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      width: '25%',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      Mô tả dịch vụ
                    </th>
                    <th style={{
                      textAlign: 'center', 
                      padding: '1.125rem 0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      width: '12%',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      Số tiền
                    </th>
                    <th style={{
                      textAlign: 'center', 
                      padding: '1.125rem 0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      width: '12%',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      Hạn thanh toán
                    </th>
                    <th style={{
                      textAlign: 'center', 
                      padding: '1.125rem 0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      width: '12%',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      Phương thức
                    </th>
                    <th style={{
                      textAlign: 'center', 
                      padding: '1.125rem 0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      width: '15%',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      Trạng thái
                    </th>
                    <th style={{
                      textAlign: 'center', 
                      padding: '1.125rem 0.75rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      width: '24%',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Thao tác
                    </th>
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
                          <tr key={payment.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                            <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827'}}>
                              {payment.description}
                            </td>
                            <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', textAlign: 'center'}}>
                              {formatCurrency(payment.amount)}
                            </td>
                            <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', textAlign: 'center'}}>
                              <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center'}}>
                                <span style={{color: '#111827', fontWeight: 500}}>
                                  {new Date(payment.dueDate || payment.date).toLocaleDateString('vi-VN')}
                                </span>
                                {payment.dueDate && new Date(payment.dueDate) < new Date() && payment.status !== 'paid' && (
                                  <div style={{
                                    fontSize: '0.65rem',
                                    color: '#dc2626',
                                    fontWeight: 600,
                                    background: '#fef2f2',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #fecaca',
                                    width: 'fit-content',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    textTransform: 'none',
                                    letterSpacing: 'normal'
                                  }}>
                                    Quá hạn {Math.ceil((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} ngày
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', textAlign: 'center'}}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.25rem 0.75rem',
                                background: '#f3f4f6',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: '#374151'
                              }}>
                                <BuildingLibraryIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                Chuyển khoản
                              </div>
                            </td>
                            <td style={{padding: '1rem 0.75rem'}}>
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
                                      <svg style={{width:'1em',height:'1em',marginRight:4,verticalAlign:'-0.15em'}} fill="none" stroke="#e11d48" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#e11d48" strokeWidth="2"/><path stroke="#e11d48" strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
                                    )
                                  }
                                };
                                
                                return (
                                  <div style={{display: 'flex', justifyContent: 'center'}}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '0.18rem 0.7rem',
                                      borderRadius: '0.8rem',
                                      fontSize: '0.92rem',
                                      fontWeight: 500,
                                      background: statusConfig[status].bg,
                                      color: statusConfig[status].color,
                                      border: `1px solid ${statusConfig[status].border}`,
                                      whiteSpace: 'nowrap',
                                      boxShadow: '0 1px 2px 0 rgba(51,65,85,0.01)',
                                      letterSpacing: '0.01em',
                                      lineHeight: 1.32,
                                      fontFamily: 'inherit',
                                      transition: 'background 0.18s, color 0.18s'
                                    }}>
                                      {statusConfig[status].icon}
                                      {statusConfig[status].label}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td style={{padding: '1rem 0.75rem', textAlign: 'center'}}>
                              {(() => {
                                const status = getPaymentStatus(payment);
                                
                                if (status === 'paid') {
                                  return (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'center'}}>
                                      <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: '#16a34a',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                      }}>
                                        <CheckCircleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                        Hoàn thành
                                      </div>
                                      <button
                                        onClick={() => handleViewInvoice(payment)}
                                        style={{
                                          marginTop: '0.25rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.375rem',
                                          padding: '0.375rem 0.75rem',
                                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '0.5rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          minWidth: '90px'
                                        }}
                                        onMouseOver={e => {
                                          e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseOut={e => {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        <EyeIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                        Xem chi tiết
                                      </button>
                                    </div>
                                  );
                                }
                                
                                if (status === 'processing') {
                                  return (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.375rem',
                                      padding: '0.5rem 1rem',
                                      background: 'rgba(59, 130, 246, 0.1)',
                                      color: '#3b82f6',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}>
                                      <div style={{
                                        width: '0.875rem',
                                        height: '0.875rem',
                                        border: '2px solid rgba(59, 130, 246, 0.3)',
                                        borderTop: '2px solid #3b82f6',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                      }} />
                                      Đang xử lý
                                    </span>
                                  );
                                }
                                
                                if (status === 'pending' || status === 'grace_period' || status === 'overdue') {
                                  const isUrgent = status === 'overdue';
                                  const isWarning = status === 'grace_period';
                                  
                                  return (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'center'}}>
                                      <button
                                        onClick={() => handlePayOnline(payment)}
                                        style={{
                                          marginTop: '0.25rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.375rem',
                                          padding: '0.375rem 0.75rem',
                                          background: isUrgent 
                                            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                                            : isWarning
                                            ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                                            : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '0.5rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          minWidth: '90px'
                                        }}
                                        onMouseOver={e => {
                                          e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseOut={e => {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        <BanknotesIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                        {isUrgent ? 'Thanh toán' : 'Thanh toán'}
                                      </button>
                                      <button
                                        onClick={() => handleViewInvoice(payment)}
                                        style={{
                                          marginTop: '0.25rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.375rem',
                                          padding: '0.375rem 0.75rem',
                                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '0.5rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          minWidth: '90px'
                                        }}
                                        onMouseOver={e => {
                                          e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseOut={e => {
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        <EyeIcon style={{width: '0.875rem', height: '0.875rem'}} />
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
                        <td colSpan={6} style={{padding: '3rem 1rem', textAlign: 'center'}}>
                          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
                            <div style={{
                              width: '4rem',
                              height: '4rem',
                              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <DocumentPlusIcon style={{width: '2rem', height: '2rem', color: '#9ca3af'}} />
                            </div>
                            <div>
                              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0'}}>
                                Chưa có hóa đơn nào
                              </h3>
                              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                                Hiện tại chưa có hóa đơn nào được tạo cho người thân này
                              </p>
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
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface ResidentOption {
  value: number;
  label: string;
  avatar: string;
  roomNumber: string;
  relationship: string;
}

const formatOptionLabel = (option: ResidentOption) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <img
      src={option.avatar && option.avatar.trim() !== '' ? option.avatar : '/default-avatar.svg'}
      alt={option.label}
      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
      onError={(e) => {
        e.currentTarget.src = '/default-avatar.svg';
      }}
    />
    <div>
      <div style={{ fontWeight: 700, fontSize: 20 }}>{option.label}</div>
    </div>
  </div>
);