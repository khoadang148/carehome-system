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
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import ReactDOM from 'react-dom';
import { RESIDENTS_DATA } from '@/lib/data/residents-data';

// Mock financial transactions data (for admin)
const adminTransactions = [
  { 
    id: 1, 
    description: 'Chi phí nhân sự tháng 5', 
    category: 'Chi phí',
    amount: 24500000,
    date: '2023-05-15',
    paymentMethod: 'Chuyển khoản',
    reference: 'HR-2023-05',
    status: 'Đã xử lý'
  },
  { 
    id: 2, 
    description: 'Thanh toán dịch vụ từ gia đình Johnson', 
    category: 'Thu nhập',
    amount: 7800000,
    date: '2023-05-12',
    paymentMethod: 'Thẻ tín dụng',
    reference: 'PMT-10045',
    status: 'Đã xử lý'
  },
  { 
    id: 3, 
    description: 'Chi phí thuốc và vật tư y tế', 
    category: 'Chi phí',
    amount: 4200000,
    date: '2023-05-10',
    paymentMethod: 'Chuyển khoản',
    reference: 'MED-2023-05-A',
    status: 'Đã xử lý'
  },
  { 
    id: 4, 
    description: 'Thanh toán dịch vụ từ gia đình Smith', 
    category: 'Thu nhập',
    amount: 8500000,
    date: '2023-05-08',
    paymentMethod: 'Thẻ tín dụng',
    reference: 'PMT-10046',
    status: 'Đang xử lý'
  },
  { 
    id: 5, 
    description: 'Tiện ích và dịch vụ', 
    category: 'Chi phí',
    amount: 3150000,
    date: '2023-05-05',
    paymentMethod: 'Chuyển khoản',
    reference: 'UTIL-2023-05',
    status: 'Đã xử lý'
  },
];

// Enhanced business logic data structure
const familyFinancialData = [
  {
    id: 1,
    residentName: 'Nguyễn Văn Nam',
    relationship: 'Cha',
    residentId: 'RES001',
    contractId: 'CT2024001',
    monthlyFee: 15000000,
    contractStartDate: '2024-01-01',
    paymentSchedule: 'monthly', // monthly, quarterly, yearly
    lateFeeRate: 0.02, // 2% per day
    gracePeriodDays: 5,
    room: '101',
    birthYear: '1980',
    additionalServices: [
      { 
        id: 'SV001',
        name: 'Vật lý trị liệu', 
        amount: 2000000, 
        frequency: 'Hàng tuần',
        startDate: '2024-01-01',
        isActive: true
      },
      { 
        id: 'SV002',
        name: 'Chăm sóc y tế đặc biệt', 
        amount: 1500000, 
        frequency: 'Hàng tháng',
        startDate: '2024-01-01',
        isActive: true
      },
    ],
    payments: [
      { 
        id: 1, 
        transactionId: 'TXN202405001',
        invoiceId: 'INV202405001',
        description: 'Phí chăm sóc tháng 5/2024', 
        amount: 15000000,
        originalAmount: 15000000,
        lateFee: 0,
        discount: 0,
        totalAmount: 15000000,
        dueDate: '2024-05-01',
        paidDate: '2024-05-01',
        status: 'paid', // pending, processing, paid, overdue, cancelled, refunded
        method: 'bank_transfer',
        bankReference: 'VCB20240501123456',
        paymentType: 'full', // full, partial
        verificationStatus: 'verified', // pending, verified, failed
        createdAt: '2024-04-25T00:00:00Z',
        updatedAt: '2024-05-01T10:30:00Z'
      },
      { 
        id: 2, 
        transactionId: 'TXN202405002',
        invoiceId: 'INV202405002',
        description: 'Vật lý trị liệu tuần 3/5', 
        amount: 500000,
        originalAmount: 500000,
        lateFee: 0,
        discount: 0, // 10% discount for early payment
        totalAmount: 500000,
        dueDate: '2024-05-15',
        paidDate: '2024-05-14',
        status: 'paid',
        method: 'bank_transfer',
        bankReference: 'VCB20240514789012',
        paymentType: 'full',
        verificationStatus: 'verified',
        createdAt: '2024-05-10T00:00:00Z',
        updatedAt: '2024-05-14T15:20:00Z'
      },
      { 
        id: 3, 
        transactionId: 'TXN202406001',
        invoiceId: 'INV202406001',
        description: 'Phí chăm sóc tháng 6/2024', 
        amount: 15000000,
        originalAmount: 15000000,
        lateFee: 600000, // Late fee calculated
        discount: 0,
        totalAmount: 15600000,
        dueDate: '2024-06-01',
        paidDate: null,
        status: 'overdue', // Overdue since it's past due date
        method: '',
        bankReference: '',
        paymentType: 'pending',
        verificationStatus: 'pending',
        createdAt: '2024-05-25T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        overdueDate: '2024-06-06', // Grace period ended
        remindersSent: 2,
        lastReminderDate: '2024-06-10T00:00:00Z'
      },
      {
        id: 4,
        transactionId: 'TXN202407001',
        invoiceId: 'INV202407001',
        description: 'Phí chăm sóc tháng 7/2024',
        amount: 15000000,
        originalAmount: 15000000,
        lateFee: 0,
        discount: 0,
        totalAmount: 15000000,
        dueDate: '2024-07-01',
        paidDate: null,
        status: 'pending',
        method: '',
        bankReference: '',
        paymentType: 'pending',
        verificationStatus: 'pending',
        createdAt: '2024-06-25T00:00:00Z',
        updatedAt: '2024-06-25T00:00:00Z'
      }
    ],
    totalPaid: 15950000, // Adjusted for discounts
    totalDue: 15600000, // Including late fees
    nextPaymentDate: '2024-07-01',
    paymentHistory: {
      totalTransactions: 4,
      successfulPayments: 2,
      overduePayments: 1,
      averagePaymentDelay: 1.5, // days
      totalLateFees: 600000,
      totalDiscounts: 0
    }
  },
  {
    id: 2,
    residentName: 'Lê Thị Hoa',
    relationship: 'Mẹ',
    monthlyFee: 18000000,
    room: '102',
    birthYear: '1985',
    additionalServices: [
      { name: 'Liệu pháp âm nhạc', amount: 800000, frequency: 'Hai lần/tuần' },
    ],
    payments: [
      { id: 4, description: 'Phí chăm sóc tháng 5/2024', amount: 18000000, date: '2024-05-01', status: 'Đã thanh toán', method: 'Chuyển khoản' },
      { id: 5, description: 'Liệu pháp âm nhạc tuần 2/5', amount: 400000, date: '2024-05-10', status: 'Đã thanh toán', method: 'Tiền mặt' },
    ],
    totalPaid: 18400000,
    totalDue: 0,
    nextPaymentDate: '2024-06-01'
  }
];

const categories = ['Tất cả', 'Thu nhập', 'Chi phí'];
const statuses = ['Tất cả', 'Đã xử lý', 'Đang xử lý'];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Hide header when modals are open
  useEffect(() => {
    if (showPaymentModal || showTermsModal || showInvoiceModal) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showPaymentModal, showTermsModal, showInvoiceModal]);

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

  // Payment handling functions
  const handlePayNow = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleViewInvoice = (payment: any) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleViewServicePackage = () => {
    setShowServiceModal(true);
  };

  // Thay thế hàm getRegisteredServicePackage bằng logic đồng bộ với trang dịch vụ
  const getAllRegisteredServicePackages = (statusFilter = 'all') => {
    try {
      if (user?.role === 'family') {
        // Lấy từ RESIDENTS_DATA nếu là family
        const residentsWithPackages = RESIDENTS_DATA.filter((r: any) => r.carePackage);
        let packages = residentsWithPackages.map((resident: any) => ({
          ...resident.carePackage,
          residentInfo: {
            name: resident.name,
            age: resident.age,
            room: resident.room,
            admissionDate: resident.admissionDate || '',
            healthCondition: resident.healthCondition || '',
            emergencyContact: resident.emergencyContact || '',
            medicalHistory: resident.medicalHistory || '',
            medications: resident.medications_detail || resident.medications || '',
            allergyInfo: resident.allergyInfo || '',
            specialNeeds: resident.specialNeeds || '',
            id: resident.id,
          },
        }));
        if (statusFilter !== 'all') {
          packages = packages.filter((pkg: any) => pkg.status === statusFilter);
        }
        return packages;
      }
      // Còn lại lấy từ localStorage
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const residentsWithPackages = residents.filter((r: any) => r.carePackage);
        let packages = residentsWithPackages.map((resident: any) => ({
          ...resident.carePackage,
          residentInfo: {
            name: resident.name,
            age: resident.age,
            room: resident.room,
            admissionDate: resident.admissionDate || '',
            healthCondition: resident.healthCondition || '',
            emergencyContact: resident.emergencyContact || '',
            medicalHistory: resident.medicalHistory || '',
            medications: resident.medications || '',
            allergyInfo: resident.allergyInfo || '',
            specialNeeds: resident.specialNeeds || '',
            id: resident.id,
          },
        }));
        if (statusFilter !== 'all') {
          packages = packages.filter((pkg: any) => pkg.status === statusFilter);
        }
        return packages;
      }
    } catch (error) {
      console.error('Error getting registered service packages:', error);
    }
    return [];
  };

  const getRegisteredServicePackage = () => {
    const allPackages = getAllRegisteredServicePackages();
    // Nếu có selectedResident, ưu tiên lấy đúng người đang chọn
    if (selectedResident) {
      const found = allPackages.find(
        (pkg: any) => pkg.residentInfo?.id?.toString() === selectedResident || pkg.residentInfo?.name === familyFinancialData[selectedResident]?.residentName
      );
      return found || (allPackages.length > 0 ? allPackages[0] : null);
    }
    return allPackages.length > 0 ? allPackages[0] : null;
  };

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Step 1: Create audit log for payment initiation
      const auditLog = createAuditLog('payment_initiated', selectedPayment, {
        step: 'qr_payment_verification_started',
        method: 'qr_code'
      });
      console.log('🔍 QR Payment verification initiated:', auditLog);

      // Step 2: Validate payment amount
      const validation = validatePaymentAmount(selectedPayment, selectedPayment.totalAmount);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Step 3: Calculate final amounts with business rules
      const currentDate = new Date().toISOString();
      const lateFee = calculateLateFee(
        selectedPayment.originalAmount, 
        selectedPayment.dueDate, 
        currentDate,
        familyFinancialData[selectedResident].lateFeeRate,
        familyFinancialData[selectedResident].gracePeriodDays
      );

      const finalAmount = selectedPayment.originalAmount + lateFee;

      // Step 4: Simulate QR payment verification with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let bankResponse = null;

      while (retryCount < maxRetries) {
        try {
          console.log(`📱 Verifying QR payment (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Simulate payment verification delay
          await new Promise(resolve => setTimeout(resolve, 1000 + retryCount * 500));
          
          // Simulate payment verification (95% success rate for QR payments)
          if (Math.random() > 0.05) {
            // Generate realistic QR payment response
            const banks = ['VCB', 'MB', 'BIDV', 'TCB', 'ACB'];
            const selectedBank = banks[Math.floor(Math.random() * banks.length)];
            
            bankResponse = {
              success: true,
              bankReference: `${selectedBank}${Date.now().toString().slice(-10)}`,
              verificationCode: generateTransactionId(),
              processedAt: new Date().toISOString(),
              fee: 0, // QR payments usually have no fees
              paymentMethod: 'qr_code',
              bankName: selectedBank,
              paymentApp: Math.random() > 0.5 ? selectedBank : 'VietQR',
              secureHash: crypto.randomUUID?.() || `HASH${Date.now()}`
            };
            break;
          } else {
            throw new Error('QR payment verification temporarily unavailable');
          }
        } catch (paymentError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Không thể xác minh thanh toán QR sau 3 lần thử. Vui lòng thử lại sau.');
          }
          console.warn(`⚠️ QR payment verification failed, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Step 5: Update payment data with comprehensive information
      const updatedData = [...familyFinancialData];
      const residentData = updatedData[selectedResident];
      const paymentIndex = residentData.payments.findIndex(p => p.id === selectedPayment.id);
      
      if (paymentIndex !== -1) {
        const now = new Date().toISOString();
        const payment = residentData.payments[paymentIndex];
        
        // Update payment with business logic results
        payment.status = 'paid';
        payment.verificationStatus = 'verified';
        payment.method = 'bank_transfer';
        payment.paidDate = now;
        payment.updatedAt = now;
        payment.lateFee = lateFee;
        payment.totalAmount = finalAmount;
        payment.bankReference = bankResponse.bankReference;
        payment.paymentType = 'full';

        // Update resident totals
        residentData.totalPaid += payment.amount;
        residentData.totalDue = Math.max(0, residentData.totalDue - payment.amount);
        
        // Update payment history analytics
        residentData.paymentHistory.successfulPayments += 1;
        residentData.paymentHistory.totalLateFees += lateFee;
        
        // Calculate payment delay for analytics
        const paymentDelay = Math.max(0, Math.ceil(
          (new Date(now).getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        ));
        residentData.paymentHistory.averagePaymentDelay = 
          (residentData.paymentHistory.averagePaymentDelay * (residentData.paymentHistory.successfulPayments - 1) + paymentDelay) / 
          residentData.paymentHistory.successfulPayments;
      }

      // Step 6: Generate receipt
      const receipt = generateReceipt(selectedPayment, residentData);
      console.log('🧾 Receipt generated:', receipt);

      // Step 7: Send notification
      await sendNotification('payment_success', selectedPayment, {
        email: 'family@example.com', // In real app, get from user profile
        phone: '+84901234567'
      });

      // Step 8: Create final audit log
      createAuditLog('payment_completed', selectedPayment, {
        lateFee,
        finalAmount,
        bankReference: bankResponse?.bankReference || 'MB972047950',
        processingTime: Date.now() - parseInt(auditLog.id.slice(-6)),
        receipt: receipt.receiptId
      });

      // Step 9: Show success with detailed information
      const successMessage = `
        ✅ THANH TOÁN THÀNH CÔNG!
        
        📋 Thông tin giao dịch:
        • Mã giao dịch: ${selectedPayment.transactionId || 'TXN202406001'}
        • Mã ngân hàng: ${bankResponse?.bankReference || 'MB972047950'}
        • Số tiền: ${formatCurrency(finalAmount)}
        ${lateFee > 0 ? `• Phí trễ hạn: ${formatCurrency(lateFee)}` : ''}
        • Phí giao dịch: ${formatCurrency(0)}
        
        📧 Email xác nhận đã được gửi
        🧾 Biên lai: ${receipt.receiptId}
      `;

      // Step 9: Display professional success modal
      const successEl = document.createElement('div');
      document.body.appendChild(successEl);
      // Use the updated payment object for modal info
      const paymentForModal = paymentIndex !== -1 ? residentData.payments[paymentIndex] : selectedPayment;
      ReactDOM.render(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            width: '90%',
            maxWidth: '30rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Success Header */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: 'white',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
                <CheckCircleIcon style={{width: '3rem', height: '3rem'}} />
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '0.025em'
              }}>
                THANH TOÁN THÀNH CÔNG!
              </h2>
            </div>
            
            {/* Transaction Information */}
            <div style={{
              padding: '1.5rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#475569',
                margin: '0 0 1rem 0'
              }}>
                Thông tin giao dịch:
              </h3>
              
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{fontSize: '0.875rem', color: '#64748b'}}>Mã giao dịch</span>
                  <span style={{fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, fontFamily: 'monospace'}}>
                    {paymentForModal.transactionId || 'TXN202406001'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{fontSize: '0.875rem', color: '#64748b'}}>Mã ngân hàng</span>
                  <span style={{fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, fontFamily: 'monospace'}}>
                    {paymentForModal.bankReference || 'MB972047950'}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#f0fdf4'
                }}>
                  <span style={{fontSize: '0.875rem', color: '#64748b'}}>Số tiền</span>
                  <span style={{fontSize: '0.875rem', color: '#166534', fontWeight: 600}}>
                    {formatCurrency(finalAmount || paymentForModal.totalAmount || paymentForModal.amount)}
                  </span>
                </div>
                
                {(paymentForModal.lateFee > 0) && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <span style={{fontSize: '0.875rem', color: '#64748b'}}>Phí trễ hạn</span>
                    <span style={{fontSize: '0.875rem', color: '#0f172a'}}>
                      {formatCurrency(paymentForModal.lateFee || lateFee || 600000)}
                    </span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{fontSize: '0.875rem', color: '#64748b'}}>Phí giao dịch</span>
                  <span style={{fontSize: '0.875rem', color: '#0f172a'}}>
                    {formatCurrency(0)}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem'
                }}>
                  <span style={{fontSize: '0.875rem', color: '#64748b'}}>Thời gian</span>
                  <span style={{fontSize: '0.875rem', color: '#0f172a'}}>
                    {new Date().toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Notification Section */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span style={{fontSize: '0.875rem', color: '#1e40af', fontWeight: 500}}>
                  Email xác nhận đã được gửi
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <div style={{fontSize: '0.875rem', color: '#991b1b', fontWeight: 500}}>
                  <span>Biên lai: </span>
                  <span style={{fontFamily: 'monospace', fontWeight: 600}}>{receipt.receiptId}</span>
                </div>
              </div>
            </div>
            
            {/* Footer Section */}
            <div style={{
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  document.body.removeChild(successEl);
      setSelectedPayment(null);
                }}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        successEl
      );
      
      // Close payment modal
      setShowPaymentModal(false);

    } catch (error: any) {
      // Enhanced error handling with business context
      console.error('❌ Payment processing failed:', error);
      
      // Create error audit log
      createAuditLog('payment_failed', selectedPayment, {
        error: error.message,
        step: 'processing'
      });

      // Send failure notification
      await sendNotification('payment_failed', selectedPayment, {
        error: error.message
      });

      // Show user-friendly error message
      const errorMessage = `
        ❌ THANH TOÁN KHÔNG THÀNH CÔNG
        
        Lỗi: ${error.message}
        
        📞 Vui lòng liên hệ bộ phận hỗ trợ:
        • Hotline: 1900-xxxx
        • Email: support@carehome.vn
        
        Mã tham chiếu: ${selectedPayment.transactionId}
      `;
      
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
        method: paymentMethod,
        ipAddress: '192.168.1.1', // In real app, get from request
        userAgent: navigator.userAgent,
        ...details
      }
    };
  };

  const sendNotification = async (type: string, payment: any, recipient: any) => {
    // In real application, this would call email/SMS service
    const notifications = {
      payment_reminder: {
        subject: `Nhắc nhở thanh toán - ${payment.description}`,
        message: `Kính gửi gia đình, hóa đơn ${payment.invoiceId} đến hạn thanh toán vào ${new Date(payment.dueDate).toLocaleDateString('vi-VN')}. Số tiền: ${formatCurrency(payment.totalAmount)}`
      },
      payment_success: {
        subject: `Xác nhận thanh toán thành công - ${payment.description}`,
        message: `Cảm ơn bạn đã thanh toán thành công. Mã giao dịch: ${payment.transactionId}. Số tiền: ${formatCurrency(payment.amount)}`
      },
      payment_overdue: {
        subject: `Thông báo quá hạn thanh toán - ${payment.description}`,
        message: `Hóa đơn ${payment.invoiceId} đã quá hạn. Phí trễ hạn sẽ được tính thêm. Vui lòng thanh toán sớm nhất có thể.`
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
    adminTransactions;

  // Financial summary calculations
  const totalIncome = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.totalPaid || 0 :
    adminTransactions
      .filter((t: any) => t.category === 'Thu nhập')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
  const totalExpenses = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.totalDue || 0 :
    adminTransactions
      .filter((t: any) => t.category === 'Chi phí')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
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
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <UserGroupIcon style={{width: '1.125rem', height: '1.125rem', color: '#8b5cf6'}} />
              Chọn người thân để xem thông tin tài chính
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
              {familyFinancialData.map((resident, index) => (
                <div
                  key={resident.id}
                  onClick={() => setSelectedResident(index)}
                  style={{
                    background: selectedResident === index ? '#eff6ff' : 'white',
                    border: selectedResident === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <h4 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0'}}>
                        Người cao tuổi: {resident.residentName}
                      </h4>
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>



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
                  {familyFinancialData[selectedResident]?.payments
                    .sort((a, b) => {
                      const statusA = getPaymentStatus(a);
                      const statusB = getPaymentStatus(b);
                      
                      // Priority order: overdue > grace_period > pending > processing > paid
                      const statusPriority = {
                        'overdue': 1,
                        'grace_period': 2, 
                        'pending': 3,
                        'processing': 4,
                        'paid': 5
                      };
                      
                      // Sort by status priority first
                      if (statusPriority[statusA] !== statusPriority[statusB]) {
                        return statusPriority[statusA] - statusPriority[statusB];
                      }
                      
                      // If same status, sort by date (newest first for unpaid, oldest first for paid)
                      const dateA = new Date(a.dueDate || a.date);
                      const dateB = new Date(b.dueDate || b.date);
                      
                      if (statusA === 'paid') {
                        return dateB.getTime() - dateA.getTime(); // Newest paid first
                      } else {
                        return dateA.getTime() - dateB.getTime(); // Oldest unpaid first (more urgent)
                      }
                    })
                    .map((payment) => (
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
                              bg: '#f0fdf4',
                              color: '#059669',
                              border: '#bbf7d0',
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
                                  onClick={() => handlePayNow(payment)}
                                  style={{
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Professional Payment Modal - Enhanced Business Rules */}
        {showPaymentModal && selectedPayment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
            marginLeft: '12rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1.5rem',
              maxWidth: '48rem',
              width: '100%',
              maxHeight: '95vh',
              overflowY: 'auto',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.4)',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* Enhanced Professional Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                padding: '2rem',
                color: 'white',
                position: 'relative',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem'}}>
                  <div style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}>
                    <DevicePhoneMobileIcon style={{width: '2rem', height: '2rem'}} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: '-0.025em'
                    }}>
                      Thanh toán hóa đơn
                    </h3>
                    <p style={{
                      fontSize: '0.95rem',
                      opacity: 0.9,
                      margin: '0.25rem 0 0 0',
                      fontWeight: 500
                    }}>
                      Phương thức: Chuyển khoản ngân hàng qua QR Code
                    </p>
                  </div>
                </div>
                
                {/* Business Rules Compliance Notice */}
                <div style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <CheckCircleIcon style={{width: '1.25rem', height: '1.25rem', color: '#22c55e'}} />
                    <div>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#22c55e',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Tuân thủ quy định thanh toán
                      </p>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'rgba(34, 197, 94, 0.8)',
                        margin: 0,
                        lineHeight: 1.4
                      }}>
                        Giao dịch được thực hiện theo đúng quy định của Ngân hàng Nhà nước và tiêu chuẩn bảo mật PCI DSS
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Payment Information Section */}
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {/* Invoice Summary */}
                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  width: '100%',
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{textAlign: 'center', marginBottom: '1rem'}}>
                    <p style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {selectedPayment.description}
                    </p>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#dc2626',
                      margin: '0 0 0.5rem 0',
                      letterSpacing: '-0.025em'
                    }}>
                      {formatCurrency(selectedPayment.totalAmount || selectedPayment.amount)}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      <ClockIcon style={{width: '1rem', height: '1rem'}} />
                      <span>Mã QR có hiệu lực trong 15 phút</span>
                    </div>
                  </div>
                  
                  {/* Business Rules Display */}
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem'}}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span style={{fontSize: '0.85rem', fontWeight: 600, color: '#92400e'}}>
                        Quy định thanh toán
                      </span>
                    </div>
                                         <div style={{fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5}}>
                      <div style={{marginBottom: '0.5rem'}}>
                        • Hạn thanh toán: {selectedPayment.dueDate ? new Date(selectedPayment.dueDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                      </div>
                      {selectedPayment.lateFee > 0 && (
                        <div style={{marginBottom: '0.5rem', fontWeight: 600}}>
                          • Phí trễ hạn: {formatCurrency(selectedPayment.lateFee)} (1%/ngày sau hạn)
                        </div>
                      )}
                      <div>• Chỉ chấp nhận chuyển khoản ngân hàng</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced QR Code Display */}
                <div style={{
                  width: '18rem',
                  height: '18rem',
                  background: 'white',
                  border: '12px solid white',
                  borderRadius: '1rem',
                  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                  marginBottom: '1.5rem'
                }}>
                  {/* Simulated QR Code with better pattern */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(35, 1fr)',
                    gridTemplateRows: 'repeat(35, 1fr)',
                    gap: '1px',
                    padding: '12px'
                  }}>
                    {Array(35*35).fill(0).map((_, i) => {
                      const isCornerSquare = 
                        (i < 105 && i % 35 < 7 && Math.floor(i / 35) < 7) ||
                        (i < 105 && i % 35 >= 35-7 && Math.floor(i / 35) < 7) ||
                        (i >= 35*35-105 && i % 35 < 7 && Math.floor(i / 35) >= 35-7);

                      const isInnerPattern = 
                        (i % 35 > 12 && i % 35 < 22 && Math.floor(i / 35) > 12 && Math.floor(i / 35) < 22);
                      
                      const shouldBeBlack = isCornerSquare || isInnerPattern || Math.random() < 0.35;
                      
                      return (
                        <div 
                          key={i} 
                          style={{
                            background: shouldBeBlack ? '#000' : 'transparent',
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Enhanced Bank Logo Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '3.5rem',
                    height: '3.5rem',
                    background: 'white',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 6px rgba(255, 255, 255, 0.9)',
                    border: '2px solid #e2e8f0'
                  }}>
                    <BuildingLibraryIcon style={{width: '2.25rem', height: '2.25rem', color: '#0f172a'}} />
                  </div>
                </div>
                
                {/* Enhanced Payment Instructions */}
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '2px solid #f59e0b',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  width: '100%',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#92400e',
                    margin: '0 0 0.75rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ClockIcon style={{width: '1.125rem', height: '1.125rem'}} />
                    Hướng dẫn thanh toán
                  </p>
                  <ol style={{
                    margin: 0,
                    padding: '0 0 0 1.5rem',
                    fontSize: '0.85rem',
                    color: '#92400e',
                    lineHeight: 1.6
                  }}>
                    <li style={{marginBottom: '0.5rem'}}>• Mở ứng dụng Ngân hàng hoặc Ví điện tử</li>
                    <li style={{marginBottom: '0.5rem'}}>• Chọn chức năng "Quét mã QR"</li>
                    <li style={{marginBottom: '0.5rem'}}>• Quét mã QR hiển thị bên trên</li>
                    <li style={{marginBottom: '0.5rem'}}>• Kiểm tra thông tin giao dịch</li>
                    <li>• Xác nhận thanh toán số tiền <strong>{formatCurrency(selectedPayment.totalAmount || selectedPayment.amount)}</strong></li>
                  </ol>
                </div>
                
                {/* Enhanced Payment Details */}
                <div style={{
                  width: '100%',
                  background: 'white',
                  borderRadius: '1rem',
                  border: '2px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '2px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                  }}>
                    <h6 style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#475569',
                      margin: 0,
                      letterSpacing: '0.1em'
                    }}>
                      Thông tin giao dịch
                    </h6>
                  </div>
                  
                  <div style={{padding: '1.25rem'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      alignItems: 'center'
                    }}>
                      <span style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 500}}>Mã giao dịch</span>
                      <span style={{
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: '#0f172a', 
                        fontFamily: 'ui-monospace, monospace',
                        background: '#f1f5f9',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem'
                      }}>
                        {selectedPayment.transactionId || `TXN${Date.now().toString().slice(-8)}`}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      alignItems: 'center'
                    }}>
                      <span style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 500}}>Đơn vị thụ hưởng</span>
                      <span style={{fontSize: '0.85rem', fontWeight: 600, color: '#0f172a'}}>
                        TRUNG TÂM CHĂM SÓC NGƯỜI CAO TUỔI
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      alignItems: 'center'
                    }}>
                      <span style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 500}}>Nội dung chuyển khoản</span>
                      <span style={{
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: '#0f172a', 
                        fontFamily: 'ui-monospace, monospace',
                        maxWidth: '12rem', 
                        textAlign: 'right',
                        background: '#f1f5f9',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem'
                      }}>
                        THANHTOAN {selectedPayment.transactionId || `TXN${Date.now().toString().slice(-8)}`}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f0fdf4',
                      borderRadius: '0.75rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <span style={{fontSize: '0.9rem', color: '#166534', fontWeight: 600}}>Số tiền thanh toán</span>
                      <span style={{fontSize: '1rem', fontWeight: 700, color: '#166534'}}>
                        {formatCurrency(selectedPayment.totalAmount || selectedPayment.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Footer Actions */}
              <div style={{
                padding: '1.5rem 2rem',
                background: 'white',
                borderTop: '2px solid #e2e8f0',
                borderBottomLeftRadius: '1.5rem',
                borderBottomRightRadius: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'space-between',
                  alignItems: 'center', 
                  marginLeft: '17rem'
                }}>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    style={{
                      padding: '1rem 2rem',
                      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                      border: 'none',
                      borderRadius: '1rem',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 6px -1px rgba(100, 116, 139, 0.3)',
                      minWidth: '120px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px -1px rgba(100, 116, 139, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(100, 116, 139, 0.3)';
                    }}
                  >
                    Đóng
                  </button>
                  
                  
                </div>
                
                
              </div>
            </div>
          </div>
        )}

        {/* Professional Terms and Conditions Modal */}
        {showTermsModal && (
          <div style={{
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
            backdropFilter: 'blur(12px)',
            marginLeft: '12rem'
          }}>
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
                    onClick={() => setShowTermsModal(false)}
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
                  onClick={() => setShowTermsModal(false)}
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
          </div>
        )}

        {/* Professional Invoice Detail Modal */}
        {showInvoiceModal && selectedPayment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(51,65,85,0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            marginLeft: '12rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f0f7fa 0%, #ede9fe 100%)',
              borderRadius: '2.5rem',
              maxWidth: '44rem',
              width: '96%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 4px 24px 0 rgba(51,65,85,0.08)',
              position: 'relative',
              border: '1px solid #e5e7eb',
              transition: 'box-shadow 0.2s',
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(90deg, #f9fafb 60%, #e0e7ef 100%)',
                borderTopLeftRadius: '2.5rem',
                borderTopRightRadius: '2.5rem',
                padding: '2rem 2.5rem 1.25rem 2.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                boxShadow: '0 2px 8px 0 rgba(51,65,85,0.02)'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.55rem',
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.18,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Chi tiết hóa đơn
                    </h2>
                    <p style={{
                      fontSize: '0.98rem',
                      color: '#64748b',
                      margin: '0.25rem 0 0 0',
                      fontWeight: 500,
                      lineHeight: 1.5,
                      textTransform: 'none',
                    }}>
                      Thông tin thanh toán và dịch vụ sử dụng
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  title="Đóng"
                  style={{
                    padding: '0.5rem',
                    background: '#f6f8fa',
                    border: '1px solid #e5e7eb',
                    borderRadius: '1.2rem',
                    color: '#8b95a1',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.18s',
                    boxShadow: '0 1px 4px 0 rgba(51,65,85,0.04)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#e0e7ef';
                    e.currentTarget.style.color = '#22223b';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f6f8fa';
                    e.currentTarget.style.color = '#8b95a1';
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div style={{padding: '2rem 2.2rem', background: 'transparent'}}>
                {/* Beneficiary & Service Info */}
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  marginBottom: '2.2rem',
                  flexWrap: 'wrap',
                }}>
                  {/* Beneficiary */}
                  <div style={{
                    flex: 1,
                    minWidth: '15rem',
                    background: 'white',
                    borderRadius: '1.3rem',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 4px 0 rgba(51,65,85,0.02)',
                    padding: '1.3rem 1.5rem',
                    transition: 'box-shadow 0.18s',
                  }}>
                    <div style={{fontWeight: 500, color: '#8b95a1', fontSize: '0.93rem', marginBottom: '0.6rem', letterSpacing: '0.08em', textTransform:'uppercase'}}>Người cao tuổi</div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{color:'#8b95a1', fontSize:'0.82rem', fontWeight:500}}>Họ tên:</span>
                        <span style={{color:'#22223b', fontWeight:600, fontSize:'0.97rem'}}>{familyFinancialData[selectedResident]?.residentName}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{color:'#8b95a1', fontSize:'0.82rem', fontWeight:500}}>Phòng:</span>
                        <span style={{color:'#22223b', fontWeight:600, fontSize:'0.97rem'}}>{familyFinancialData[selectedResident]?.room || 'Chưa cập nhật'}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{color:'#8b95a1', fontSize:'0.82rem', fontWeight:500}}>Năm sinh:</span>
                        <span style={{color:'#22223b', fontWeight:600, fontSize:'0.97rem'}}>{familyFinancialData[selectedResident]?.birthYear || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Service Packages */}
                  <div style={{
                    flex: 1.2,
                    minWidth: '18rem',
                    background: 'white',
                    borderRadius: '1.3rem',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 4px 0 rgba(51,65,85,0.02)',
                    padding: '1.1rem 1.3rem',
                    transition: 'box-shadow 0.18s',
                  }}>
                    <div style={{fontWeight: 500, color: '#8b95a1', fontSize: '0.93rem', marginBottom: '0.6rem', letterSpacing: '0.08em', textTransform:'uppercase'}}>Gói dịch vụ sử dụng</div>
                    <div style={{marginBottom:'0.38rem'}}>
                      <span style={{color:'#8b95a1', fontWeight:500, fontSize:'0.92rem', letterSpacing:'0.04em'}}>Tên gói:</span>
                      <span style={{color:'#2563eb', fontWeight:600, marginLeft: 6}}>{getRegisteredServicePackage()?.packageType || 'Chưa đăng ký'}</span>
                    </div>
                    <div style={{marginBottom:'0.38rem'}}>
                      <span style={{color:'#8b95a1', fontWeight:500, fontSize:'0.92rem', letterSpacing:'0.04em'}}>Giá:</span>
                      <span style={{color:'#16a34a', fontWeight:600, marginLeft: 6}}>{formatCurrency(getRegisteredServicePackage()?.finalPrice || getRegisteredServicePackage()?.price || 0)}</span>
                    </div>
                    <div style={{color:'#8b95a1', fontSize:'0.93rem', marginBottom:'0.38rem'}}>Thanh toán: <b style={{fontWeight:500, color:'#334155'}}>Hàng tháng</b></div>
                    
                  </div>
                </div>

                {/* Invoice Card */}
                <div style={{
                  background: 'white',
                  borderRadius: '1.15rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 4px 0 rgba(51,65,85,0.03)',
                  padding: '1.7rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'1.08rem', fontWeight:600, color:'#334155', marginBottom:'0.35rem', lineHeight:1.3}}>{selectedPayment.description}</div>
                      <div style={{fontSize:'1.7rem', fontWeight:700, color:'#0f172a', marginBottom:'0.18rem', letterSpacing:'-0.01em', lineHeight:1.2}}>{formatCurrency(selectedPayment.totalAmount || selectedPayment.amount)}</div>
                    </div>
                    <div style={{marginLeft:'1.2rem'}}>
                      {(() => {
                        const status = getPaymentStatus(selectedPayment);
                        const statusConfig = {
                          paid: { text: 'Đã thanh toán', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
                          processing: { text: 'Đang xử lý', bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
                          pending: { text: 'Chờ thanh toán', bg: '#fef9c3', color: '#b45309', border: '#fde68a' },
                          grace_period: { text: 'Gia hạn', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
                          overdue: { text: 'Quá hạn', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' }
                        };
                        const config = statusConfig[status];
                        return (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '0.7rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: config.bg,
                            color: config.color,
                            border: `1px solid ${config.border}`,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px 0 rgba(51,65,85,0.03)'
                          }}>
                            Trạng thái: {config.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Info Grid */}
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.2rem'}}>
                    <div>
                      <div style={{fontWeight:500, color:'#64748b', fontSize:'0.85rem', marginBottom:'0.5rem'}}>Mã hóa đơn</div>
                      <div style={{fontFamily:'ui-monospace, monospace', color:'#0f172a', fontWeight:500, fontSize:'0.9rem', letterSpacing:'0.02em'}}>{selectedPayment.invoiceId || 'Chưa có'}</div>
                    </div>
                    {selectedPayment.status === 'paid' && (
                      <div>
                        <div style={{fontWeight:500, color:'#64748b', fontSize:'0.85rem', marginBottom:'0.5rem'}}>Mã giao dịch</div>
                        <div style={{fontFamily:'ui-monospace, monospace', color:'#0f172a', fontWeight:500, fontSize:'0.9rem', letterSpacing:'0.02em'}}>{selectedPayment.transactionId || 'Chưa có'}</div>
                      </div>
                    )}
                    <div>
                      <div style={{fontWeight:500, color:'#64748b', fontSize:'0.85rem', marginBottom:'0.5rem'}}>Hạn thanh toán</div>
                      <div style={{color:'#0f172a', fontWeight:500, fontSize:'0.9rem'}}>{selectedPayment.dueDate ? new Date(selectedPayment.dueDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</div>
                    </div>
                    {selectedPayment.status === 'paid' && selectedPayment.method && (
                      <div>
                        <div style={{fontWeight:500, color:'#64748b', fontSize:'0.85rem', marginBottom:'0.5rem'}}>Phương thức thanh toán</div>
                        <div style={{color:'#0f172a', fontWeight:500, fontSize:'0.9rem'}}>Chuyển khoản ngân hàng</div>
                      </div>
                    )}
                    {selectedPayment.paidDate && (
                      <div>
                        <div style={{fontWeight:500, color:'#64748b', fontSize:'0.85rem', marginBottom:'0.5rem'}}>Ngày thanh toán</div>
                        <div style={{color:'#0f172a', fontWeight:500, fontSize:'0.9rem'}}>{new Date(selectedPayment.paidDate).toLocaleString('vi-VN')}</div>
                      </div>
                    )}
                    
                  </div>
                </div>


                {/* Payment Breakdown */}
                <div style={{
                  background: 'white',
                  borderRadius: '1.15rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 4px 0 rgba(51,65,85,0.03)',
                  padding: '1.7rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{fontWeight:600, color:'#475569', fontSize:'1.01rem', marginBottom:'1.1rem'}}>Chi tiết hóa đơn</div>
                  <div style={{display:'grid', gap:'0.65rem'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{color:'#64748b', fontWeight:500}}>Tạm tính:</span>
                      <span style={{color:'#0f172a', fontWeight:500}}>{formatCurrency(selectedPayment.originalAmount || selectedPayment.amount)}</span>
                    </div>
                    {selectedPayment.lateFee > 0 && (
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span style={{color:'#dc2626', fontWeight:500}}>Phí phạt chậm thanh toán:</span>
                        <span style={{color:'#dc2626', fontWeight:600}}>+{formatCurrency(selectedPayment.lateFee)}</span>
                      </div>
                    )}
                    <div style={{borderTop:'1px solid #e5e7eb', marginTop:'0.4rem', paddingTop:'0.6rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontSize:'1.01rem', color:'#334155', fontWeight:600}}>Tổng số tiền phải thanh toán:</span>
                      <span style={{fontSize:'1.18rem', color:'#0f172a', fontWeight:700}}>{formatCurrency(selectedPayment.totalAmount || selectedPayment.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'0.5rem'}}>
                  {getPaymentStatus(selectedPayment) !== 'paid' && (
                    <button
                      onClick={() => {
                        setShowInvoiceModal(false);
                        handlePayNow(selectedPayment);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 1.7rem',
                        background: getPaymentStatus(selectedPayment) === 'overdue' 
                          ? 'linear-gradient(90deg, #dc2626 60%, #ef4444 100%)' 
                          : 'linear-gradient(90deg, #38bdf8 60%, #4ade80 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.7rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        boxShadow: getPaymentStatus(selectedPayment) === 'overdue'
                          ? '0 2px 8px 0 rgba(220,38,38,0.08)'
                          : '0 2px 8px 0 rgba(56,189,248,0.08)'
                      }}
                      onMouseOver={e => {
                        if (getPaymentStatus(selectedPayment) === 'overdue') {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #ef4444 60%, #dc2626 100%)';
                          e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(220,38,38,0.13)';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #4ade80 60%, #4ade80 100%)';
                          e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(56,189,248,0.13)';
                        }
                      }}
                      onMouseOut={e => {
                        if (getPaymentStatus(selectedPayment) === 'overdue') {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #dc2626 60%, #ef4444 100%)';
                          e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(220,38,38,0.08)';
                        } else {
                          e.currentTarget.style.background = '#38bdf8';
                          e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(56,189,248,0.08)';
                        }
                      }}
                    >
                      Thanh toán ngay
                    </button>
                  )}
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    style={{
                      padding: '0.85rem 1.7rem',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.7rem',
                      fontSize: '1rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#e0e7ef';
                      e.currentTarget.style.color = '#0f172a';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#334155';
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <UserGroupIcon style={{width: '1.125rem', height: '1.125rem', color: '#8b5cf6'}} />
            Chọn người thân để xem thông tin tài chính
          </h3>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
            {familyFinancialData.map((resident, index) => (
              <div
                key={resident.id}
                onClick={() => setSelectedResident(index)}
                style={{
                  background: selectedResident === index ? '#eff6ff' : 'white',
                  border: selectedResident === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h4 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0'}}>
                      Người cao tuổi: {resident.residentName}
                    </h4>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



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
                {familyFinancialData[selectedResident]?.payments
                  .sort((a, b) => {
                    const statusA = getPaymentStatus(a);
                    const statusB = getPaymentStatus(b);
                    
                    // Priority order: overdue > grace_period > pending > processing > paid
                    const statusPriority = {
                      'overdue': 1,
                      'grace_period': 2, 
                      'pending': 3,
                      'processing': 4,
                      'paid': 5
                    };
                    
                    // Sort by status priority first
                    if (statusPriority[statusA] !== statusPriority[statusB]) {
                      return statusPriority[statusA] - statusPriority[statusB];
                    }
                    
                    // If same status, sort by date (newest first for unpaid, oldest first for paid)
                    const dateA = new Date(a.dueDate || a.date);
                    const dateB = new Date(b.dueDate || b.date);
                    
                    if (statusA === 'paid') {
                      return dateB.getTime() - dateA.getTime(); // Newest paid first
                    } else {
                      return dateA.getTime() - dateB.getTime(); // Oldest unpaid first (more urgent)
                    }
                  })
                  .map((payment) => (
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
                            bg: '#f0fdf4',
                            color: '#059669',
                            border: '#bbf7d0',
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
                                onClick={() => handlePayNow(payment)}
                                style={{
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Add any other family view content here, then close all wrappers properly */}
      {/* Professional Terms and Conditions Modal */}
      {showTermsModal && (
        <div style={{
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
          backdropFilter: 'blur(12px)',
          marginLeft: '12rem'
        }}>
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
            {/* ...modal content... */}
          </div>
        </div>
      )}
    </div>
  );
} 