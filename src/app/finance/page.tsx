"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
        discount: 50000, // 10% discount for early payment
        totalAmount: 450000,
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
      totalDiscounts: 50000
    }
  },
  {
    id: 2,
    residentName: 'Lê Thị Hoa',
    relationship: 'Mẹ',
    monthlyFee: 18000000,
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Hide header when modals are open
  useEffect(() => {
    if (showPaymentModal || showInvoiceModal) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showPaymentModal, showInvoiceModal]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

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

  const getRegisteredServicePackage = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const currentResident = residents.find((r: any) => r.id.toString() === selectedResident);
        return currentResident?.carePackage || null;
      }
    } catch (error) {
      console.error('Error getting registered service package:', error);
    }
    return null;
  };

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Step 1: Create audit log for payment initiation
      const auditLog = createAuditLog('payment_initiated', selectedPayment, {
        step: 'validation_started'
      });
      console.log('🔍 Payment initiated:', auditLog);

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

      const discount = calculateEarlyPaymentDiscount(
        selectedPayment.originalAmount,
        selectedPayment.dueDate,
        currentDate
      );

      const finalAmount = selectedPayment.originalAmount + lateFee - discount;

      // Step 4: Simulate bank API call with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let bankResponse = null;

      while (retryCount < maxRetries) {
        try {
          console.log(`🏦 Attempting bank verification (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Simulate bank API delay
          await new Promise(resolve => setTimeout(resolve, 1000 + retryCount * 500));
          
          // Simulate bank verification (90% success rate)
          if (Math.random() > 0.1) {
            bankResponse = {
              success: true,
              bankReference: `VCB${Date.now()}${Math.floor(Math.random() * 1000)}`,
              verificationCode: generateTransactionId(),
              processedAt: new Date().toISOString(),
              fee: 11000 // Bank transfer fee
            };
            break;
          } else {
            throw new Error('Bank verification temporarily unavailable');
          }
        } catch (bankError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Không thể xác minh với ngân hàng sau 3 lần thử. Vui lòng thử lại sau.');
          }
          console.warn(`⚠️ Bank verification failed, retrying... (${retryCount}/${maxRetries})`);
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
        payment.discount = discount;
        payment.totalAmount = finalAmount;
        payment.bankReference = bankResponse.bankReference;
        payment.paymentType = 'full';
        payment.processingFee = bankResponse.fee;
        payment.verificationCode = bankResponse.verificationCode;

        // Update resident totals
        residentData.totalPaid += payment.amount;
        residentData.totalDue = Math.max(0, residentData.totalDue - payment.amount);
        
        // Update payment history analytics
        residentData.paymentHistory.successfulPayments += 1;
        residentData.paymentHistory.totalLateFees += lateFee;
        residentData.paymentHistory.totalDiscounts += discount;
        
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
        finalAmount,
        lateFee,
        discount,
        bankReference: bankResponse.bankReference,
        processingTime: Date.now() - parseInt(auditLog.id.slice(-6)),
        receipt: receipt.receiptId
      });

      // Step 9: Show success with detailed information
      const successMessage = `
        ✅ THANH TOÁN THÀNH CÔNG!
        
        📋 Thông tin giao dịch:
        • Mã giao dịch: ${selectedPayment.transactionId}
        • Mã ngân hàng: ${bankResponse.bankReference}
        • Số tiền: ${formatCurrency(finalAmount)}
        ${lateFee > 0 ? `• Phí trễ hạn: ${formatCurrency(lateFee)}` : ''}
        ${discount > 0 ? `• Giảm giá: -${formatCurrency(discount)}` : ''}
        • Phí giao dịch: ${formatCurrency(bankResponse.fee)}
        
        📧 Email xác nhận đã được gửi
        🧾 Biên lai: ${receipt.receiptId}
      `;

      alert(successMessage);
      setShowPaymentModal(false);
      setSelectedPayment(null);

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

  const calculateEarlyPaymentDiscount = (amount: number, dueDate: string, paymentDate: string) => {
    const due = new Date(dueDate);
    const payment = new Date(paymentDate);
    const diffTime = due.getTime() - payment.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 7) return Math.floor(amount * 0.05); // 5% discount for 7+ days early
    if (diffDays >= 3) return Math.floor(amount * 0.02); // 2% discount for 3+ days early
    return 0;
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
        discount: payment.discount,
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
                        {resident.residentName}
                      </h4>
                      <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0'}}>
                        {resident.relationship}
                      </p>
                      <div style={{fontSize: '0.875rem', color: '#374151'}}>
                        <p style={{margin: '0 0 0.25rem 0'}}>
                          Phí hàng tháng: <strong>{formatCurrency(resident.monthlyFee)}</strong>
                        </p>
                        <p style={{margin: '0'}}>
                          Còn phải trả: <strong style={{color: resident.totalDue > 0 ? '#dc2626' : '#16a34a'}}>
                            {formatCurrency(resident.totalDue)}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary for selected resident */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                    Đã thanh toán
                  </p>
                  <p style={{fontSize: '1.875rem', fontWeight: 700, color: '#16a34a', margin: 0}}>
                    {formatCurrency(familyFinancialData[selectedResident]?.totalPaid || 0)}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowTrendingUpIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                    Còn phải trả
                  </p>
                  <p style={{fontSize: '1.875rem', fontWeight: 700, color: '#dc2626', margin: 0}}>
                    {formatCurrency(familyFinancialData[selectedResident]?.totalDue || 0)}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowTrendingDownIcon style={{width: '1.5rem', height: '1.5rem', color: '#dc2626'}} />
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                    Lần thanh toán tiếp theo
                  </p>
                  <p style={{fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', margin: 0}}>
                    {new Date(familyFinancialData[selectedResident]?.nextPaymentDate || '').toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarDaysIcon style={{width: '1.5rem', height: '1.5rem', color: '#3b82f6'}} />
                </div>
              </div>
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
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <th style={{textAlign: 'left', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '25%'}}>
                      Mô tả dịch vụ
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '12%'}}>
                      Số tiền
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '12%'}}>
                      Hạn thanh toán
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '12%'}}>
                      Phương thức
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '15%'}}>
                      Trạng thái
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '24%'}}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {familyFinancialData[selectedResident]?.payments.map((payment) => (
                    <tr key={payment.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827'}}>
                        {payment.description}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', textAlign: 'center'}}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                          <span style={{color: '#111827', fontWeight: 500}}>
                            {new Date(payment.dueDate || payment.date).toLocaleDateString('vi-VN')}
                          </span>
                          {payment.dueDate && new Date(payment.dueDate) < new Date() && payment.status !== 'paid' && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#991b1b',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '1rem',
                              border: '1px solid #fecaca',
                              width: 'fit-content',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.1)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>
                              <XMarkIcon style={{
                                width: '0.875rem', 
                                height: '0.875rem',
                                color: '#dc2626',
                                strokeWidth: 2
                              }} />
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
                              bg: '#dcfce7', 
                              color: '#166534',
                              icon: <CheckCircleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            processing: { 
                              text: 'Đang xử lý', 
                              bg: '#dbeafe', 
                              color: '#1d4ed8',
                              icon: <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            pending: { 
                              text: 'Chờ thanh toán', 
                              bg: '#fef3c7', 
                              color: '#d97706',
                              icon: <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            grace_period: { 
                              text: 'Trong thời hạn gia hạn', 
                              bg: '#fed7aa', 
                              color: '#ea580c',
                              icon: <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            overdue: { 
                              text: 'Quá hạn', 
                              bg: '#fecaca', 
                              color: '#dc2626',
                              icon: <XMarkIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            }
                          };
                          
                          const config = statusConfig[status];
                          
                          return (
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '1.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: status === 'overdue' 
                                  ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                                  : status === 'grace_period'
                                  ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                                  : config.bg,
                                color: status === 'overdue' 
                                  ? '#991b1b'
                                  : status === 'grace_period'
                                  ? '#9a3412'
                                  : config.color,
                                border: status === 'overdue' 
                                  ? '1.5px solid #f87171'
                                  : status === 'grace_period'
                                  ? '1.5px solid #fb923c'
                                  : `1px solid ${config.color}30`,
                                boxShadow: status === 'overdue' 
                                  ? '0 3px 6px rgba(220, 38, 38, 0.2)'
                                  : status === 'grace_period'
                                  ? '0 3px 6px rgba(234, 88, 12, 0.2)'
                                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                textTransform: status === 'overdue' || status === 'grace_period' ? 'uppercase' : 'none',
                                letterSpacing: status === 'overdue' || status === 'grace_period' ? '0.025em' : 'normal',
                                minWidth: '120px',
                                justifyContent: 'center'
                              }}>
                                <span style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  strokeWidth: status === 'overdue' || status === 'grace_period' ? 2.5 : 2
                                }}>
                                  {config.icon}
                                </span>
                                <span style={{whiteSpace: 'nowrap'}}>
                                  {config.text}
                                  {status === 'overdue' && payment.lateFee > 0 && (
                                    <span style={{
                                      marginLeft: '0.375rem', 
                                      fontSize: '0.625rem',
                                      fontWeight: 800,
                                      color: '#dc2626',
                                      background: '#ffffff',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '0.75rem',
                                      border: '1px solid #fca5a5'
                                    }}>
                                      +{formatCurrency(payment.lateFee).replace('.000', 'K')}
                                    </span>
                                  )}
                                </span>
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
                                <button
                                  onClick={() => handleViewInvoice(payment)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '90px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <EyeIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  Chi tiết
                                </button>
                                
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
                                  onClick={() => handleViewInvoice(payment)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '90px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <EyeIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  Chi tiết
                                </button>
                                
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
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <BanknotesIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  {isUrgent ? 'Thanh toán' : 'Thanh toán'}
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

        {/* Professional Payment Modal - Market Standard */}
        {showPaymentModal && selectedPayment && (
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
              borderRadius: '0.75rem',
              maxWidth: '28rem',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              {/* Market-standard Header with Progress */}
              <div style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem',
                padding: '1.5rem',
                color: 'white',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                </button>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BanknotesIcon style={{width: '1.25rem', height: '1.25rem'}} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      Thanh toán
                    </h3>
                    <p style={{
                      fontSize: '0.8rem',
                      opacity: 0.9,
                      margin: '0.125rem 0 0 0'
                    }}>
                      Thực hiện thanh toán an toàn
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#16a34a',
                    fontWeight: 600
                  }}>1</div>
                  <div style={{
                    height: '2px',
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.3)'
                  }}></div>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>2</div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  marginTop: '0.5rem',
                  opacity: 0.9
                }}>
                  <span>Xác nhận</span>
                  <span>Hoàn thành</span>
                </div>
              </div>

              {/* Payment Summary - Market Standard */}
              <div style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 1rem 0'
                }}>
                  Thông tin đơn hàng
                </h4>
                
                {/* Order item */}
                <div style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <DocumentPlusIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                    </div>
                    <div style={{flex: 1}}>
                      <h5 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#111827',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {selectedPayment.description}
                      </h5>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Người thụ hưởng: {familyFinancialData[selectedResident]?.residentName}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          background: '#f3f4f6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}>
                          Đến hạn: {new Date(selectedPayment.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#16a34a',
                        margin: 0
                      }}>
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Price breakdown */}
                <div style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h6 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: '0 0 0.75rem 0'
                  }}>
                    Chi tiết thanh toán
                  </h6>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>Tổng tiền</span>
                    <span style={{fontSize: '0.875rem', color: '#111827', fontWeight: 500}}>
                      {formatCurrency(selectedPayment.amount)}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>Phí giao dịch</span>
                    <span style={{fontSize: '0.875rem', color: '#16a34a', fontWeight: 500}}>
                      Miễn phí
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem'
                  }}>
                    <span style={{fontSize: '1rem', color: '#111827', fontWeight: 600}}>Tổng thanh toán</span>
                    <span style={{fontSize: '1.25rem', color: '#dc2626', fontWeight: 700}}>
                      {formatCurrency(selectedPayment.amount)}
                    </span>
                  </div>
                </div>
              </div>

             

              {/* Market-standard Footer Actions */}
              <div style={{
                padding: '1.5rem',
                background: 'white',
                borderBottomLeftRadius: '0.75rem',
                borderBottomRightRadius: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessingPayment}
                    style={{
                      flex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.875rem',
                      background: isProcessingPayment 
                        ? '#d1d5db' 
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isProcessingPayment 
                        ? 'none' 
                        : '0 4px 14px 0 rgba(5, 150, 105, 0.39)'
                    }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div style={{
                          width: '1rem',
                          height: '1rem',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon style={{width: '1rem', height: '1rem'}} />
                        Xác nhận đã thanh toán
                      </>
                    )}
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#9ca3af'
                }}>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    background: '#e5e7eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{fontSize: '0.625rem', fontWeight: 600}}>?</span>
                  </div>
                  <span>Cần hỗ trợ? Gọi hotline: 1900-xxxx (24/7)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail Modal - Simplified & Business Logic Enhanced */}
        {showInvoiceModal && selectedPayment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '32rem',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}>
              {/* Simplified Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DocumentPlusIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0
                    }}>
                      Chi tiết hóa đơn
                    </h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: '0.125rem 0 0 0',
                      fontFamily: 'monospace'
                    }}>
                      {selectedPayment.invoiceId || `INV202406${String(selectedPayment.id).padStart(3, '0')}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  style={{
                    padding: '0.5rem',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                </button>
              </div>

              {/* Customer Information - Clean Layout */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <UserGroupIcon style={{width: '1rem', height: '1rem', color: '#3b82f6'}} />
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Thông tin cư dân
                  </h4>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8rem'}}>
                  <div>
                    <span style={{color: '#6b7280'}}>Họ và tên</span>
                    <div style={{fontWeight: 600, color: '#111827'}}>
                      {familyFinancialData[selectedResident]?.residentName}
                    </div>
                  </div>
                  <div>
                    <span style={{color: '#6b7280'}}>Mã cư dân</span>
                    <div style={{fontWeight: 600, color: '#111827', fontFamily: 'monospace'}}>
                      {familyFinancialData[selectedResident]?.residentId || `RES001`}
                    </div>
                  </div>
                  <div>
                    <span style={{color: '#6b7280'}}>Quan hệ</span>
                    <div style={{fontWeight: 600, color: '#111827'}}>
                      {familyFinancialData[selectedResident]?.relationship}
                    </div>
                  </div>
                  <div>
                    <span style={{color: '#6b7280'}}>Hợp đồng</span>
                    <div style={{fontWeight: 600, color: '#111827', fontFamily: 'monospace'}}>
                      {familyFinancialData[selectedResident]?.contractId || `CT2024001`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Detail */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #bbf7d0',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#166534',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                                 }}>
                   <DocumentPlusIcon style={{width: '1.25rem', height: '1.25rem'}} />
                   Dịch vụ đã đăng ký
                 </h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {/* Monthly Care Fee */}
                  <div style={{
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                                             <p style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                         <BuildingLibraryIcon style={{width: '1rem', height: '1rem', color: '#166534'}} />
                         Phí chăm sóc hàng tháng
                       </p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                        Dịch vụ chăm sóc toàn diện 24/7
                      </p>
                    </div>
                    <p style={{fontSize: '1rem', fontWeight: 700, color: '#166534', margin: 0}}>
                      {formatCurrency(familyFinancialData[selectedResident]?.monthlyFee || 0)}
                    </p>
                  </div>

                  {/* Additional Services */}
                  {familyFinancialData[selectedResident]?.additionalServices?.map((service, index) => (
                    <div key={index} style={{
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0}}>
                          🩺 {service.name}
                        </p>
                        <p style={{fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                          Tần suất: {service.frequency}
                        </p>
                      </div>
                      <p style={{fontSize: '1rem', fontWeight: 700, color: '#166534', margin: 0}}>
                        {formatCurrency(service.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div style={{
                background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                border: '2px solid #fde68a',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#92400e',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💰 Chi tiết thanh toán
                </h4>
                
                <div style={{background: 'white', borderRadius: '0.75rem', border: '1px solid #d1d5db', overflow: 'hidden'}}>
                  {/* Row Items */}
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f3f4f6'}}>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>Mô tả dịch vụ:</span>
                    <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827'}}>{selectedPayment.description}</span>
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f3f4f6'}}>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>Số tiền gốc:</span>
                    <span style={{fontSize: '1rem', fontWeight: 600, color: '#111827'}}>{formatCurrency(selectedPayment.originalAmount || selectedPayment.amount)}</span>
                  </div>

                  {selectedPayment.lateFee > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f3f4f6', background: '#fef2f2'}}>
                      <span style={{fontSize: '0.875rem', color: '#dc2626', fontWeight: 500}}>🚨 Phí trễ hạn:</span>
                      <span style={{fontSize: '1rem', fontWeight: 600, color: '#dc2626'}}>+{formatCurrency(selectedPayment.lateFee)}</span>
                    </div>
                  )}

                  {selectedPayment.discount > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f3f4f6', background: '#f0fdf4'}}>
                      <span style={{fontSize: '0.875rem', color: '#16a34a', fontWeight: 500}}>🎉 Giảm giá:</span>
                      <span style={{fontSize: '1rem', fontWeight: 600, color: '#16a34a'}}>-{formatCurrency(selectedPayment.discount)}</span>
                    </div>
                  )}
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f3f4f6'}}>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>Hạn thanh toán:</span>
                    <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827'}}>{new Date(selectedPayment.dueDate || selectedPayment.date).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {selectedPayment.paidDate && (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f3f4f6'}}>
                      <span style={{fontSize: '0.875rem', color: '#6b7280'}}>Ngày thanh toán:</span>
                      <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#16a34a'}}>{new Date(selectedPayment.paidDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f9fafb'}}>
                    <span style={{fontSize: '1.125rem', color: '#111827', fontWeight: 700}}>Tổng cộng:</span>
                    <span style={{fontSize: '1.5rem', fontWeight: 800, color: '#dc2626'}}>{formatCurrency(selectedPayment.totalAmount || selectedPayment.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              {selectedPayment.status === 'paid' && (
                <div style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '2px solid #86efac',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#166534',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ✅ Thông tin giao dịch
                  </h4>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                    <div>
                      <p style={{fontSize: '0.75rem', color: '#166534', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
                        Mã giao dịch
                      </p>
                      <p style={{fontSize: '0.875rem', color: '#111827', margin: 0, fontWeight: 600, fontFamily: 'monospace'}}>
                        {selectedPayment.transactionId || `TXN${selectedPayment.id}`}
                      </p>
                    </div>
                    
                    {selectedPayment.bankReference && (
                      <div>
                        <p style={{fontSize: '0.75rem', color: '#166534', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
                          Mã ngân hàng
                        </p>
                        <p style={{fontSize: '0.875rem', color: '#111827', margin: 0, fontWeight: 600, fontFamily: 'monospace'}}>
                          {selectedPayment.bankReference}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p style={{fontSize: '0.75rem', color: '#166534', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
                        Phương thức
                      </p>
                      <p style={{fontSize: '0.875rem', color: '#111827', margin: 0, fontWeight: 600}}>
                        {getPaymentMethodName(selectedPayment.method)}
                      </p>
                    </div>
                    
                    <div>
                      <p style={{fontSize: '0.75rem', color: '#166534', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
                        Trạng thái
                      </p>
                      <p style={{fontSize: '0.875rem', color: '#166534', margin: 0, fontWeight: 600}}>
                        ✅ Đã thanh toán thành công
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  style={{
                    padding: '0.875rem 1.5rem',
                    background: 'rgba(107, 114, 128, 0.1)',
                    border: '1px solid rgba(107, 114, 128, 0.2)',
                    borderRadius: '0.75rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Đóng
                </button>
                
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
      
      <div style={{
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}>
                <ChartBarIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  {user?.role === 'family' ? 'Thông tin tài chính' : 'Quản lý tài chính'}
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  {user?.role === 'family' ? 'Theo dõi chi phí chăm sóc người thân' : 'Theo dõi thu chi và báo cáo tài chính'}
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <Link 
                href="/finance/reports" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <ChartBarIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Báo cáo
              </Link>
              <Link 
                href="/finance/new-transaction" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <DocumentPlusIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Giao dịch mới
              </Link>
            </div>
          </div>
        </div>
        
        {/* Financial summary cards */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem'
        }}>
          {/* Income Card */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h2 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#166534', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Thu nhập
            </h2>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#16a34a',
                lineHeight: 1
              }}>
                {formatCurrency(totalIncome)}
              </div>
              <ArrowTrendingUpIcon style={{width: '3rem', height: '3rem', color: '#22c55e'}} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#166534',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              +12.5% so với tháng trước
            </div>
          </div>
          
          {/* Expenses Card */}
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h2 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#991b1b', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Chi phí
            </h2>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#dc2626',
                lineHeight: 1
              }}>
                {formatCurrency(totalExpenses)}
              </div>
              <ArrowTrendingDownIcon style={{width: '3rem', height: '3rem', color: '#ef4444'}} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#991b1b',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              -4.2% so với tháng trước
            </div>
          </div>
          
          {/* Balance Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <h2 style={{
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#1e40af', 
              marginBottom: '1rem', 
              marginTop: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Số dư
            </h2>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{
                fontSize: '2rem', 
                fontWeight: 700, 
                color: balance >= 0 ? '#2563eb' : '#dc2626',
                lineHeight: 1
              }}>
                {formatCurrency(balance)}
              </div>
              <BanknotesIcon style={{width: '3rem', height: '3rem', color: '#3b82f6'}} />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: balance >= 0 ? '#1e40af' : '#991b1b',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              {balance >= 0 ? '+18.7%' : '-8.3%'} so với tháng trước
            </div>
          </div>
        </div>
        
        {/* Filters and Transactions */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Filters */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap', 
              alignItems: 'center', 
              gap: '1.5rem'
            }}>
              <div style={{flex: '1', minWidth: '20rem'}}>
                <div style={{position: 'relative'}}>
                  <div style={{
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    pointerEvents: 'none'
                  }}>
                    <MagnifyingGlassIcon style={{width: '1.125rem', height: '1.125rem', color: '#9ca3af'}} />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm giao dịch..."
                    style={{
                      width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(22, 163, 74, 0.1)',
                  borderRadius: '0.5rem'
                }}>
                  <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#16a34a'}} />
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#16a34a'}}>
                    Lọc
                  </span>
                </div>
                <select
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    fontWeight: 500,
                    minWidth: '10rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    fontWeight: 500,
                    minWidth: '10rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div style={{overflowX: 'auto'}}>
            <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                }}>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Mô tả
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Loại
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'right', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Số tiền
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Ngày
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Trạng thái
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id} 
                    style={{
                      borderBottom: index !== filteredTransactions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#111827'
                    }}>
                      <div>
                        {transaction.description}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem'
                      }}>
                        Ref: {transaction.reference}
                      </div>
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.375rem 0.875rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '9999px',
                        background: 
                          transaction.category === 'Thu nhập' 
                            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: 
                          transaction.category === 'Thu nhập' ? '#166534' : '#dc2626',
                        border: '1px solid',
                        borderColor: transaction.category === 'Thu nhập' ? '#86efac' : '#fca5a5'
                      }}>
                        {transaction.category}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 700,
                      color: transaction.category === 'Thu nhập' ? '#16a34a' : '#dc2626',
                      textAlign: 'right'
                    }}>
                      {transaction.category === 'Thu nhập' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {new Date(transaction.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '0.375rem',
                        background: 
                          transaction.status === 'Đã xử lý' 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(245, 158, 11, 0.1)',
                        color: 
                          transaction.status === 'Đã xử lý' ? '#059669' : '#d97706',
                        border: '1px solid',
                        borderColor: transaction.status === 'Đã xử lý' ? '#86efac' : '#fbbf24'
                      }}>
                        {transaction.status}
                      </span>
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button
                          onClick={() => handleViewTransaction(transaction.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                          }}
                          title="Xem chi tiết giao dịch"
                        >
                          <EyeIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                        <button
                          onClick={() => handleEditTransaction(transaction.id)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                          }}
                          title="Chỉnh sửa giao dịch"
                        >
                          <PencilIcon style={{width: '1rem', height: '1rem'}} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td 
                      colSpan={6} 
                      style={{
                        padding: '3rem', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        fontSize: '1rem',
                        fontWeight: 500
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <ChartBarIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                        Không tìm thấy giao dịch nào
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Package Modal - Professional Package Management */}
        {showServiceModal && (
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
              borderRadius: '0.75rem',
              maxWidth: '42rem',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderTopLeftRadius: '0.75rem',
                borderTopRightRadius: '0.75rem',
                padding: '1.5rem',
                color: 'white',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowServiceModal(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <XMarkIcon style={{width: '1rem', height: '1rem'}} />
                </button>
                
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
                    <DocumentPlusIcon style={{width: '1.5rem', height: '1.5rem'}} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      margin: 0
                    }}>
                      Gói dịch vụ đang sử dụng
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      margin: '0.25rem 0 0 0'
                    }}>
                      {familyFinancialData[selectedResident]?.residentName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Overview */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '2px solid #bbf7d0',
                  borderRadius: '1rem',
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#166534',
                        margin: '0 0 0.5rem 0'
                      }}>
                        {(() => {
                          const registeredPackage = getRegisteredServicePackage();
                          return registeredPackage?.name || 'Chưa đăng ký gói dịch vụ';
                        })()}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#15803d',
                        margin: 0
                      }}>
                        {(() => {
                          const registeredPackage = getRegisteredServicePackage();
                          if (!registeredPackage) return 'Vui lòng liên hệ để đăng ký gói dịch vụ phù hợp';
                          return 'Dịch vụ chăm sóc toàn diện cho người cao tuổi';
                        })()}
                      </p>
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: (() => {
                        const registeredPackage = getRegisteredServicePackage();
                        if (!registeredPackage) return '#ef4444';
                        const status = registeredPackage.status;
                        if (status === 'pending_approval') return '#f59e0b';
                        if (status === 'active') return '#16a34a';
                        return '#6b7280';
                      })(),
                      borderRadius: '1rem',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {(() => {
                        const registeredPackage = getRegisteredServicePackage();
                        if (!registeredPackage) return 'CHƯA ĐĂNG KÝ';
                        const status = registeredPackage.status;
                        if (status === 'pending_approval') return 'CHỜ DUYỆT';
                        if (status === 'active') return 'ĐANG HOẠT ĐỘNG';
                        return 'KHÔNG XÁC ĐỊNH';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        margin: '0 0 0.25rem 0',
                        fontWeight: 600
                      }}>
                        Ngày bắt đầu
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: 0
                      }}>
                        {(() => {
                          const registeredPackage = getRegisteredServicePackage();
                          const startDate = registeredPackage?.startDate || registeredPackage?.purchaseDate || familyFinancialData[selectedResident]?.contractStartDate;
                          return startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa có thông tin';
                        })()}
                      </p>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        margin: '0 0 0.25rem 0',
                        fontWeight: 600
                      }}>
                        Mã hợp đồng
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: 0,
                        fontFamily: 'monospace'
                      }}>
                        {(() => {
                          const registeredPackage = getRegisteredServicePackage();
                          return registeredPackage?.registrationId || familyFinancialData[selectedResident]?.contractId || 'Chưa có';
                        })()}
                      </p>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        margin: '0 0 0.25rem 0',
                        fontWeight: 600
                      }}>
                        Chu kỳ thanh toán
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: 0
                      }}>
                        {familyFinancialData[selectedResident]?.paymentSchedule === 'monthly' ? 'Hàng tháng' : 
                         familyFinancialData[selectedResident]?.paymentSchedule === 'quarterly' ? 'Hàng quý' : 'Hàng năm'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <BuildingLibraryIcon style={{width: '1.25rem', height: '1.25rem', color: '#059669'}} />
                  Chi tiết dịch vụ
                </h4>

                {/* Base Service */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BuildingLibraryIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                      </div>
                      <div>
                        <h5 style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#111827',
                          margin: 0
                        }}>
                          Phí chăm sóc cơ bản
                        </h5>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          margin: '0.125rem 0 0 0'
                        }}>
                          Dịch vụ chăm sóc hàng ngày, ăn uống, y tế cơ bản
                        </p>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <p style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#3b82f6',
                        margin: 0
                      }}>
                        {(() => {
                          const registeredPackage = getRegisteredServicePackage();
                          return formatCurrency(registeredPackage?.finalPrice || registeredPackage?.price || familyFinancialData[selectedResident]?.monthlyFee || 0);
                        })()}
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        /tháng
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Services */}
                {familyFinancialData[selectedResident]?.additionalServices?.map((service, index) => (
                  <div key={service.id} style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          background: service.isActive 
                            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                            : '#d1d5db',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <DocumentPlusIcon style={{
                            width: '1.25rem', 
                            height: '1.25rem', 
                            color: service.isActive ? 'white' : '#9ca3af'
                          }} />
                        </div>
                        <div>
                          <h5 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: service.isActive ? '#111827' : '#6b7280',
                            margin: 0
                          }}>
                            {service.name}
                          </h5>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.125rem'
                          }}>
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              margin: 0
                            }}>
                              {service.frequency}
                            </p>
                            <span style={{
                              width: '0.25rem',
                              height: '0.25rem',
                              background: '#d1d5db',
                              borderRadius: '50%'
                            }}></span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: service.isActive ? '#059669' : '#ef4444',
                              fontWeight: 600,
                              padding: '0.125rem 0.5rem',
                              background: service.isActive ? '#dcfce7' : '#fee2e2',
                              borderRadius: '0.25rem'
                            }}>
                              {service.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <p style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: service.isActive ? '#059669' : '#6b7280',
                          margin: 0
                        }}>
                          {formatCurrency(service.amount)}
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          /{service.frequency}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Package Summary */}
              <div style={{
                padding: '1.5rem',
                background: '#f8fafc'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 1rem 0'
                }}>
                  Tổng kết gói dịch vụ
                </h4>
                
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
                      Phí cơ bản hàng tháng
                    </span>
                    <span style={{fontSize: '0.875rem', color: '#111827', fontWeight: 500}}>
                      {formatCurrency(familyFinancialData[selectedResident]?.monthlyFee || 0)}
                    </span>
                  </div>
                  
                  {familyFinancialData[selectedResident]?.additionalServices?.filter(s => s.isActive).map((service) => (
                    <div key={service.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        {service.name}
                      </span>
                      <span style={{fontSize: '0.875rem', color: '#111827', fontWeight: 500}}>
                        {formatCurrency(service.amount)}
                      </span>
                    </div>
                  ))}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem'
                  }}>
                    <span style={{fontSize: '1rem', color: '#111827', fontWeight: 600}}>
                      Tổng chi phí hàng tháng
                    </span>
                    <span style={{fontSize: '1.5rem', color: '#059669', fontWeight: 700}}>
                      {formatCurrency(
                        (familyFinancialData[selectedResident]?.monthlyFee || 0) +
                        (familyFinancialData[selectedResident]?.additionalServices?.filter(s => s.isActive).reduce((sum, s) => sum + s.amount, 0) || 0)
                      )}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: '0.5rem',
                  border: '1px solid #dbeafe'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#1e40af',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CheckCircleIcon style={{width: '1rem', height: '1rem'}} />
                    <strong>Lưu ý:</strong> Gói dịch vụ có thể được điều chỉnh theo nhu cầu. Liên hệ bộ phận chăm sóc khách hàng để thay đổi hoặc nâng cấp gói.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '1.5rem',
                background: 'white',
                borderBottomLeftRadius: '0.75rem',
                borderBottomRightRadius: '0.75rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setShowServiceModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Đóng
                  </button>
                  <button
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.39)'
                    }}
                  >
                    Liên hệ điều chỉnh gói
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
