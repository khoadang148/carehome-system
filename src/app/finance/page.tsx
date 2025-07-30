"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon, 
  DocumentPlusIcon,
  FunnelIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckCircleIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  PlusCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { billsAPI, carePlansAPI, roomsAPI, paymentAPI } from '@/lib/api';
import axios from 'axios';
import Select from 'react-select';
import { photosAPI } from "@/lib/api";
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [selectedResident, setSelectedResident] = useState(0);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Debug modal state
  useEffect(() => {
    console.log('showTermsModal changed:', showTermsModal);
  }, [showTermsModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTermsModal) {
        console.log('Escape key pressed, closing modal');
        setShowTermsModal(false);
      }
    };

    if (showTermsModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      console.log('Modal opened, body overflow hidden');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      console.log('Modal closed, body overflow restored');
    };
  }, [showTermsModal]);
  const router = useRouter();
  const { user } = useAuth();
  const [familyFinancialData, setFamilyFinancialData] = useState<any[]>([]); // <-- move this here, replace mock
  const [roomNumber, setRoomNumber] = useState<string>('Chưa cập nhật');
  const [roomLoading, setRoomLoading] = useState(false);
  const [payosData, setPayosData] = useState<any>(null);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosError, setPayosError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Fetch residents for family
  useEffect(() => {
    const fetchResidentsAndBills = async (familyMemberId: string, accessToken: string) => {
      try {
        // SỬA ĐOẠN NÀY: Lấy residents giống trang family
        const residents = await residentAPI.getByFamilyMemberId(familyMemberId);
        if (!Array.isArray(residents)) {
          setFamilyFinancialData([]);
          return;
        }
        // Fetch bills for each resident
        const billsData = await Promise.all(residents.map(async (resident: any) => {
          let bills = [];
          try {
            bills = await billsAPI.getByResidentId(resident._id);
          } catch (e) {
            bills = [];
          }
          // Map bills to UI payment structure
          const payments = Array.isArray(bills) ? bills.map((bill: any, idx: number) => ({
            id: bill._id || idx,
            description: bill.care_plan_snapshot?.planName || bill.notes || 'Hóa đơn dịch vụ',
            amount: bill.amount,
            originalAmount: bill.amount,
            lateFee: 0, // You can calculate late fee if needed
            discount: 0,
            totalAmount: bill.amount,
            dueDate: bill.due_date,
            paidDate: bill.paid_date,
            status: bill.status === 'paid' ? 'paid' : (bill.status === 'unpaid' ? 'pending' : bill.status),
            method: bill.payment_method || '',
            bankReference: '',
            paymentType: 'full',
            verificationStatus: 'verified',
            createdAt: bill.createdAt,
            updatedAt: bill.updatedAt,
            invoiceId: bill._id,
            transactionId: bill._id,
            notes: bill.notes,
            care_plan_snapshot: bill.care_plan_snapshot,
          })) : [];
          return {
            id: resident._id,
            residentName: resident.full_name || resident.fullName || resident.name,
            avatar: userAPI.getAvatarUrl(resident.avatar),
            relationship: resident.relationship || resident.emergency_contact?.relationship || resident.emergencyContact?.relationship || 'Chưa rõ', // Thêm relationship
            room: resident.room || '',
            residentDob: resident.dateOfBirth || resident.date_of_birth || '',
            birthYear: resident.birthYear || '',
            payments,
            totalPaid: payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
            totalDue: payments.filter((p: any) => p.status !== 'paid').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
            nextPaymentDate: payments.find((p: any) => p.status !== 'paid')?.dueDate || '',
          };
        }));
        setFamilyFinancialData(billsData);
      } catch (err) {
        setFamilyFinancialData([]);
      }
    };

    if (user?.role === 'family') {
      const accessToken = sessionStorage.getItem('access_token');
      if (user.id && accessToken) {
        fetchResidentsAndBills(user.id, accessToken);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!familyFinancialData[selectedResident]) {
      setRoomNumber('Chưa cập nhật');
      return;
    }
    const residentId = familyFinancialData[selectedResident]?.id || familyFinancialData[selectedResident]?._id;
    if (!residentId) {
      setRoomNumber('Chưa cập nhật');
      return;
    }
    setRoomLoading(true);
    carePlansAPI.getByResidentId(residentId)
      .then((assignments: any[]) => {
        const assignment = Array.isArray(assignments) ? assignments.find(a => a.assigned_room_id) : null;
        const roomId = assignment?.assigned_room_id;
        if (roomId) {
          return roomsAPI.getById(roomId)
            .then((room: any) => {
              setRoomNumber(room?.room_number || 'Chưa cập nhật');
            })
            .catch(() => setRoomNumber('Chưa cập nhật'));
        } else {
          setRoomNumber('Chưa cập nhật');
        }
      })
      .catch(() => setRoomNumber('Chưa cập nhật'))
      .finally(() => setRoomLoading(false));
  }, [selectedResident, familyFinancialData]);

  // Hide header when modals are open
  useEffect(() => {
    if (showInvoiceModal) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showInvoiceModal]);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'family'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Handler functions for button actions
  const handleViewTransaction = (transactionId: number) => {
    router.push(`/finance/${transactionId}`);
  };

  const handleEditTransaction = (transactionId: number) => {
    router.push(`/finance/${transactionId}/edit`);
  };

  const handleViewInvoice = (payment: any) => {
    setShowInvoiceModal(true);
  };

  // NEW: Handle PayOS payment redirect
  const handlePayOnline = async (payment: any) => {
    try {
      // Hiển thị trạng thái loading nếu muốn
      const data = await paymentAPI.createPayment(payment.id);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Không lấy được link thanh toán online. Vui lòng thử lại.');
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
    }
  };

  // Thay thế hàm getRegisteredServicePackage bằng logic đồng bộ với trang dịch vụ
  // XÓA HÀM getAllRegisteredServicePackages và getRegisteredServicePackage vì không còn dùng RESIDENTS_DATA

  const getPaymentMethodName = (method: string) => {
    return 'Chuyển khoản ngân hàng';
  };

  // Advanced Business Logic Functions
  const calculateLateFee = (originalAmount: number, dueDate: string, currentDate: string = new Date().toISOString(), lateFeeRate: number = 0.02, gracePeriodDays: number = 5) => {
    const due = new Date(dueDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= gracePeriodDays) return 0;
    
    const overdueDays = diffDays - gracePeriodDays;
    return Math.floor(originalAmount * lateFeeRate * overdueDays / 100) * 100; // Round to nearest 100
  };

  const getPaymentStatus = (payment: any) => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    const gracePeriodEnd = new Date(dueDate.getTime() + (payment.gracePeriodDays || 5) * 24 * 60 * 60 * 1000);
    
    if (payment.status === 'paid') return 'paid';
    if (payment.status === 'processing') return 'processing';
    if (today > gracePeriodEnd) return 'overdue';
    if (today > dueDate) return 'grace_period';
    return 'pending';
  };

  const generateTransactionId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `TXN${year}${month}${day}${time}`;
  };

  const validatePaymentAmount = (payment: any, inputAmount: number) => {
    const errors = [];
    
    if (inputAmount <= 0) {
      errors.push('Số tiền phải lớn hơn 0');
    }
    
    if (inputAmount > payment.totalAmount * 2) {
      errors.push('Số tiền vượt quá 200% số tiền cần thanh toán');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: inputAmount < payment.totalAmount ? ['Thanh toán một phần sẽ được ghi nhận'] : []
    };
  };

  const createAuditLog = (action: string, payment: any, details: any = {}) => {
    return {
      id: generateTransactionId(),
      action, // payment_initiated, payment_completed, payment_failed, etc.
      paymentId: payment.id,
      transactionId: payment.transactionId,
      userId: user?.id || 'anonymous',
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      details: {
        amount: payment.amount,
        ipAddress: '192.168.1.1', // In real app, get from request
        userAgent: navigator.userAgent,
        ...details
      }
    };
  };

  const sendNotification = async (type: string, payment: any, recipient: any) => {
    // In real application, this would call email/SMS service
    const notifications: { [key: string]: any } = {
      payment_reminder: {
        subject: 'Nhắc nhở thanh toán',
        message: 'Vui lòng thanh toán phí dịch vụ đúng hạn để tránh phát sinh phí trễ.'
      },
      payment_success: {
        subject: 'Thanh toán thành công',
        message: 'Cảm ơn bạn đã thanh toán phí dịch vụ.'
      },
      payment_overdue: {
        subject: 'Thanh toán quá hạn',
        message: 'Bạn đã quá hạn thanh toán, vui lòng thanh toán sớm nhất có thể.'
      }
    };
    
    console.log(`📧 Sending ${type} notification:`, notifications[type]);
    return Promise.resolve({ success: true, messageId: generateTransactionId() });
  };

  const generateReceipt = (payment: any, resident: any) => {
    return {
      receiptId: `RCP${payment.transactionId}`,
      issueDate: new Date().toISOString(),
      payment: {
        ...payment,
        residentName: resident.residentName,
        contractId: resident.contractId
      },
      totals: {
        originalAmount: payment.originalAmount,
        lateFee: payment.lateFee,
        totalAmount: payment.totalAmount,
        paidAmount: payment.amount
      },
      bankDetails: {
        bank: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'TRUNG TÂM CHĂM SÓC NGƯỜI CAO TUỔI'
      }
    };
  };

  // Get appropriate data based on user role
  const transactions = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.payments || [] : 
    [];

  // Financial summary calculations
  const totalIncome = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.totalPaid || 0 :
    [];
    
  const totalExpenses = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.totalDue || 0 :
    [];
    
  const balance = totalIncome - totalExpenses;
  
  // Filter transactions based on search term, category and status
  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For family role, ignore category filter since payments don't have categories
    const matchesCategory = user?.role === 'family' ? true : 
                           (filterType === 'Tất cả' || transaction.category === filterType);
    const matchesStatus = filterStatus === 'Tất cả' || transaction.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
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
              
              {/* Terms and Conditions Button */}
              <button
                onClick={() => {
                  console.log('Terms button clicked, setting showTermsModal to true');
                  setShowTermsModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                Điều khoản thanh toán
              </button>
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
                  avatar: userAPI.getAvatarUrl(r.avatar),
                  roomNumber: r.room || 'Chưa cập nhật',
                  relationship: r.relationship || r.emergency_contact?.relationship || r.emergencyContact?.relationship || 'Chưa rõ'
                }))}
                value={(() => {
                  const r = familyFinancialData[selectedResident];
                  return r ? {
                    value: selectedResident,
                    label: r.residentName || 'Chưa rõ',
                    avatar: userAPI.getAvatarUrl(r.avatar),
                    roomNumber: r.room || 'Chưa cập nhật',
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
                                    bg: '#e6f9ed', // nền xanh lá nhạt
                                    color: '#16a34a', // chữ xanh lá đậm
                                    border: '#bbf7d0', // border xanh lá pastel
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
      {/* Main content wrapper - RESTORED */}
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
            
            {/* Terms and Conditions Button */}
            <button
              onClick={() => setShowTermsModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              Điều khoản thanh toán
            </button>
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
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Chọn người thân để xem thông tin tài chính
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Chọn từ danh sách người thân của bạn
                </p>
              </div>
            </div>
            <Select
              options={familyFinancialData.map((r, idx) => ({
                value: idx,
                label: r.residentName || 'Chưa rõ',
                avatar: userAPI.getAvatarUrl(r.avatar),
                roomNumber: r.room || 'Chưa cập nhật',
                relationship: r.relationship || r.emergency_contact?.relationship || r.emergencyContact?.relationship || 'Chưa rõ'
              }))}
              value={(() => {
                const r = familyFinancialData[selectedResident];
                return r ? {
                  value: selectedResident,
                  label: r.residentName || 'Chưa rõ',
                  avatar: userAPI.getAvatarUrl(r.avatar),
                  roomNumber: r.room || 'Chưa cập nhật',
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
                                  bg: '#e6f9ed', // nền xanh lá nhạt
                                  color: '#16a34a', // chữ xanh lá đậm
                                  border: '#bbf7d0', // border xanh lá pastel
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
      {/* Add any other family view content here, then close all wrappers properly */}
      {/* Professional Terms and Conditions Modal */}
      {mounted && showTermsModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(12px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTermsModal(false);
            }
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            maxWidth: '50rem',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              padding: '1.5rem 2rem',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'white',
                      margin: 0
                    }}>
                      Điều khoản thanh toán
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: '0.25rem 0 0 0'
                    }}>
                      Quy định và chính sách thanh toán dịch vụ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('Close button clicked, setting showTermsModal to false');
                    setShowTermsModal(false);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1.25rem',
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{padding: '2rem'}}>
              {/* Important Notice */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#92400e',
                    margin: 0
                  }}>
                    Thông báo quan trọng
                  </h3>
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  Vui lòng đọc kỹ các điều khoản thanh toán dưới đây. Việc thực hiện thanh toán đồng nghĩa với việc bạn đã đồng ý và tuân thủ các quy định này.
                </p>
              </div>

              {/* Payment Terms Sections */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {/* Due Date Policy */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CalendarDaysIcon style={{width: '1.25rem', height: '1.25rem', color: '#3b82f6'}} />
                    Quy định về thời hạn thanh toán
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        marginTop: '0.375rem',
                        flexShrink: 0
                      }} />
                      <div>
                        <p style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Hạn thanh toán
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          margin: 0,
                          lineHeight: 1.5
                        }}>
                          Tất cả hóa đơn phải được thanh toán <strong>từ ngày 1 đến ngày 5 hàng tháng</strong>.
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        background: '#f59e0b',
                        borderRadius: '50%',
                        marginTop: '0.375rem',
                        flexShrink: 0
                      }} />
                      <div>
                        <p style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Quá hạn thanh toán
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          margin: 0,
                          lineHeight: 1.5
                        }}>
                          Nếu sau ngày 5 mà chưa thanh toán, trung tâm sẽ <strong>thông báo và trao đổi với người nhà</strong> để phối hợp xử lý.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Late Fee Policy */}
                <div style={{
                  background: '#fef2f2',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #fecaca'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#991b1b',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <XMarkIcon style={{width: '1.25rem', height: '1.25rem', color: '#dc2626'}} />
                    Chính sách phí trễ hạn
                  </h4>
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid #fecaca'
                  }}>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#991b1b',
                      margin: '0 0 0.75rem 0',
                      fontWeight: 600
                    }}>
                      Phí trễ hạn được tính như sau:
                    </p>
                    <ul style={{
                      margin: 0,
                      padding: '0 0 0 1.5rem',
                      fontSize: '0.875rem',
                      color: '#991b1b',
                      lineHeight: 1.6
                    }}>
                      <li style={{marginBottom: '0.5rem'}}>
                        <strong>1%</strong> số tiền gốc mỗi ngày sau ngày 5 hàng tháng
                      </li>
                      <li>
                        Phí trễ hạn được tính từ ngày 6 hàng tháng cho đến khi thanh toán đủ
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Payment Methods */}
                <div style={{
                  background: '#eff6ff',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #dbeafe'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1e40af',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <BuildingLibraryIcon style={{width: '1.25rem', height: '1.25rem', color: '#3b82f6'}} />
                    Phương thức thanh toán
                  </h4>
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid #dbeafe'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: 0
                        }}>
                          Chỉ chấp nhận <strong>chuyển khoản ngân hàng</strong>
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          margin: '0.125rem 0 0 0'
                        }}>
                          Không nhận tiền mặt dưới bất kỳ hình thức nào
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Thông tin liên hệ hỗ trợ
                  </h4>
                  <div style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Hotline hỗ trợ
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#3b82f6',
                          margin: 0,
                          fontWeight: 600
                        }}>
                          1900-xxxx
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Email hỗ trợ
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#3b82f6',
                          margin: 0
                        }}>
                          finance@carehome.vn
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Giờ làm việc
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          margin: 0
                        }}>
                          8:00 - 17:00 (T2-T6)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0 0 0.5rem 0'
                }}>
                  Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: 0,
                  fontWeight: 500
                }}>
                  Trung tâm Chăm sóc Người cao tuổi có quyền cập nhật các điều khoản này khi cần thiết
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div style={{
              padding: '1.5rem 2rem',
              background: 'white',
              borderTop: '1px solid #e2e8f0',
              borderBottomLeftRadius: '1.5rem',
              borderBottomRightRadius: '1.5rem',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  console.log('Đã hiểu button clicked, setting showTermsModal to false');
                  setShowTermsModal(false);
                }}
                style={{
                  padding: '0.875rem 2rem',
                  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(100, 116, 139, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(100, 116, 139, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(100, 116, 139, 0.3)';
                }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format date of birth as dd-mm-yyyy
const formatDob = (dob: string) => {
  if (!dob) return 'Chưa cập nhật';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 'Chưa cập nhật';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
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
      src={option.avatar}
      alt={option.label}
      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6' }}
    />
    <div>
      <div style={{ fontWeight: 700, fontSize: 20 }}>{option.label}</div>
      {/* Bỏ dòng số phòng */}
    </div>
  </div>
);